import { CancellationToken, Hover, HoverParams, MarkupKind, Position, Range } from 'vscode-languageserver';
import { BBString } from '../bbtag/BBString';
import { BBSubtag } from '../bbtag/BBSubtag';
import { stringifySignature } from '../bbtag/stringifyDetails';
import { SubtagDetails, SubtagSignature, SubtagSignatureParameter } from '../bbtag/SubtagDetails';
import { Server } from '../server';
import { raceCancellation, positionComparer } from '../utils';

export class BBTagHoverHandler {
	readonly #server: Server;

	public constructor(server: Server) {
		this.#server = server;

		this.#server.connection.onHover(this.getHover.bind(this));
		this.#server.addCapability('hoverProvider', true);
	}

	public async getHover(hover: HoverParams, token: CancellationToken): Promise<Hover | undefined> {
		const subtagDetailsPromise = this.#server.getSubtags();
		const bbtag = this.#server.getBBTag(hover.textDocument.uri);
		if (!this.#pointInRange(bbtag.range, hover.position))
			return undefined;

		const subtag = this.#findSubtag(bbtag, hover.position);
		if (subtag === undefined)
			return undefined;

		if (subtag.name.subtags.length > 0)
			return { range: subtag.name.range, contents: { kind: MarkupKind.Markdown, value: `\`\`\`bbtag\nDynamic Subtag {${subtag.name.source}}\n\`\`\`` } };

		const subtagDetails = await raceCancellation(subtagDetailsPromise, token);
		if (subtagDetails === undefined)
			return;

		const details = subtagDetails.get(subtag.name.source);
		if (details === undefined)
			return { range: subtag.name.range, contents: { kind: MarkupKind.Markdown, value: `\`\`\`bbtag\nUnknown Subtag {${subtag.name.source}}\n\`\`\`` } };

		const markdown = [
			`\`\`\`bbtag\n{${details.name}} Subtag\n\`\`\``,
			`[Documentation on blargbot.xyz](https://blargbot.xyz/bbtag/subtags#${details.name})`
		];

		if (details.description !== undefined)
			markdown.push(details.description);

		let signatures: readonly SubtagSignature[] = details.signatures.filter(s => s.subtagName === subtag.name.source);
		if (signatures.length === 0)
			signatures = details.signatures;

		// todo: pick pick signature based on arg counts

		for (const signature of signatures) {
			let md = `\`\`\`bbtag\n${stringifySignature(details, signature)}\n\`\`\``;
			if (signature.description.length > 0)
				md += `\n\n${signature.description}`;
			markdown.push(md);
		}

		return {
			range: subtag.name.range,
			contents: {
				kind: MarkupKind.Markdown,
				value: markdown.join('\n\n---\n\n')
			}
		};
	}


	#findSubtag(bbtag: BBString, position: Position): BBSubtag | undefined {
		let current: BBString | undefined = bbtag;
		let result: BBSubtag | undefined;
		while (current !== undefined) {
			const subtag: BBSubtag | undefined = current.subtags.find(s => this.#pointInRange(s.range, position));
			if (subtag === undefined)
				break;

			if (this.#pointInRange(subtag.name.range, position)) {
				result = subtag;
				current = subtag.name;
			} else {
				current = subtag.args.find(a => this.#pointInRange(a.range, position));
			}
		}
		return result;
	}

	#pointInRange(range: Range, position: Position): boolean {
		return positionComparer.le(range.start, position) && positionComparer.ge(range.end, position);
	}
}

export function init(server: Server) {
	new BBTagHoverHandler(server);
}
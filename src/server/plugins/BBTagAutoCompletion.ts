import { CancellationToken, CompletionItem, CompletionItemKind, InsertTextFormat, Position, Range, TextDocumentPositionParams, TextEdit } from 'vscode-languageserver';
import { BBString } from '../bbtag/BBString';
import { BBSubtag } from '../bbtag/BBSubtag';
import { SubtagDetails, SubtagSignature } from '../bbtag/SubtagDetails';
import { SubtagDetailsLookup } from '../bbtag/SubtagDetailsLookup';
import { Server } from '../Server';
import { positionComparer, raceCancellation } from '../utils';

type SignatureCompletionItemFactory = (context: { definition: SubtagDetails, signature: SubtagSignature, name: string, pattern: string[], insertText: string }) => Partial<CompletionItem>;

export class BBTagAutoCompletion {
	readonly #server: Server;

	public constructor(server: Server) {
		this.#server = server;

		this.#server.connection.onCompletion(this.getCompletionItems.bind(this));
		this.#server.addCapability('completionProvider', { triggerCharacters: ["{", ";"] });
	}

	public async getCompletionItems(position: TextDocumentPositionParams, token: CancellationToken): Promise<CompletionItem[] | undefined> {
		const definitions = await raceCancellation(this.#server.getSubtags(), token);
		if (definitions === undefined)
			return undefined;

		const bbtag = this.#server.getBBTag(position.textDocument.uri);
		const subtag = this.#findSubtag(bbtag, position.position);

		const enricher: SignatureCompletionItemFactory = subtag === undefined
			? (ctx => ({ insertText: ctx.insertText }))
			: (ctx => ({ textEdit: { newText: ctx.insertText, range: subtag.range } }));
		return [...this.#getCompletionItemsForDefinition(definitions.all(), enricher)];
	}

	* #getCompletionItemsForDefinition(definitions: Iterable<SubtagDetails>, factory: SignatureCompletionItemFactory): Generator<CompletionItem> {
		for (const definition of definitions) {
			for (const signature of definition.signatures) {
				const patterns: string[][] = [[]];
				for (const parameter of [...signature.parameters].flatMap(p => 'nested' in p ? p.nested : p)) {
					if (parameter.required) {
						for (const pattern of patterns) {
							pattern.push(parameter.name);
						}
					} else {
						patterns.push([...patterns[0]]);
						patterns[0].push(parameter.name);
					}
				}
				const names = signature.subtagName === undefined ? [definition.name, ...definition.aliases] : [signature.subtagName];

				for (const name of names) {
					if (!/^[^a-z]/i.test(name)) {
						for (const pattern of patterns) {
							yield {
								label: `{${[name, ...pattern].join(';')}}`,
								filterText: `{${name}}`,
								documentation: signature.description,
								kind: CompletionItemKind.Function,
								insertTextFormat: InsertTextFormat.Snippet,
								sortText: `${name}|${pattern.length.toString().padStart(4, '0')}|${pattern.join('|')}`,
								...factory({
									definition,
									signature,
									name,
									pattern,
									insertText: `{${[name, ...pattern.map((p, i) => `\${${i + 1}:{//;${p}\\}}`)].join(';')}}`
								})
							};
						}
					}
				}
			}
		}
	}

	#findSubtag(bbtag: BBString, position: Position): BBSubtag | undefined {
		let current: BBString | undefined = bbtag;
		let result: BBSubtag | undefined;
		while (current !== undefined) {
			const subtag: BBSubtag | undefined = current.subtags.find(s => this.#pointInRange(s.range, position));
			if (subtag === undefined)
				break;

			result = subtag;
			current = [subtag.name, ...subtag.args].find(x => this.#pointInRange(x.range, position));
		}
		return result;
	}

	#pointInRange(range: Range, position: Position): boolean {
		return positionComparer.le(range.start, position) && positionComparer.ge(range.end, position);
	}
}

export function init(server: Server) {
	new BBTagAutoCompletion(server);
}
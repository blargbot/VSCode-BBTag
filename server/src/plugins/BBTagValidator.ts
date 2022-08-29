import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BBString } from '../bbtag/BBString';
import { Server } from '../server';
import { SubtagDetailsLookup } from '../bbtag/SubtagDetailsLookup';
import { server } from '../start';
import { BBSubtag } from '../bbtag/BBSubtag';

export class BBTagValidator {
	readonly #server: Server;

	public constructor(server: Server) {
		this.#server = server;

		server.connection.onDidChangeConfiguration(this.validateAll.bind(this));
		server.documents.onDidChangeContent(c => this.validate(c.document));
	}

	public async validateAll(): Promise<void> {
		await Promise.all(
			server.documents.all().map(doc => this.validate(doc))
		);
	}

	public async validate(document: TextDocument): Promise<void> {
		const diagnostics = [];
		for await (const diagnostic of this.getDiagnostics(document))
			diagnostics.push(diagnostic);

		this.#server.connection.sendDiagnostics({ uri: document.uri, diagnostics });
	}

	public async * getDiagnostics(document: TextDocument): AsyncIterable<Diagnostic> {
		const subtagsPromise = server.getSubtags();
		const config = await server.getConfiguration(document.uri);
		if (config.maxNumberOfProblems === 0)
			return;

		const subtags = await subtagsPromise;
		const bbtag = server.getBBTag(document.uri);
		let count = 0;
		for await (const diagnostic of this.#getStringDiagnostics(bbtag, subtags)) {
			yield diagnostic;
			if (++count >= config.maxNumberOfProblems)
				break;
		}
	}

	* #getStringDiagnostics(bbtag: BBString, subtags: SubtagDetailsLookup): Iterable<Diagnostic> {
		for (const position of bbtag.unexpectedCloses)
			yield { range: { start: position, end: position }, message: "Unexpected closing '}'" };

		for (const subtag of bbtag.subtags)
			yield* this.#getSubtagDiagnostics(subtag, subtags);
	}

	* #getSubtagChildDiagnostics(bbtag: BBSubtag, subtags: SubtagDetailsLookup): Iterable<Diagnostic> {
		yield* this.#getStringDiagnostics(bbtag.name, subtags);
		for (const arg of bbtag.args)
			yield* this.#getStringDiagnostics(arg, subtags);
	}

	* #getSubtagDiagnostics(bbtag: BBSubtag, subtags: SubtagDetailsLookup): Iterable<Diagnostic> {
		if (bbtag.isMissingClose)
			yield { range: bbtag.range, message: "Missing closing '}'" };

		if (bbtag.name.subtags.length > 0) {
			yield {
				range: bbtag.name.range,
				message: "Dynamic subtag found. Validation cannot be performed (yet)",
				severity: DiagnosticSeverity.Warning
			};
			yield* this.#getSubtagChildDiagnostics(bbtag, subtags);
			return;
		}

		const name = bbtag.name.source.toLowerCase();
		const details = subtags.get(name);

		// Show error if subtag isnt found. Func is a special case where the name can be variable
		if (details === undefined && !name.startsWith('func.'))
			yield { range: bbtag.name.range, message: `Unknown SubTag: '${name}'` };

		//todo: validate argument counts

		// Recursively analyze subtags, except within the comment subtag.
		if (details?.name !== 'comment')
			yield* this.#getSubtagChildDiagnostics(bbtag, subtags);
	}
}

export function init(server: Server) {
	new BBTagValidator(server);
}
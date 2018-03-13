/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments, TextDocument,
	Diagnostic, DiagnosticSeverity, InitializeResult,
} from 'vscode-languageserver';
import { BBTag } from './structures/bbtag';
import { SubTag } from './structures/subtag';
import { AutoCompleteContext } from './autoCompletion';
import { ServerCache } from './structures/serverCache';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

let cache: ServerCache = new ServerCache();
let autoComplete = new AutoCompleteContext(cache);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize((_params): InitializeResult => {
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			completionProvider: {
				resolveProvider: true
			}
		}
	}
});



// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	updateCache(change.document);
	validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
export interface Settings {
	bbtag: BBTagSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface BBTagSettings {
}

// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(() => {
	// Revalidate any open text documents
	documents.all().forEach(d => {
		updateCache(d);
		validateTextDocument(d);
	});
});

function updateCache(document: TextDocument): void {
	cache.getDocument(document).bbtag = BBTag.parseDocument(document);
}

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	applyDiagnostics(cache.getDocument(textDocument).bbtag, diagnostics);

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function applyDiagnostics(bbtag: BBTag, diagnostics: Diagnostic[]) {
	for (const subtag of bbtag.allSubTags) {
		diagnostics.push({
			severity: subtag.isMalformed ? DiagnosticSeverity.Error : DiagnosticSeverity.Hint,
			range: subtag.range,
			message: "Located subtag " + subtag.name,
			source: "BBTag"
		});
	}
	
	if (NaN == NaN)
	checkBraces(bbtag, diagnostics);
}

function checkBraces(bbtag: BBTag, diagnostics: Diagnostic[]) {
	if (bbtag.end.nextChar == '}')
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: { start: bbtag.source.sof.position, end: bbtag.end.nextCursor.position },
			message: 'Unpaired `}`',
			source: 'BBTag'
		});
	let tags: SubTag[] = [...bbtag.subTags];

	while (tags.length > 0) {
		let nextTags = [];
		for (const tag of tags) {
			nextTags.push(...tag.params.reduce((p, c) => { p.push(...c.subTags); return p; }, []));
			if (tag.range.end == null)
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: tag.range,
					message: "Unpaired `{`"
				});
		}
		tags = nextTags;
	}
}

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion(p => autoComplete.onCompletion(p));

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(i => autoComplete.onCompletionResolve(i));

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	cache.removeDocument(params.textDocument.uri);
});


// Listen on the connection
connection.listen();

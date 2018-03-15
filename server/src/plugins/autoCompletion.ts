import { CompletionItem, TextDocumentPositionParams, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import SubTagDefinitions from '../data/subtagDefinition';
import server from '../server';

function onCompletion(_docPos: TextDocumentPositionParams): CompletionItem[] {
    return SubTagDefinitions.list.map((d, i) => {
        return <CompletionItem>{
            label: d.name,
            filterText: '{' + d.name,
            insertText: '{' + [d.name].concat(d.parameters.map((p, j) => 'name' in p ? '${' + j + ':' + p.name + '}' : '')).join(';') + '}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Snippet,
            data: { id: i }
        }
    });
}

function onCompletionResolve(item: CompletionItem): CompletionItem {
    return item;
}

server.onCompletion(onCompletion);
server.onCompletionResolve(onCompletionResolve);
server.onInitialize(_ => { return { capabilities: { completionProvider: { resolveProvider: true, triggerCharacters: ['{', ';'] } } }; })
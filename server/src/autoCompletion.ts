import { CompletionItem, TextDocumentPositionParams } from "vscode-languageserver/lib/main";
import SubTagDefinitions from "./data/subtags";
import { ServerCache } from "./structures/serverCache";

console.log(SubTagDefinitions);

export class AutoCompleteContext {
    private readonly _cache: ServerCache;

    constructor(cache: ServerCache) {
        this._cache = cache;
    }

    public onCompletionResolve(item: CompletionItem): CompletionItem {
        this._cache;
        console.log("OnCompletionResolve", item);
        return null;
    }

    public onCompletion(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
        console.log("OnCompletion", textDocumentPosition);
        let bbtag = this._cache.getDocument(textDocumentPosition.textDocument.uri).bbtag;
        let container = bbtag.locate(textDocumentPosition.position);
        console.log(container);
        return null;
    }
}
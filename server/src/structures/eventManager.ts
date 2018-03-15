import { CacheEntry } from "./serverCache";
import { TextDocument, InitializeParams, InitializeResult, DidChangeConfigurationParams, InitializeError, TextDocumentPositionParams, CompletionItem, CompletionList } from "vscode-languageserver/lib/main";
import { NotificationHandler, RequestHandler } from "vscode-languageserver";
import { HandlerResult } from "vscode-jsonrpc";
import { Server } from "../server";

interface Event<THandler extends Function> {
    list: Set<THandler>;
    add(handler: THandler): void;
    remove(handler: THandler): void;
}

export function MakeEvent<THandler extends Function, TResult = void>(reduce: (results: TResult[]) => TResult): THandler & Event<THandler> {
    let result = function (...args: any[]) {
        let results: TResult[] = [];
        for (const handler of result.list)
            results.push(handler(...args));
        return reduce(results);
    } as any as THandler & Event<THandler>

    result.list = new Set<THandler>();
    result.add = function (handler: THandler) { result.list.add(handler); };
    result.remove = function (handler: THandler) { result.list.delete(handler); };

    return result;
}

export type DocumentEvent = (e: TextDocument) => void;
export type InitializeEvent = RequestHandler<InitializeParams, InitializeResult, InitializeError>;
export type InitializeEventResult = HandlerResult<InitializeResult, InitializeError>;
export type CompletionEvent = RequestHandler<TextDocumentPositionParams, CompletionItem[] | CompletionList, void>;
export type CompletionEventResult = HandlerResult<CompletionItem[] | CompletionList, void>;
export type CompletionResolveEvent = RequestHandler<CompletionItem, CompletionItem, void>;
export type CompletionResolveEventResult = HandlerResult<CompletionItem, void>;
export type CacheEvent = (cache: CacheEntry, doc: TextDocument) => void;

export class ServerEventManager {
    public readonly onInitialize = MakeEvent<InitializeEvent, InitializeEventResult>(results => {
        return {
            capabilities: Object.assign({}, ...results.map(p => 'capabilities' in p ? p.capabilities : null))
        } as InitializeResult;
    })
    public readonly onChangeConfig = MakeEvent<NotificationHandler<DidChangeConfigurationParams>>(_ => { });
    public readonly onCompletion = MakeEvent<CompletionEvent, CompletionEventResult>(items => [].concat(...items));
    public readonly onCompletionResolve = MakeEvent<CompletionResolveEvent, CompletionResolveEventResult>(items => Object.assign({}, ...items));
    public readonly onCache = MakeEvent<CacheEvent>(_ => { });
    public readonly onDocumentUpdate = MakeEvent<DocumentEvent>(_ => { });
    public readonly onOpen = MakeEvent<DocumentEvent>(_ => { });
    public readonly onClose = MakeEvent<DocumentEvent>(_ => { });

    public listen(server: Server) {
        let self = this;

        server.connection.onInitialize(this.onInitialize);        
        server.connection.onDidChangeConfiguration(this.onChangeConfig);
        server.connection.onCompletion(this.onCompletion);
        server.connection.onCompletionResolve(this.onCompletionResolve);

        server.documents.onDidChangeContent(d => self.onDocumentUpdate(d.document));
        server.documents.onDidClose(d => self.onClose(d.document));
        server.documents.onDidOpen(d => self.onOpen(d.document));
    }
}
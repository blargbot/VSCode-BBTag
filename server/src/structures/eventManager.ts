import { CacheEntry } from "./serverCache";
import { TextDocument, InitializeParams, InitializeResult, DidChangeConfigurationParams, InitializeError, TextDocumentPositionParams, CompletionItem, CompletionList, ColorPresentationParams, ColorPresentation, DocumentColorParams, ColorInformation, DocumentSymbolParams, SymbolInformation } from "vscode-languageserver/lib/main";
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
export type ColorPresentationEvent = RequestHandler<ColorPresentationParams, ColorPresentation[], void>;
export type ColorPresentationEventResult = HandlerResult<ColorPresentation[], void>;
export type CacheEvent = (cache: CacheEntry, doc: TextDocument) => void;
export type ConfigChangeEvent = NotificationHandler<DidChangeConfigurationParams>;
export type DocumentColorEvent = RequestHandler<DocumentColorParams, ColorInformation[], void>;
export type DocumentColorEventResult = HandlerResult<ColorInformation[], void>;
export type DocumentSymbolEvent = RequestHandler<DocumentSymbolParams, SymbolInformation[], void>;
export type DocumentSymbolEventResult = HandlerResult<SymbolInformation[], void>;

export interface ServerEvents {
    onInitialize: Event<InitializeEvent>,
    onCompletion: Event<CompletionEvent>,
    onCompletionResolve: Event<CompletionResolveEvent>,
    onColorPresentation: Event<ColorPresentationEvent>,
    onDocumentSymbol: Event<DocumentSymbolEvent>,
    onDocumentColor: Event<DocumentColorEvent>,
    onChangeConfig: Event<ConfigChangeEvent>,
    onUpdateCache: Event<CacheEvent>,
    onDocumentUpdate: Event<DocumentEvent>
    onClose: Event<DocumentEvent>
    onOpen: Event<DocumentEvent>
}

export class ServerEventManager {
    public readonly onInitialize = MakeEvent<InitializeEvent, InitializeEventResult>(results => {
        return {
            capabilities: Object.assign({}, ...results.map(p => 'capabilities' in p ? p.capabilities : null))
        } as InitializeResult;
    })
    //server.connection
    public readonly onChangeConfig = MakeEvent<ConfigChangeEvent>(_ => { });
    public readonly onCompletion = MakeEvent<CompletionEvent, CompletionEventResult>(items => [].concat(...items));
    public readonly onCompletionResolve = MakeEvent<CompletionResolveEvent, CompletionResolveEventResult>(responses => Object.assign({}, ...responses));
    public readonly onColorPresentation = MakeEvent<ColorPresentationEvent, ColorPresentationEventResult>(responses => [].concat(...responses));
    public readonly onDocumentColor = MakeEvent<DocumentColorEvent, DocumentColorEventResult>(responses => [].concat(...responses));
    public readonly onDocumentSymbol = MakeEvent<DocumentSymbolEvent, DocumentSymbolEventResult>(responses => [].concat(...responses));

    //server.documents
    public readonly onOpen = MakeEvent<DocumentEvent>(_ => { });
    public readonly onClose = MakeEvent<DocumentEvent>(_ => { });

    //custom
    public readonly onDocumentUpdate = MakeEvent<DocumentEvent>(_ => { });
    public readonly onCache = MakeEvent<CacheEvent>(_ => { });

    public listen(server: Server) {
        let self = this;

        server.connection.onInitialize(this.onInitialize);
        server.connection.onDidChangeConfiguration(this.onChangeConfig);
        server.connection.onCompletion(this.onCompletion);
        server.connection.onCompletionResolve(this.onCompletionResolve);
        server.connection.onColorPresentation(this.onColorPresentation);
        server.connection.onDocumentColor(this.onDocumentColor);
        server.connection.onDocumentSymbol(this.onDocumentSymbol);

        server.documents.onDidChangeContent(d => self.onDocumentUpdate(d.document));
        server.documents.onDidClose(d => self.onClose(d.document));
        server.documents.onDidOpen(d => self.onOpen(d.document));
    }

    public eventEndpoints: ServerEvents = {
        onInitialize: this.onInitialize,
        onCompletion: this.onCompletion,
        onCompletionResolve: this.onCompletionResolve,
        onColorPresentation: this.onColorPresentation,
        onDocumentSymbol: this.onDocumentSymbol,
        onDocumentColor: this.onDocumentColor,
        onChangeConfig: this.onChangeConfig,
        onUpdateCache: this.onCache,
        onDocumentUpdate: this.onDocumentUpdate,
        onClose: this.onClose,
        onOpen: this.onOpen,
    }
}
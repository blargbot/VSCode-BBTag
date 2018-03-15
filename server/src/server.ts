'use strict';

import * as extensions from './extensions';
import {
    IPCMessageReader,
    IPCMessageWriter,
    createConnection,
    TextDocuments
} from 'vscode-languageserver';
import { BBTag } from './structures/bbtag';
import { ServerCache } from './structures/serverCache';
import { BBTagConfig } from './structures/config';
import { ServerEventManager } from './structures/eventManager';

export class Server {
    private readonly _events = new ServerEventManager();

    public readonly connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    public readonly documents = new TextDocuments();
    public readonly cache = new ServerCache(this.documents);
    public config: BBTagConfig;

    constructor() {
        let self = this;
        this.documents.listen(this.connection);

        this.onInitialize(_ => { return { capabilities: { textDocumentSync: self.documents.syncKind } }; });
        this.onChangeConfig(p => self.config = p.settings.bbtag);
        this.onChangeConfig(_ => self.documents.all().forEach(d => self._events.onDocumentUpdate(d)));

        this.onDocumentUpdate(doc => self._events.onCache(this.cache.getDocument(doc), doc));
        this.onUpdateCache((e, d) => e.bbtag = BBTag.parseDocument(d));

        this._events.listen(this);
    }

    public start(): void {
        this.connection.listen();
    }

    public readonly onInitialize = this._events.onInitialize.add;
    public readonly offInitialize = this._events.onInitialize.remove;
    public readonly onCompletion = this._events.onCompletion.add;
    public readonly offCompletion = this._events.onCompletion.remove;
    public readonly onCompletionResolve = this._events.onCompletionResolve.add;
    public readonly offCompletionResolve = this._events.onCompletionResolve.remove;
    public readonly onChangeConfig = this._events.onChangeConfig.add;
    public readonly offChangeConfig = this._events.onChangeConfig.remove;
    public readonly onUpdateCache = this._events.onCache.add;
    public readonly offUpdateCache = this._events.onCache.remove;
    public readonly onDocumentUpdate = this._events.onDocumentUpdate.add;
    public readonly offDocumentUpdate = this._events.onDocumentUpdate.remove;
    public readonly onClose = this._events.onClose.add;
    public readonly offClose = this._events.onClose.remove;
    public readonly onOpen = this._events.onOpen.add;
    public readonly offOpen = this._events.onOpen.remove;
}

let server = new Server();
server.start();

export default server;
export const plugins = extensions.requireFolder('./plugins', f => f.split('.')[0]);
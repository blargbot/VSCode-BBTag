import * as extensions from "../common/extensions";
import {
    IPCMessageReader,
    IPCMessageWriter,
    createConnection,
    TextDocuments
} from "vscode-languageserver";
import { BBTag } from "../common/structures/bbtag";
import { Cache } from "./structures/cache";
import { BBTagConfig } from "./structures/config";
import { ServerEventManager, ServerEvents } from "./structures/eventManager";

export class Server {
    private readonly _events = new ServerEventManager();

    public readonly connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    public readonly documents = new TextDocuments();
    public readonly cache = new Cache(this.documents);
    public config: BBTagConfig;

    public get events(): ServerEvents { return this._events.eventEndpoints; };

    constructor() {
        let self = this;
        this.documents.listen(this.connection);

        this.events.onInitialize.add(_ => { return { capabilities: { textDocumentSync: self.documents.syncKind } }; });
        this.events.onChangeConfig.add(p => self.config = p.settings.bbtag);
        this.events.onChangeConfig.add(_ => self.documents.all().forEach(d => self._events.onDocumentUpdate(d)));
        this.events.onChangeConfig.add(_ => console.log("Settings updated"));

        this.events.onDocumentUpdate.add(doc => self._events.onCache(this.cache.getDocument(doc), doc));
        this.events.onUpdateCache.add((e, d) => e.bbtag = BBTag.parseDocument(d));

        this._events.listen(this);
    }

    public start(): void {
        this.connection.listen();
    }
}

let server = new Server();
server.start();

export default server;
export const plugins = extensions.requireFolder("../server/plugins", f => f.split(".")[0]);
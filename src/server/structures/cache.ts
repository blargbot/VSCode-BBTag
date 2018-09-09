import { BBString } from "../../common/structures/bbtag";
import { TextDocument, TextDocuments, TextDocumentIdentifier } from "vscode-languageserver";

export class Cache {
    private readonly _entries: { [key: string]: CacheEntry } = {};
    private readonly _documents: TextDocuments;

    constructor(documents: TextDocuments) {
        this._documents = documents;
    }

    public getDocument(document: TextDocument | TextDocumentIdentifier | string): CacheEntry {
        if (typeof document != "string") document = document.uri;
        return this._entries[document] || (this._entries[document] = new CacheEntry(document, this._documents));
    }

    public removeDocument(document: TextDocument | string): void {
        if (typeof document != "string") document = document.uri;
        delete this._entries[document];
    }

    public listDocuments(): CacheEntry[] {
        return Object.keys(this._entries).map(k => this._entries[k]);
    }
}

export class CacheEntry {
    public readonly uri: string;
    private readonly _values: { [key: string]: any } = {};
    private readonly _textDocuments: TextDocuments;

    constructor(uri: string, textDocuments: TextDocuments) {
        this.uri = uri;
        this._textDocuments = textDocuments;
    }

    public get bbtag(): Promise<BBString> { return this.get<Promise<BBString>>("bbtag"); }
    public set bbtag(value: Promise<BBString>) { this.set("bbtag", value); }
    public get document(): TextDocument { return this._textDocuments.get(this.uri); }

    public get<T>(key: string): T {
        return <T>this._values[key];
    }

    public set<T>(key: string, value: T): void {
        this._values[key] = value;
    }
}
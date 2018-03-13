import { BBTag } from './bbtag';
import { TextDocument } from 'vscode-languageserver/lib/main';

export class ServerCache {
    private readonly _entries: { [key: string]: CacheEntry } = {};

    public getDocument(document: TextDocument | string): CacheEntry {
        if (typeof document != 'string') document = document.uri;
        return this._entries[document] || (this._entries[document] = new CacheEntry(document));
    }

    public removeDocument(document: TextDocument | string): void {
        if (typeof document != 'string') document = document.uri;
        delete this._entries[document];
    }

    public listDocuments(): CacheEntry[] {
        return Object.keys(this._entries).map(k => this._entries[k]);
    }
}

export class CacheEntry {
    public readonly uri: string;
    private readonly _values: { [key: string]: any } = {};

    constructor(uri: string) { this.uri = uri; }

    public get bbtag(): BBTag { return this.get<BBTag>('bbtag'); }
    public set bbtag(value: BBTag) { this.set('bbtag', value); }

    public get<T>(key: string): T {
        return <T>this._values[key];
    }

    public set<T>(key: string, value: T): void {
        this._values[key] = value;
    }
}
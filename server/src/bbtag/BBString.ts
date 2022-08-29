import { BBSubtag } from "./BBSubtag";
import { CursorNavigator, CursorMap, Cursor } from "./CursorMap";
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position, Range } from 'vscode-languageserver';

export class BBString {
    public static parseDocument(document: TextDocument): BBString {
        const map = new CursorMap(document.getText());
        return this.parse(document, map.makeNavigator());
    }

    public static parse(parent: BBSubtag | TextDocument, navigator: CursorNavigator): BBString {
        const result = new BBString(parent, navigator.current(), navigator.current());
        nav:
        do {
            const current = navigator.current();
            switch (current.nextChar) {
                case "{":
                    result.#subtags.push(BBSubtag.parse(result, navigator));
                    navigator.moveBack();
                    break;
                case ";":
                case "}":
                    if (parent instanceof BBSubtag)
                        break nav;
                    result.#unexpectedClose.push(current.position);
                    break;
            }
        } while (navigator.moveNext());

        result.#end = navigator.current();

        return result;
    }

    readonly #unexpectedClose: Position[];
    readonly #parent: BBSubtag | TextDocument;
    readonly #subtags: BBSubtag[];
    readonly #start: Cursor;
    #end: Cursor;

    public get parent(): BBSubtag | TextDocument { return this.#parent; }
    public get range(): Range { return Range.create(this.#start.position, this.#end.position); }
    public get subtags(): readonly BBSubtag[] { return this.#subtags; }
    public get source(): string { return this.#start.getTo(this.#end).trim(); }
    public get unexpectedCloses(): readonly Position[] { return this.#unexpectedClose; }

    public constructor(parent: BBSubtag | TextDocument, start: Cursor, end: Cursor) {
        this.#parent = parent;
        this.#subtags = [];
        this.#unexpectedClose = [];
        this.#start = start;
        this.#end = end;
    }
}
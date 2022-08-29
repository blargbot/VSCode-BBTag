import { Range } from 'vscode-languageserver';
import { BBString } from "./BBString";
import { CursorNavigator, Cursor } from "./CursorMap";

export class BBSubtag {
    public static parse(parent: BBString, navigator: CursorNavigator): BBSubtag {
        const result = new BBSubtag(parent, navigator.current(), navigator.current());
        if (navigator.moveNext()) {
            do {
                if (navigator.current().nextChar.trim().length == 0)
                    continue;
                result.#children.push(BBString.parse(result, navigator));
                if (navigator.current().nextChar == "}" && navigator.moveNext()) {
                    result.#isMissingClose = false;
                    break;
                }

            } while (navigator.moveNext());
        }
        if (result.#children.length === 0)
            result.#children.push(new BBString(result, navigator.current(), navigator.current()));
        result.#end = navigator.current();
        return result;
    }

    readonly #parent: BBString;
    readonly #children: BBString[];
    readonly #start: Cursor;
    #end: Cursor;
    #isMissingClose: boolean;

    public get parent(): BBString { return this.#parent; }
    public get range(): Range { return Range.create(this.#start.position, this.#end.position); }
    public get args(): readonly BBString[] { return this.#children.slice(1); }
    public get name(): BBString { return this.#children[0]; }
    public get isMissingClose(): boolean { return this.#isMissingClose; }

    public constructor(parent: BBString, start: Cursor, end: Cursor) {
        this.#parent = parent;
        this.#isMissingClose = end.prevChar !== '}';
        this.#children = [];
        this.#start = start;
        this.#end = end;
    }

    /**
     * This will return an array of ranges where this does not overlap with contained subtags
     */
    public getDominantRanges(): Range[] {
        let prev = this.#start.position;
        const result: Range[] = [];
        for (const subtag of this.#children.flatMap(c => c.subtags)) {
            if (prev.line != subtag.#start.position.line || prev.character !== subtag.#start.position.character)
                result.push({ start: prev, end: subtag.#start.position });
            prev = subtag.#end.position;
        }
        return result;
    }
}
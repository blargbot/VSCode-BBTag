import { TextDocument } from "vscode-languageserver/lib/main";
import { Position } from "./selection";

export class Cursor {
    public static toDebuggable(cursor: Cursor) {
        if (!cursor) return cursor;
        return {
            next: cursor.nextChar,
            prev: cursor.prevChar,
            line: cursor.position.line,
            char: cursor.position.character,
            strLoc: cursor.stringLocation
        };
    }
    private readonly _position: Position;
    private readonly _parent: CursorMap;
    private readonly _stringIndex: number;

    public get position(): Position { return this._position; }
    public get nextCursor(): Cursor { return this._parent.getCursor(this._parent.getIndex(this.position) + 1); }
    public get prevCursor(): Cursor { return this._parent.getCursor(this._parent.getIndex(this.position) - 1); }
    public get nextChar(): string { return this._parent.get(this); }
    public get prevChar(): string { return (this.prevCursor || { nextChar: '' }).nextChar; }
    public get stringLocation(): number { return this._stringIndex; }

    constructor(parent: CursorMap, line: number, character: number, stringIndex: number) {
        this._parent = parent;
        this._position = new Position(line, character);
        this._stringIndex = stringIndex;
    }
}

export class CursorMap {
    public static create(document: TextDocument) {
        return new CursorMap(document.getText());
    }

    private readonly _content: string;
    private readonly _cursors: Cursor[] = [];
    private readonly _positionMap: number[][] = [];

    public get content(): string { return this._content; }
    public get cursors(): Cursor[] { return this._cursors.slice(0); }
    public get eof(): Cursor { return this._cursors[this._cursors.length - 1]; }
    public get sof(): Cursor { return this._cursors[0]; }
    public get lines(): Cursor[][] {
        return this._cursors.reduce((p, c) => {
            if (!p[c.position.line]) p[c.position.line] = [];
            p[c.position.line][c.position.character] = c;
            return p;
        }, []);
    }

    private constructor(content: string) {
        this._content = content;
        let lines = content.split('\n');
        /* This will build up a map like this (| = a cursor position)
            |t|h|i|s| |i|s| |a| |t|e|s|t|
            |h|m|m|m|m|
        */
        let charPos = 0;
        for (let row = 0; row < lines.length; row++) {
            const line = lines[row];
            const linePositions = this._positionMap[row] = <number[]>[];
            let col = 0;
            for (col = 0; col < line.length; col++) {
                linePositions[col] = this._cursors.length;
                this._cursors.push(new Cursor(this, row, col, charPos++));
            }
            linePositions[col] = this._cursors.length;
            this._cursors.push(new Cursor(this, row, col, charPos++));
        }
    }

    public makeNavigator(): CursorNavigator { return new CursorNavigator(this); }

    /**
     * This will get all characters between two cursors.
     * @param from The cursor position to start from
     * @param to The cursor position to end on. Defaults to the next cursor position
     */
    public get(from: Position | Cursor | number, to?: Position | Cursor | number): string {
        if (from == null) return '';

        let _from: Cursor, _to: Cursor;
        if (!(from instanceof Cursor))
            _from = this.getCursor(from);
        else _from = <Cursor>from;

        if (to == null) to = _from.nextCursor || _from;
        if (!(to instanceof Cursor))
            _to = this.getCursor(to);
        else _to = <Cursor>to;

        return this._content.slice(_from.stringLocation, _to.stringLocation);
    }

    public getIndex(position: Position): number {
        if (!position) return undefined;
        let line = this._positionMap[position.line];
        if (!line) return undefined;
        return line[position.character];
    }

    public getCursor(position: Position | number): Cursor {
        if (position == null) return undefined;
        if (typeof position == 'number')
            return this._cursors[position];
        return this.getCursor(this.getIndex(position));
    }

    public isInBounds(position: Position | number) {
        if (typeof position == 'object') position = this.getIndex(position);
        return position != null &&
            position >= 0 &&
            position < this._cursors.length;
    }

    public toString(): string {
        return this.get(0, this._cursors.length - 1);
    }
}

export class CursorNavigator {
    private _content: CursorMap;
    private _current: number;

    public currentIndex(): number { return this._current; }
    public current(): Cursor { return this._content.getCursor(this._current); }

    constructor(content: CursorMap) {
        this._content = content;
        this._current = 0;
    }

    public set(position: number | Position): boolean {
        if (typeof position == 'object')
            position = this._content.getIndex(position);

        if (this._content.get(position) == null)
            return false;

        this._current = position;
        return true;
    }

    public move(count: number): boolean {
        if (this._content.getCursor(this._current + count) == null)
            return false;
        this._current += count;
        return true;
    }

    public moveNext(): boolean { return this.move(1); }
    public moveBack(): boolean { return this.move(-1); }
}
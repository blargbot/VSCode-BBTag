import { Position } from 'vscode-languageserver';

export class Cursor {
    public static toDebuggable(cursor: Cursor) {
        if (!cursor) return cursor;
        const context = [
            cursor.#parent.getCursor(Math.max(cursor.index - 5, 0)),
            cursor.#parent.getCursor(Math.min(cursor.index + 5, cursor.#parent.cursors.length - 1))
        ].map(c => c.nextChar).join("|");

        return {
            context,
            prev: cursor.prevChar,
            next: cursor.nextChar,
            line: cursor.position.line,
            char: cursor.position.character,
            strLoc: cursor.stringLocation
        };
    }
    readonly #position: Position;
    readonly #parent: CursorMap;
    readonly #stringIndex: number;

    public get position(): Position { return this.#position; }
    public get index(): number { return this.#parent.getIndex(this.#position); }
    public get nextCursor(): Cursor { return this.offset(1); }
    public get prevCursor(): Cursor { return this.offset(-1); }
    public get nextChar(): string { return this.#parent.get(this); }
    public get prevChar(): string { return (this.prevCursor || { nextChar: "" }).nextChar; }
    public get stringLocation(): number { return this.#stringIndex; }

    constructor(parent: CursorMap, line: number, character: number, stringIndex: number) {
        this.#parent = parent;
        this.#position = Position.create(line, character);
        this.#stringIndex = stringIndex;
    }

    public offset(positions: number): Cursor {
        return this.#parent.getCursor(this.index + positions);
    }

    public getOffset(offset: number): string {
        return this.#parent.get(this, this.offset(offset));
    }

    public getTo(position: number | Cursor | Position): string {
        return this.#parent.get(this, position);
    }
}

export class CursorMap {
    readonly #content: string;
    readonly #cursors: Cursor[] = [];
    readonly #positionMap: number[][] = [];

    public get content(): string { return this.#content; }
    public get cursors(): Cursor[] { return this.#cursors.slice(0, -1); }
    public get eof(): Cursor { return this.#cursors[this.#cursors.length - 1]; }
    public get sof(): Cursor { return this.#cursors[0]; }

    public constructor(content: string) {
        this.#content = content;
        let line = 0;
        let char = 0;
        for (let i = 0; i <= content.length; i++, char++) {
            if (content[i] === '\n') {
                line++;
                char = 0;
            }

            this.#positionMap[line] ??= [];
            this.#positionMap[line][char] = i;

            this.#cursors.push(new Cursor(this, line, char, i));
        }
    }

    public makeNavigator(): CursorNavigator {
        return new CursorNavigator(this);
    }

    /**
     * This will get all characters between two cursors.
     * @param from The cursor position to start from
     * @param to The cursor position to end on. Defaults to the next cursor position
     */
    public get(from: Position | Cursor | number, to?: Position | Cursor | number): string {
        if (!(from instanceof Cursor))
            from = this.getCursor(from);
        to ??= from.nextCursor;
        if (!(to instanceof Cursor))
            to = this.getCursor(to);

        if (from.position.line > to.position.line || (from.position.line == to.position.line && from.position.character > to.position.character))
            [from, to] = [to, from];

        return this.#content.slice(from.stringLocation, to.stringLocation);
    }

    public getIndex(position: Position): number {
        const line = this.#positionMap[position.line];
        if (!line)
            return this.eof.index;
        return line[position.character];
    }

    public getCursor(position: Position | number): Cursor {
        if (typeof position == "number")
            return this.#cursors[position] ?? this.eof;
        return this.getCursor(this.getIndex(position));
    }

    public isInBounds(position: Position | number) {
        if (typeof position == "object") position = this.getIndex(position);
        return position != null &&
            position >= 0 &&
            position < this.#cursors.length;
    }

    public toString(): string {
        return this.get(0, this.#cursors.length - 1);
    }
}

export class CursorNavigator {
    #content: CursorMap;
    #current: number;

    public currentIndex(): number { return this.#current; }
    public current(): Cursor { return this.#content.getCursor(this.#current); }

    constructor(content: CursorMap) {
        this.#content = content;
        this.#current = 0;
    }

    public set(position: number | Position): boolean {
        if (typeof position == "object")
            position = this.#content.getIndex(position);

        if (this.#content.get(position) == null)
            return false;

        this.#current = position;
        return true;
    }

    public move(count: number): boolean {
        if (this.#content.getCursor(this.#current + count - 1) === this.#content.eof) // cant move past the EOF
            return false;
        this.#current += count;
        return true;
    }

    public moveNext(): boolean { return this.move(1); }
    public moveBack(): boolean { return this.move(-1); }
}
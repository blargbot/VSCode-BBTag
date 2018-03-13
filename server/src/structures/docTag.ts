import { Range, IPosition } from "./selection";
import { CursorMap, Cursor } from "./cursorMap";

export abstract class DocumentTag {
    private _source: CursorMap = null;
    private _parent: DocumentTag = null;
    private _start: Cursor;
    private _end: Cursor;
    private _range: Range;
    private _children: DocumentTag[] = [];

    public get start(): Cursor { return this._start; }
    public get end(): Cursor { return this._end; };
    public get range(): Range { return this._range || (this._range = new Range(this._start.position, (this._end || this.source.eof).position)); }
    public get source(): CursorMap { return this._parent ? this._parent.source : this._source; }
    public get content(): string { return this.source.get(this._start, this._end); }
    protected get children(): DocumentTag[] { return [...this._children]; }
    protected get parent(): DocumentTag { return this._parent; }
    
    protected get descendants(): DocumentTag[] { return this._children.reduce((p, c) => { p.push(c); p.push(...c.descendants); return p }, []); }
    protected get ancestors(): DocumentTag[] { return this.parent ? this.parent.ancestors.concat([this.parent]) : []; }

    constructor (source: DocumentTag | CursorMap, start: Cursor, end: Cursor) {
        if (source instanceof CursorMap)
            this._source = source;
        else
            this._parent = source;

        this._start = start;
        this._end = end;
    }

    protected setStart(value: Cursor): void {
        this._start = value;
        this._range = null;
    }

    protected setEnd(value: Cursor): void {
        this._end = value;
        this._range = null;
    }

    protected addChild(...children: DocumentTag[]): void {
        this._children.push(...children);
    }

    protected removeChild(...children: (DocumentTag | number)[]) {
        let numbers: number[] = [];
        for (const child of children)
            if (typeof child == 'number')
                numbers.push(child);
            else
                numbers.push(this._children.indexOf(child));
        numbers = numbers.filter(c => c != -1).sort((a, b) => b - a);
        for (const num of numbers)
            this._children.splice(num, 1);
    }

    public locate(position: IPosition): DocumentTag {
        if (!this.range.contains(position)) return null;
        for (const child of this.children)
            if (child.locate(position)) return child;

        return this;
    }
}
import { BBString } from "./bbtag"
import { CursorNavigator, Cursor } from "./cursorMap";
import { DocumentTag } from "./docTag";
import { IRange, Range, Position } from "./selection";
import SubTags, { SubTagDefinition } from "../data/subtagDefinition";


export class BBSubTag extends DocumentTag {
    public static async parse(parent: BBString, navigator: CursorNavigator): Promise<BBSubTag> {
        let result = new BBSubTag(parent, navigator.current(), null);
        console.verbose("Start SubTag:", Cursor.toDebuggable(navigator.current()));

        if (navigator.moveNext()) {
            do {
                if (navigator.current().nextChar.trim().length == 0)
                    continue;
                result.addChild(await BBString.parse(result, navigator));
                if (navigator.current().nextChar == "}" && navigator.moveNext()) {
                    result.setEnd(navigator.current());
                    break;
                }
            } while (navigator.moveNext());
        }
        if (result.end == null) result.setEnd(navigator.current());

        result.trim();

        result._definition = await SubTags.findExact(result.name);

        console.verbose("End SubTag: ", Cursor.toDebuggable(result.end));
        return result;
    }

    private _definition: SubTagDefinition;

    public get definition(): SubTagDefinition { return this._definition; }
    public get params(): BBString[] { return this.children.map(c => <BBString>c); }
    public get parent(): BBString { return <BBString>super.parent }
    public get subTagCount(): number { return this.descendants.filter(d => d instanceof BBSubTag).length; }
    public get isMalformed(): boolean { return this.params.reduce((p, b) => p || b.isMalformed, false) || this.end.prevChar != "}" || this.start.nextChar != "{"; }

    public get name(): "*Dynamic" | string { return this.params[0].subTags.length == 0 ? this.params[0].content.toLowerCase() : "*Dynamic"; }
    public get nameRange(): IRange { return this.params[0].range; }

    public get parentSubTags(): BBSubTag[] { return this.ancestors.filter(a => a instanceof BBSubTag) as BBSubTag[]; }

    private constructor(parent: BBString, start: Cursor, end: Cursor) {
        super(parent, start, end);
    }

    /**
     * This will return an array of ranges where this does not overlap with contained subtags
     */
    public getDominantRanges(): IRange[] {
        let result: IRange[] = [{ start: this.range.start, end: this.range.end }];

        console.verbose("Initial", result);

        for (const child of [].concat.apply([], this.params.map(p => p.subTags)) as BBSubTag[]) {
            for (const range of result.slice(0)) {
                if (Range.getIntersection(range, child.range) == "contains") {
                    let add: IRange = { start: child.range.end, end: range.end };
                    range.end = child.range.start;
                    result.push(add);
                }
            }
        }

        console.verbose("Split", result);

        for (let i = 0; i < result.length; i++) {
            const range = result[i];
            if (Position.eq(range.start, range.end))
                result.splice(i, 1), i--;
        }

        console.verbose("Final", result);

        return result;
    }
}
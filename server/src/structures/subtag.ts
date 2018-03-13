import { BBTag } from './bbtag'
import { CursorNavigator, Cursor } from './cursorMap';
import { DocumentTag } from './docTag';


export class SubTag extends DocumentTag {
    public static parse(parent: BBTag, navigator: CursorNavigator): SubTag {
        while (navigator.current().nextChar != '{' && navigator.moveNext()) { }

        let result = new SubTag(parent, navigator.current(), null);
        console.log('Start SubTag:', Cursor.toDebuggable(navigator.current()));

        if (navigator.moveNext()) {
            do {
                if (navigator.current().nextChar.trim().length == 0)
                    continue;
                result.addChild(BBTag.parse(result, navigator));
                if (navigator.current().nextChar == '}' && navigator.moveNext()) {
                    result.setEnd(navigator.current());
                    break;
                }
            } while (navigator.moveNext());
        }
        console.log('End SubTag: ', Cursor.toDebuggable(result.end));
        return result;
    }

    public get params(): BBTag[] { return this.children.map(c => <BBTag>c); }
    public get subTagCount(): number { return this.descendants.filter(d => d instanceof SubTag).length; }
    public get isMalformed(): boolean { return this.params.reduce((p, b) => p || b.isMalformed, false) || this.end.prevChar != '}' || this.start.nextChar != '{'; }

    public get name(): string | BBTag { return this.params[0].subTags.length == 0 ? this.params[0].content : this.params[0]; }

    private constructor(parent: BBTag, start: Cursor, end: Cursor) {
        super(parent, start, end);
    }
}
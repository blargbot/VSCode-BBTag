import { SubTag } from './subtag'
import { TextDocument } from 'vscode-languageserver';
import { CursorNavigator, CursorMap, Cursor } from './cursorMap';
import { DocumentTag } from './docTag';

export class BBTag extends DocumentTag{
    public static parseDocument(document: TextDocument): BBTag {
        console.verbose('=====================Parse Start=====================');
        let map = CursorMap.create(document);
        let result = this.parse(map, map.makeNavigator());
        console.verbose('=====================Parse Done =====================');
        console.verbose("Subtags found: ", result.subTagCount)

        return result;
    }

    public static parse(parent: SubTag | CursorMap, navigator: CursorNavigator): BBTag {
        let result = new BBTag(parent, navigator.current(), null);
        console.verbose('Start BBTag:', Cursor.toDebuggable(navigator.current()));
        nav:
        do {
            let current = navigator.current();
            switch (current.nextChar) {
                case '{':
                    result.addChild(SubTag.parse(result, navigator));
                    navigator.moveBack();
                    break;
                case ';':
                    if (parent instanceof CursorMap) break;
                case '}':
                    result.setEnd(current);
                    break nav;
            }
        } while (navigator.moveNext())

        if (result.end == null) result.setEnd(navigator.current());

        result.trim();

        console.verbose('End BBTag: ', Cursor.toDebuggable(result.end));
        return result;
    }

    public get subTags(): SubTag[] { return this.children.map(d => <SubTag>d); }
    public get parent(): SubTag { return <SubTag>super.parent }
    public get allSubTags(): SubTag[] { return this.descendants.filter(d => d instanceof SubTag) as SubTag[]; }
    public get subTagCount(): number { return this.allSubTags.length; }
    public get isMalformed(): boolean { return this.subTags.reduce((p, s) => p || s.isMalformed, false); }

    private constructor(parent: SubTag | CursorMap, start: Cursor, end: Cursor) {
        super(parent, start, end);
    }
}
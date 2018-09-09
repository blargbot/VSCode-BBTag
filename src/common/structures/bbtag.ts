import { BBSubTag } from "./subtag"
import { TextDocument } from "vscode-languageserver";
import { CursorNavigator, CursorMap, Cursor } from "./cursorMap";
import { DocumentTag } from "./docTag";

export class BBString extends DocumentTag {
    public static async parseDocument(document: TextDocument): Promise<BBString> {
        console.verbose("=====================Parse Start=====================");
        let map = CursorMap.create(document);
        let result = await this.parse(map, map.makeNavigator());
        console.verbose("=====================Parse Done =====================");
        console.verbose("Subtags found: ", result.subTagCount)

        return result;
    }

    public static async parse(parent: BBSubTag | CursorMap, navigator: CursorNavigator): Promise<BBString> {
        let result = new BBString(parent, navigator.current(), null);
        console.verbose("Start BBTag:", Cursor.toDebuggable(navigator.current()));
        nav:
        do {
            let current = navigator.current();
            switch (current.nextChar) {
                case "{":
                    result.addChild(await BBSubTag.parse(result, navigator));
                    navigator.moveBack();
                    break;
                case ";":
                    if (parent instanceof CursorMap) break;
                case "}":
                    result.setEnd(current);
                    break nav;
            }
        } while (navigator.moveNext())

        if (result.end == null) result.setEnd(navigator.current());

        result.trim();

        console.verbose("End BBTag: ", Cursor.toDebuggable(result.end));
        return result;
    }

    public get subTags(): BBSubTag[] { return this.children.map(d => <BBSubTag>d); }
    public get parent(): BBSubTag { return <BBSubTag>super.parent }
    public get allSubTags(): BBSubTag[] { return this.descendants.filter(d => d instanceof BBSubTag) as BBSubTag[]; }
    public get subTagCount(): number { return this.allSubTags.length; }
    public get isMalformed(): boolean { return this.subTags.reduce((p, s) => p || s.isMalformed, false); }

    private constructor(parent: BBSubTag | CursorMap, start: Cursor, end: Cursor) {
        super(parent, start, end);
    }
}
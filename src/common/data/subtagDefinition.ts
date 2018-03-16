import * as extensions from "../extensions";
import { SubTag } from "../structures/subtag";
import { BBTag } from "../structures/bbtag";
import { IRange } from "../structures/selection";
import * as Fuse from "fuse.js";

export type DataType = "nothing" | "text" | "number" | "boolean" | "array" | "color" | "user" | "channel" | "role" | "guild" | number;
export interface ValidationResult {
    range: IRange;
    message: string;
}


export interface SubTagDefinition {
    /** The name of the SubTag */
    readonly name: string;
    /** A brief description of the SubTag. */
    readonly title: string;
    /** The category of the SubTag. */
    readonly category?: "Simple" | "Complex" | "Array" | "CCommand";
    /** A detailed description of the SubTag. */
    readonly description: string;
    /** The type(s) that the SubTag returns. */
    readonly returns: DataType | DataType[];
    /** An array of parameters which the SubTag accepts. */
    readonly parameters: (Parameter | ParameterGroup)[];

    /** An optional method to validate the SubTag as a whole. */
    readonly validate?: (subtag: SubTag) => true | ValidationResult | ValidationResult[];

    //[key: string]: any;
}

export interface ParameterGroup {
    /** Specify the indexes of parameters that can be swapped. */
    readonly interchangable?: number[] | number[][];
    /** A list of all parameters or groups within this group. */
    readonly children: (Parameter | ParameterGroup)[];
    /** Is the group required? Defaults to `false` */
    readonly required?: boolean | number | ((bbtag: BBTag) => boolean);

    /** An optional method to validate all contained parameters. */
    readonly validate?: (bbtag: BBTag[]) => true | ValidationResult | ValidationResult[];

    //[key: string]: any;
}

export interface Parameter {
    /** The name of the parameter. */
    readonly name: string;
    /** The data type(s) that the parameter accepts. */
    readonly accepts: DataType | DataType[];
    /** Specifies a limited range of values the parameter can accept. */
    readonly restricted?: string[] | ((bbtag: BBTag) => string[]) | [number, number];
    /** Is the parameter required? Defaults to `false`. */
    readonly required?: boolean | number | ((bbtag: BBTag) => boolean);
    /** Can the parameter accept multiple values. If `true`, any excess values provided will be taken by this parameter. */
    readonly extended?: boolean;
    /** Specifies the level of support for arrays. */
    readonly array?: "ignored" | "optional" | "required";

    /** An optional method to validate this parameter. */
    readonly validate?: (bbtag: BBTag) => true | ValidationResult | ValidationResult[];

    //[key: string]: any;
}

export class SubTagDefinitionManager {
    public readonly list: SubTagDefinition[] = [];
    private readonly _fuse: Fuse = new Fuse(this.list, {
        caseSensitive: false,
        includeScore: true,
        shouldSort: true,
        keys: ["name"]
    });

    public findExact(name: string): SubTagDefinition {
        name = name.toLowerCase();
        return this.list.find(t => t.name == name);
    }

    public findClose(name: string): SubTagDefinition[] {
        let results = this._fuse.search(name) as { score: number, item: SubTagDefinition }[];
        if (results.length == 0) return [];

        console.debug(results);
        if (results[0].score == 0) return [results[0].item];
        return results.filter(r => r.score < 0.1).slice(0, 5).map(r => r.item);

        //name = name.toLowerCase();
        //let mapped = this.list.map(t => { return { score: t.name.similarity(name), subtag: t }; });
        //mapped = mapped.filter(m => m.score > 0.2);
        //mapped = mapped.sort((a, b) => b.score - a.score);
        //return mapped.slice(0, 5).map(t => t.subtag);
    }
}

export const definitions = new SubTagDefinitionManager();
export default definitions;

let dummies = ["abs", "addreact", "addrole", "apply", "args", "argsarray", "argslength", "ban", "base", "bool", "brainfuck", "buildembed", "capitalize", "ceil", "channelid", "channelname", "channelpos", "choose", "color", "commandname", "//", "concat", "decrement", "delete", "dm", "edit", "embed", "emoji", "exec", "execcc", "fallback", "floor", "for", "foreach", "get", "guildcreatedat", "guildicon", "guildid", "guildmembers", "guildname", "guildownerid", "hash", "hasrole", "if", "increment", "indexof", "inject", "inrole", "isarray", "isnsfw", "join", "lang", "lb", "length", "logic", "lower", "match", "math", "max", "messageid", "min", "modlog", "newline", "nsfw", "pad", "pardon", "parsefloat", "parseint", "pop", "prefix", "push", "quiet", "randchoose", "randint", "randstr", "randuser", "rb", "realpad", "regexreplace", "regextest", "removerole", "repeat", "replace", "return", "reverse", "rolecolor", "rolecreate", "roledelete", "roleid", "rolemembers", "rolemention", "rolename", "roles", "rolesetmentionable", "round", "semi", "send", "set", "setnick", "shift", "shuffle", "slice", "sort", "space", "splice", "split", "substring", "subtagexists", "switch", "throw", "time", "timer", "trim", "unban", "upper", "uriencode", "useravatar", "usercreatedat", "userdiscrim", "usergame", "usergametype", "userid", "userjoinedat", "usermention", "username", "usernick", "userstatus", "void", "warn", "warnings", "webhook", "zws"]

let subtags = extensions.requireFolder("./data/subtags");
for (const key of Object.keys(subtags)) {
    let subtag = subtags[key];
    let index = dummies.indexOf(subtag.name);
    definitions.list.push(subtag);

    if (index != -1)
        dummies.splice(index, 1);
}

for (const dummy of dummies) {
    definitions.list.push({
        name: dummy,
        category: "dummy" as any,
        title: "A dummy tag",
        description: "A dummy tag, loaded automatically",
        parameters: [],
        returns: "text"
    })
}
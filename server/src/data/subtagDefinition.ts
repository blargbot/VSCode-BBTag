import * as extensions from '../extensions';
import { SubTag } from "../structures/subtag";
import { BBTag } from "../structures/bbtag";
import { IRange } from "../structures/selection";
import * as Fuse from "fuse.js";

export type DataType = 'nothing' | 'text' | 'number' | 'boolean' | 'array' | 'color' | 'user' | 'channel' | 'role' | 'guild' | number;
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
    readonly category?: 'Simple' | 'Complex' | 'Array' | 'CCommand';
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
    readonly array?: 'ignored' | 'optional' | 'required';

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
        keys: ['name']
    });

    public findExact(name: string): SubTagDefinition {
        name = name.toLowerCase();
        return this.list.find(t => t.name == name);
    }

    public findClose(name: string): SubTagDefinition[] {
        let results = this._fuse.search(name) as { score: number, item: SubTagDefinition }[];
        if (results.length == 0) return [];

        if (results[0].score == 0) return [results[0].item];
        console.debug(results);
        return results.slice(0, 5).map(r => r.item);

        //name = name.toLowerCase();
        //let mapped = this.list.map(t => { return { score: t.name.similarity(name), subtag: t }; });
        //mapped = mapped.filter(m => m.score > 0.2);
        //mapped = mapped.sort((a, b) => b.score - a.score);
        //return mapped.slice(0, 5).map(t => t.subtag);
    }
}

export const definitions = new SubTagDefinitionManager();
export default definitions;

let subtags = extensions.requireFolder('./data/subtags');
for (const key of Object.keys(subtags)) {
    definitions.list.push(subtags[key]);
}


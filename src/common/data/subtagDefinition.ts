import * as extensions from "../extensions";
import { SubTag } from "../structures/subtag";
import { BBTag } from "../structures/bbtag";
import { IRange } from "../structures/selection";
import * as Fuse from "fuse.js";
import * as request from "request";

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
    public readonly list: Promise<SubTagDefinition[]>;
    private readonly _fuse: Promise<Fuse>;
    constructor() {
        this.list = this.populate();
        this._fuse = this.list.then(list => new Fuse(list, {
            caseSensitive: false,
            includeScore: true,
            shouldSort: true,
            keys: ["name"]
        }));
    }

    private async populate(): Promise<SubTagDefinition[]> {
        let result: SubTagDefinition[] = [];

        let subtags = extensions.requireFolder("./data/subtags");
        for (const key of Object.keys(subtags)) {
            let subtag = subtags[key];
            result.push(subtag);
        }

        await new Promise((resolve, reject) => {
            request("https://blargbot.xyz/tags/json", function (_error, response, body) {
                if (response && response.statusCode.toString().startsWith("2")) {
                    let dummies = JSON.parse(body as string);
                    if (Array.isArray(dummies)) {
                        loadDummies(result, dummies.map(d => d.name));
                        return resolve();
                    }
                }
                reject();
            });
        })

        return result;
    }

    public async findExact(name: string): Promise<SubTagDefinition> {
        name = name.toLowerCase();
        return (await this.list).find(t => t.name == name);
    }

    public async findClose(name: string): Promise<SubTagDefinition[]> {
        let results = (await this._fuse).search<{ score: number, item: SubTagDefinition }>(name);
        if (results.length == 0) return [];

        console.debug(results);
        if (results[0].score == 0) return [results[0].item];
        return results.filter(r => r.score < 0.1).slice(0, 5).map(r => r.item);
    }
}

export const definitions = new SubTagDefinitionManager();
export default definitions;

function loadDummies(list: SubTagDefinition[], names: string[]) {
    for (const name of names) {
        list.push({
            name,
            category: "dummy" as any,
            title: "A dummy tag",
            description: "A dummy tag, loaded automatically",
            parameters: [],
            returns: "text"
        });
    }
}


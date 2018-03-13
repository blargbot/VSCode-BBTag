export interface SubTagDefinition {
    name: string
    title: string
    description: string
    parameters: Parameter[]
    output: Output
    swapable?: number[] | number[][]
}

export interface Parameter {
    name: string
    type: Input
    initial?: string
    required?: boolean | ((values: string[]) => boolean)
    multiple?: boolean,
    array?: "required" | "optional" | "no"
}

export type Input = "bbtag" | "text" | "number" | "boolean" | "variable" | string[];
export type Output = "bbtag" | "text" | "number" | "boolean" | "array"

export const definitions: SubTagDefinition[] = [
    {
        name: "if",
        title: "Returns a value based on a condition",
        description: "Performs an operation comparing ${value1} to ${value2} using ${operator}. " +
            "If ${value1} and ${value2} are omitted, ${value1} is directly evaluated as a <boolean>.\n" +
            "If the result is <true> then ${then} is returned, otherwise ${else} if provided.",
        output: "text",
        parameters: [
            {
                name: "value1",
                type: ["boolean", "bbtag"]
            },
            {
                name: "operator",
                type: ["==", "!=", ">", ">=", "<", "<="],
                initial: "==",
                required: v => v.length > 3
            },
            {
                name: "value2",
                type: ["bbtag"],
                required: v => v.length > 3
            },
            {
                name: "then",
                type: "bbtag"
            },
            {
                name: "else",
                type: "bbtag",
                required: false
            }
        ],
        swapable: [0, 1, 2]
    }
];

export default definitions;
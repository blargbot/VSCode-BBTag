import { SubTagDefinition, ParameterGroup, Parameter } from "../subtagDefinition";

const subtag: SubTagDefinition = {
    name: "if",
    category: "Complex",
    title: "Returns a value based on a condition",
    description: "Performs an operation comparing ${value1} to ${value2} using ${operator}. " +
        "If ${value1} and ${value2} are omitted, ${value1} is directly evaluated as a <boolean>.\n" +
        "If the result is <true> then ${then} is returned, otherwise ${else} if provided.",
    returns: [4, 5],
    parameters: [
        <ParameterGroup>{
            interchangable: [1, 2, 3],
            children: [
                <Parameter>{
                    name: "value1",
                    accepts: ["boolean", "text"],
                    required: true,
                },
                <Parameter>{
                    name: "operator",
                    accepts: "text",
                    restricted: ["==", "!=", ">", ">=", "<", "<="],
                    initial: "==",
                    required: v => v.parent.params.length > 3
                },
                <Parameter>{
                    name: "value2",
                    accepts: ["text"],
                    required: v => v.parent.params.length > 3
                }
            ],
        },
        <Parameter>{
            name: "then",
            accepts: "text"
        },
        <Parameter>{
            name: "else",
            accepts: "text",
            required: false
        }
    ]
}

module.exports = subtag;
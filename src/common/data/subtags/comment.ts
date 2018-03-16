import { SubTagDefinition, Parameter } from "../subtagDefinition";

const subtag: SubTagDefinition = {
    name: "//",
    category: "Complex",
    title: "A comment subtag",
    description: "Still a comment subtag",
    returns: "nothing",
    parameters: [
        <Parameter>{
            name: "anything",
            accepts: "text",
            extended: true,
            required: false,
            validate: _ => true
        }
    ]
}

module.exports = subtag;
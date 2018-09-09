import server from "../server";
import { TextDocumentPositionParams, Hover, MarkupKind } from "vscode-languageserver";
import { BBSubTag } from "../../common/structures/subtag";
import { BBString } from "../../common/structures/bbtag";

const priority = ["//", "json", "j"];

async function main(params: TextDocumentPositionParams): Promise<Hover> {
    let bbtag = await server.cache.getDocument(params.textDocument).bbtag;
    let curTag = bbtag.locate(params.position);

    if (curTag == null)
        return null;

    if (curTag instanceof BBString)
        return hoverBBString(curTag);

    if (curTag instanceof BBSubTag)
        return hoverBBSubTag(curTag);

    return null;
}

function hoverBBString(structure: BBString) {
    if (structure.parent)
        return hoverBBSubTag(structure.parent);
    return null;
}

function hoverBBSubTag(structure: BBSubTag) {
    let priorityTag = structure.parentSubTags.find(t => priority.includes(t.name.toLowerCase()));

    if (priorityTag)
        structure = priorityTag;

    return {
        range: structure.params[0].range,
        contents: {
            kind: MarkupKind.Markdown,
            value: structure.definition != null
                ? structure.definition.category + " SubTag `" + structure.definition.name + "`"
                : structure.name == "*Dynamic"
                    ? "Dynamic SubTag ```bbtag" + structure.params[0].content + "``` (Not fully implemented)"
                    : "Unknown SubTag `" + structure.name + "`"
        }
    };
}

server.events.onHover.add(main);
server.events.onInitialize.add(_ => {
    return {
        capabilities: {
            hoverProvider: true
        }
    }
})
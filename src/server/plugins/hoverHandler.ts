import server from "../server";
import { TextDocumentPositionParams, Hover, MarkupKind } from "vscode-languageserver";
import { SubTag } from "../../common/structures/subtag";
import { BBTag } from "../../common/structures/bbtag";

async function main(params: TextDocumentPositionParams): Promise<Hover> {
    let bbtag = await server.cache.getDocument(params.textDocument).bbtag;
    let curTag = bbtag.locate(params.position);

    if (curTag == null)
        return null;

    if (curTag instanceof BBTag && curTag.parent)
        curTag = curTag.parent;

    if (curTag instanceof SubTag)
        return {
            range: curTag.params[0].range,
            contents: {
                kind: MarkupKind.Markdown,
                value: curTag.definition != null
                    ? curTag.definition.category + " SubTag `" + curTag.definition.name + "`"
                    : curTag.name == "*Dynamic"
                        ? "Dynamic SubTag ```bbtag" + curTag.params[0].content + "``` (Not fully implemented)"
                        : "Unknown SubTag `" + curTag.name + "`"
            }
        };
    return null;
}

server.events.onHover.add(main);
server.events.onInitialize.add(_ => {
    return {
        capabilities: {
            hoverProvider: true
        }
    }
})
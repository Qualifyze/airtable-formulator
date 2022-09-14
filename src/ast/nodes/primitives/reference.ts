import { Node, TokenNode } from "./node";

export type Reference = TokenNode<"reference">;

export function isReference(node: Node): node is Reference {
  return node.type === "reference";
}

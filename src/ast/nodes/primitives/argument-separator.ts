import { Node, TokenNode } from "./node";

export type ArgumentSeparator = TokenNode<"argumentSeparator">;

export function isArgumentSeparator(node: Node): node is ArgumentSeparator {
  return node.type === "argumentSeparator";
}

import { Node } from "./node";

type LiteralType = "number" | "string";

export function isLiteralType(type: string): type is LiteralType {
  return ["number", "string"].includes(type);
}

export type LiteralNode = Node<LiteralType>;

export function isLiteralNode(node: Node): node is LiteralNode {
  return isLiteralType(node.type);
}

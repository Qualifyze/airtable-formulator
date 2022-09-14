import { Node, TokenNode } from "./node";

export type Operator = TokenNode<"operator">;

export function isOperator(node: Node): node is Operator {
  return node.type === "operator";
}

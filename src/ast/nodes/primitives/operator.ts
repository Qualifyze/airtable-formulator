import { Node, TokenNode } from "./node";
import { OperatorSymbol, isOperatorSymbol } from "../../../schema";

export interface Operator extends TokenNode<"operator"> {
  readonly value: OperatorSymbol;
}

export function isOperator(node: Node): node is Operator {
  return node.type === "operator" && isOperatorSymbol(node.value);
}

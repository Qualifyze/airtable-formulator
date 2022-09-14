import { Node } from "./node";
import { isOperator } from "./operator";

const unaryOperators = ["+", "-"] as const;

export interface UnaryOperator extends Node<"operator"> {
  readonly value: typeof unaryOperators[number];
}

export function isUnaryOperator(node: Node): node is UnaryOperator {
  return (
    isOperator(node) &&
    (unaryOperators as readonly string[]).includes(node.value)
  );
}

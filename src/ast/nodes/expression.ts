import { Node, isLiteralNode, LiteralNode } from "./primitives";

import {
  EnclosedExpressionNode,
  isEnclosedExpressionNode,
} from "./enclosed-expression";

import { isModifierNode, ModifierNode } from "./modifier";
import { isOperationNode, OperationNode } from "./operation";
import { FunctionCallNode, isFunctionCallNode } from "./function-call";
import { FieldReference, isFieldReference } from "./field-reference";

export type ExpressionNode =
  | FieldReference
  | LiteralNode
  | FunctionCallNode
  | OperationNode
  | ModifierNode
  | EnclosedExpressionNode;

export function isExpressionNode(node: Node): node is ExpressionNode {
  return (
    isFieldReference(node) ||
    isLiteralNode(node) ||
    isFunctionCallNode(node) ||
    isOperationNode(node) ||
    isEnclosedExpressionNode(node) ||
    isModifierNode(node)
  );
}

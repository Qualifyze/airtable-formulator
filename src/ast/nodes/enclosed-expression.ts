import {
  isNode,
  Node,
  GroupNode,
  filterMeaningfulNodes,
  isSpace,
  Space,
  createEnclosedGroup,
  EnclosedGroupNode,
  isEnclosedWithParenthesis,
  createNodeErrorMessage,
} from "./primitives";

import { ExpressionNode, isExpressionNode } from "./expression";
import { checkArray } from "./utils";

import { isReference } from "./primitives";
import { NodeReducer } from "./node-reducer";

export type EnclosedExpressionNodeMember = ExpressionNode | Space;

function isEnclosedExpressionNodeMember(
  node: Node
): node is EnclosedExpressionNodeMember {
  return isExpressionNode(node) || isSpace(node);
}

export interface EnclosedExpressionNode
  extends EnclosedGroupNode<
    "enclosedExpression",
    EnclosedExpressionNodeMember
  > {
  readonly expression: Readonly<ExpressionNode>;
}

export function isEnclosedExpressionNode(
  node: Node
): node is EnclosedExpressionNode {
  const { expression } = node as unknown as Record<string, unknown>;
  return (
    isEnclosedWithParenthesis(node) &&
    checkArray(node.members, isEnclosedExpressionNodeMember) &&
    isNode(expression) &&
    isExpressionNode(expression)
  );
}

function createEnclosedExpression(
  group: EnclosedGroupNode<"enclosedExpression" | "group">
): EnclosedExpressionNode {
  const [expression, badExpression] =
    group.members.filter(isExpressionNode) || [];

  const enclosedExpression = {
    ...createEnclosedGroup(
      "enclosedExpression",
      group.members,
      group.opener,
      group.closer
    ),
    expression,
  };

  if (!expression || !isExpressionNode(expression)) {
    throw new Error(
      createNodeErrorMessage(
        enclosedExpression,
        "Expected an expression inside parentheses"
      )
    );
  }

  if (badExpression) {
    throw new Error(
      createNodeErrorMessage(
        badExpression,
        "Unexpected expression inside parentheses"
      )
    );
  }

  if (!isEnclosedExpressionNode(enclosedExpression)) {
    throw new Error(
      createNodeErrorMessage(enclosedExpression, "Invalid Enclosed expression")
    );
  }

  return enclosedExpression;
}

function enclosesSingleExpression(group: GroupNode): boolean {
  return group.members.filter(isExpressionNode).length === 1;
}

export const reduceEnclosedExpressions: NodeReducer = ([
  ...nodes
]: readonly Node[]): Node[] => {
  const meaningfulNodes = filterMeaningfulNodes(nodes);

  const enclosedExpressionGroups = meaningfulNodes
    .filter((node) => node.type === "group")
    .filter(isEnclosedWithParenthesis)
    .filter(enclosesSingleExpression)
    .filter((enclosedExpressionGroup) => {
      const index = meaningfulNodes.indexOf(enclosedExpressionGroup);
      const previous = meaningfulNodes[index - 1];
      return !previous || !isReference(previous);
    }) as EnclosedGroupNode<"group">[];

  enclosedExpressionGroups.forEach((enclosedExpressionGroup) => {
    const index = nodes.indexOf(enclosedExpressionGroup);
    nodes.splice(index, 1, createEnclosedExpression(enclosedExpressionGroup));
  });

  return nodes;
};

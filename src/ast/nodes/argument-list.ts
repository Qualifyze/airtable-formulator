import { checkArray } from "./utils";

import {
  createEnclosedGroup,
  EnclosedGroupNode,
  Node,
  TokenNode,
  isSpace,
  Space,
  filterMeaningfulNodes,
  GroupType,
  isReference,
  isEnclosedWithParenthesis,
  createNodeErrorMessage,
  ArgumentSeparator,
  isArgumentSeparator,
} from "./primitives";

import { ExpressionNode, isExpressionNode } from "./expression";
import { isFunctionReference } from "./function-reference";
import { NodeReducer } from "./node-reducer";

type ArgumentListMember = ExpressionNode | ArgumentSeparator | Space;

function isArgumentListMember(node: Node): node is ArgumentListMember {
  return isArgumentSeparator(node) || isExpressionNode(node) || isSpace(node);
}

export type ArgumentListGroup<G extends GroupType> = EnclosedGroupNode<
  G,
  ArgumentListMember,
  TokenNode<"openParenthesis">,
  TokenNode<"closeParenthesis">
>;

export function isArgumentListGroup<T extends GroupType>(
  node: Node,
  type: T
): node is ArgumentListGroup<T> {
  return (
    node.type === type &&
    isEnclosedWithParenthesis(node) &&
    node.members.every(isArgumentListMember)
  );
}

export interface ArgumentListNode extends ArgumentListGroup<"argumentList"> {
  readonly args: readonly ExpressionNode[];
  readonly opener: Readonly<TokenNode<"openParenthesis">>;
  readonly closer: Readonly<TokenNode<"closeParenthesis">>;
}

export function isArgumentListNode(node: Node): node is ArgumentListNode {
  const { args } = node as unknown as Record<string, unknown>;
  return (
    isArgumentListGroup(node, "argumentList") &&
    Array.isArray(args) &&
    args.every(isExpressionNode)
  );
}

function sliceDelimitedExpression(
  nodes: readonly Node[],
  start: number,
  end?: number
): ExpressionNode | undefined {
  const [expression, invalid] = filterMeaningfulNodes(nodes.slice(start, end));

  if (invalid) {
    throw new Error(
      createNodeErrorMessage(
        invalid,
        `Expected a single expression, but got an extra ${invalid.type}`
      )
    );
  }

  if (expression && !isExpressionNode(expression)) {
    throw new Error(
      createNodeErrorMessage(
        expression,
        `Expected an expression, but got ${expression.type}`
      )
    );
  }

  return expression;
}

function getDelimitedExpressions(nodes: readonly Node[]): ExpressionNode[] {
  const separators = nodes.filter(isArgumentSeparator);

  const expressions: ExpressionNode[] = [];

  const index = separators.reduce((index, separator) => {
    const separatorIndex = nodes.indexOf(separator);

    const expression = sliceDelimitedExpression(nodes, index, separatorIndex);

    if (expression) {
      expressions.push(expression);
    } else {
      throw new Error(
        createNodeErrorMessage(
          separator,
          `Expected an expression before the argument separator`
        )
      );
    }
    return separatorIndex + 1;
  }, 0);

  const lastExpression = sliceDelimitedExpression(nodes, index);

  if (lastExpression) {
    expressions.push(lastExpression);
  }

  return expressions;
}

function createArgumentList(
  group: ArgumentListGroup<"group">
): ArgumentListNode {
  if (!checkArray(group.members, isArgumentListMember)) {
    throw new Error(
      createNodeErrorMessage(
        group,
        `Expected all members of an argument list to be argument list members, but got ${group.members
          .map((member) => member.type)
          .join(", ")} instead`
      )
    );
  }

  return {
    ...createEnclosedGroup(
      "argumentList",
      group.members,
      group.opener,
      group.closer
    ),
    args: getDelimitedExpressions(group.members),
  };
}

export const reduceArgumentLists: NodeReducer = ([
  ...nodes
]: readonly Node[]): Node[] => {
  const meaningfulNodes = filterMeaningfulNodes(nodes);

  const candidates = meaningfulNodes.filter((node) =>
    isArgumentListGroup(node, "group")
  ) as ArgumentListGroup<"group">[];

  candidates.forEach((candidate) => {
    const previousNode =
      meaningfulNodes[meaningfulNodes.indexOf(candidate) - 1];

    if (
      (previousNode && isReference(previousNode)) ||
      filterMeaningfulNodes(candidate.members).length === 0 ||
      candidate.members.some(isArgumentSeparator)
    ) {
      // There must be a previous node, and this node must be a reference
      if (
        !previousNode ||
        (!isReference(previousNode) && !isFunctionReference(previousNode))
      ) {
        throw new Error(
          createNodeErrorMessage(
            candidate,
            `Expected an argument list to be preceded by a reference, but got ${previousNode?.type} instead`
          )
        );
      }

      nodes.splice(nodes.indexOf(candidate), 1, createArgumentList(candidate));
    }
  });

  return nodes;
};

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
} from "./primitives";

import { ExpressionNode, isExpressionNode } from "./expression";
import {
  DelimitedExpressionList,
  isDelimitedExpressionList,
} from "./delimited-expression-list";
import { isFunctionReference } from "./function-reference";
import { NodeReducer } from "./node-reducer";

type ArgumentListMember = DelimitedExpressionList | ExpressionNode | Space;

function isArgumentListMember(node: Node): node is ArgumentListMember {
  return (
    isDelimitedExpressionList(node) || isExpressionNode(node) || isSpace(node)
  );
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

function isOpenParenthesis(node: Node): node is TokenNode<"openParenthesis"> {
  return node.type === "openParenthesis";
}

function isCloseParenthesis(node: Node): node is TokenNode<"closeParenthesis"> {
  return node.type === "closeParenthesis";
}

function createArgumentList(
  group: ArgumentListGroup<"group">
): ArgumentListNode {
  const { opener, closer } = group;

  if (!isOpenParenthesis(opener) || !isCloseParenthesis(closer)) {
    throw new Error(
      createNodeErrorMessage(
        group,
        `Expected an argument list to be enclosed with parenthesis, but got ${opener.value}${closer.value} instead`
      )
    );
  }

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

  const argumentList: Omit<ArgumentListNode, "args"> = {
    ...createEnclosedGroup("argumentList", group.members, opener, closer),
  };

  const [expression, invalid]: (ArgumentListMember | undefined)[] =
    filterMeaningfulNodes(group.members);

  if (invalid) {
    throw new Error(
      createNodeErrorMessage(
        argumentList,
        `Expected just one delimited expression, got an extra ${invalid.type} at position ${invalid.start}`
      )
    );
  }

  const args: readonly ExpressionNode[] = expression
    ? isDelimitedExpressionList(expression)
      ? expression.expressions
      : [expression]
    : [];

  return {
    ...argumentList,
    args,
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
      candidate.members.some(isDelimitedExpressionList)
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

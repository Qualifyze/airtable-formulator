import {
  ArgumentSeparator,
  createGroup,
  createNodeErrorMessage,
  filterMeaningfulNodes,
  GroupNode,
  isArgumentSeparator,
  isGroupNode,
  isSpace,
  Node,
  Space,
} from "./primitives";
import { ExpressionNode, isExpressionNode } from "./expression";
import { eagerlyRepeat, NodeReducer } from "./node-reducer";

export type DelimitedExpressionListMember =
  | ExpressionNode
  | Space
  | ArgumentSeparator;

export function isDelimitedExpressionListMember(
  node: Node
): node is DelimitedExpressionListMember {
  return isExpressionNode(node) || isSpace(node) || isArgumentSeparator(node);
}

export interface DelimitedExpressionList
  extends GroupNode<"delimitedExpressionList", DelimitedExpressionListMember> {
  readonly expressions: readonly ExpressionNode[];
  readonly separators: readonly ArgumentSeparator[];
}

export function isDelimitedExpressionList(
  node: Node
): node is DelimitedExpressionList {
  return (
    isGroupNode(node) &&
    node.members.every(isDelimitedExpressionListMember) &&
    node.type === "delimitedExpressionList"
  );
}

function createDelimitedExpressionList(
  nodes: (DelimitedExpressionListMember | DelimitedExpressionList)[]
): DelimitedExpressionList {
  const [left, separator, right, invalid] = filterMeaningfulNodes(nodes);

  const delimitedExpressionList = createGroup("delimitedExpressionList", nodes);

  if (!left || (!isExpressionNode(left) && !isDelimitedExpressionList(left))) {
    throw new Error(
      createNodeErrorMessage(
        delimitedExpressionList,
        `expected left operand to be an expression type, but got ${left?.type}`
      )
    );
  }

  if (!separator || !isArgumentSeparator(separator)) {
    throw new Error(
      createNodeErrorMessage(
        delimitedExpressionList,
        `expected separator to be an argument separator, but got ${separator?.type}`
      )
    );
  }

  if (
    !right ||
    (!isExpressionNode(right) && !isDelimitedExpressionList(right))
  ) {
    throw new Error(
      createNodeErrorMessage(
        delimitedExpressionList,
        `expected right operand to be an expression type, but got ${right?.type}`
      )
    );
  }

  if (invalid) {
    throw new Error(
      createNodeErrorMessage(
        delimitedExpressionList,
        `expected only expressions and separators, but got ${invalid.type}`
      )
    );
  }

  const before = isDelimitedExpressionList(left)
    ? {
        expressions: left.expressions,
        separators: left.separators,
        nodes: [
          ...nodes.slice(0, nodes.indexOf(left)),
          ...left.members,
          ...nodes.slice(nodes.indexOf(left) + 1, nodes.indexOf(separator)),
        ] as DelimitedExpressionListMember[],
      }
    : { expressions: [left], separators: [], nodes: [left] };

  const after = isDelimitedExpressionList(right)
    ? {
        expressions: right.expressions,
        separators: right.separators,
        nodes: [
          ...nodes.slice(nodes.indexOf(separator) + 1, nodes.indexOf(right)),
          ...right.members,
          ...nodes.slice(nodes.indexOf(right) + 1),
        ] as DelimitedExpressionListMember[],
      }
    : { expressions: [right], separators: [], nodes: [right] };

  return {
    ...createGroup("delimitedExpressionList", [
      ...before.nodes,
      separator,
      ...after.nodes,
    ]),
    separators: [...before.separators, separator, ...after.separators],
    expressions: [...before.expressions, ...after.expressions],
  };
}

export const reduceDelimitedExpressionLists: NodeReducer = eagerlyRepeat(
  ([...nodes]) => {
    const meaningfulNodes = filterMeaningfulNodes(nodes);

    const separator = meaningfulNodes.find(isArgumentSeparator) as
      | ArgumentSeparator
      | undefined;

    if (separator) {
      const left = meaningfulNodes[meaningfulNodes.indexOf(separator) - 1];
      const right = meaningfulNodes[meaningfulNodes.indexOf(separator) + 1];

      if (!left || !right) {
        throw new Error(
          createNodeErrorMessage(
            separator,
            `expected an expression to the left and right of separator to exist`
          )
        );
      }

      if (!isExpressionNode(left) && !isDelimitedExpressionList(left)) {
        throw new Error(
          createNodeErrorMessage(
            separator,
            `expected an expression to the left of separator, but got ${left.type}`
          )
        );
      }

      if (!isExpressionNode(right) && !isDelimitedExpressionList(right)) {
        throw new Error(
          createNodeErrorMessage(
            separator,
            `expected an expression to the right of separator, but got ${right.type}`
          )
        );
      }

      const leftIndex = nodes.indexOf(left);
      const rightIndex = nodes.indexOf(right);

      nodes.splice(
        leftIndex,
        rightIndex - leftIndex + 1,
        createDelimitedExpressionList([left, separator, right])
      );
    }

    return nodes;
  }
);

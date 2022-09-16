import {
  isOperator,
  Operator,
  isSpace,
  Space,
  isNode,
  Node,
  createGroup,
  GroupNode,
  isGroupNode,
  filterMeaningfulNodes,
  createNodeErrorMessage,
} from "./primitives";

import { ExpressionNode, isExpressionNode } from "./expression";
import { checkArray } from "./utils";
import { eagerlyRepeat, NodeReducer } from "./node-reducer";

type OperationNodeMember = ExpressionNode | Operator | Space;

function isOperationNodeMember(node: Node): node is OperationNodeMember {
  return isExpressionNode(node) || isOperator(node) || isSpace(node);
}

export interface OperationNode extends GroupNode<"operation"> {
  readonly members: Readonly<OperationNodeMember[]>;
  readonly operator: Operator;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

export function isOperationNode(node: Node): node is OperationNode {
  const { operator, left, right } = node as unknown as Record<string, unknown>;

  return (
    isGroupNode(node) &&
    node.members.every(isOperationNodeMember) &&
    node.type === "operation" &&
    isNode(operator) &&
    isOperator(operator) &&
    isNode(left) &&
    isExpressionNode(left) &&
    isNode(right) &&
    isExpressionNode(right)
  );
}

function createOperation(nodes: OperationNodeMember[]): OperationNode {
  const operation = createGroup("operation", nodes);
  const [left, operator, right, invalid] = filterMeaningfulNodes(nodes);

  if (!left || !isExpressionNode(left)) {
    throw new Error(
      createNodeErrorMessage(
        operation,
        `expected left operand to be an expression type, but got ${left.type}`
      )
    );
  }

  if (!operator || !isOperator(operator)) {
    throw new Error(
      createNodeErrorMessage(
        operation,
        `expected an operator, but got ${operator.type}`
      )
    );
  }

  if (!right || !isExpressionNode(right)) {
    throw new Error(
      createNodeErrorMessage(
        operation,
        `expected right operand to be an expression type, but got ${right.type}`
      )
    );
  }

  if (invalid) {
    throw new Error(
      createNodeErrorMessage(
        operation,
        `expected only left operand, operator, and right operand, but got an extra ${invalid.type}`
      )
    );
  }

  return {
    ...operation,
    left,
    operator,
    right,
  };
}

// XXX I could not find any reliable sources on airtable operator precedence,
// so I am assuming that it will be similar to javascript's operator precedence.
const operatorPrecedence = [
  "&",
  "*",
  "/",
  "+",
  "-",
  "<",
  "<=",
  ">",
  ">=",
  "=",
  "!=",
] as const;

export const reduceOperations: NodeReducer = eagerlyRepeat(
  ([...nodes]: readonly Node[]): (OperationNode | Node)[] => {
    const meaningfulNodes = filterMeaningfulNodes(nodes);

    const operatorNodes: Operator[] = meaningfulNodes.filter(
      isOperator
    ) as Operator[];

    // Sort operators by precedence
    operatorNodes.sort((a, b) => {
      const aIndex = operatorPrecedence.indexOf(
        a.value as typeof operatorPrecedence[number]
      );
      const bIndex = operatorPrecedence.indexOf(
        b.value as typeof operatorPrecedence[number]
      );

      return aIndex - bIndex;
    });

    const replacement = operatorNodes
      .map((operator) => {
        const operatorIndex = meaningfulNodes.indexOf(operator);
        const left = meaningfulNodes[operatorIndex - 1] as Node | undefined;
        const right = meaningfulNodes[operatorIndex + 1] as Node | undefined;
        return { left, operator, right };
      })
      .find(
        ({ left, right }) =>
          left && isExpressionNode(left) && right && isExpressionNode(right)
      ) as {
      left: ExpressionNode;
      operator: Operator;
      right: ExpressionNode;
    };

    if (replacement) {
      const { left, right } = replacement;

      const leftIndex = nodes.indexOf(left);
      const rightIndex = nodes.indexOf(right);
      const members = nodes.slice(leftIndex, rightIndex + 1);
      if (checkArray(members, isOperationNodeMember)) {
        const operation = createOperation(members);
        nodes.splice(leftIndex, members.length, operation);
      }
    }

    return nodes;
  }
);

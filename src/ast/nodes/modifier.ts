import {
  createGroup,
  createNodeErrorMessage,
  filterMeaningfulNodes,
  GroupNode,
  isGroupNode,
  isNode,
  isOperator,
  isSpace,
  isUnaryOperator,
  Node,
  Space,
  UnaryOperator,
} from "./primitives";
import { ExpressionNode, isExpressionNode } from "./expression";
import { NodeReducer } from "./node-reducer";

export interface ModifierNode
  extends GroupNode<"modifier", ModifierNodeMember> {
  readonly operator: UnaryOperator;
  readonly operand: ExpressionNode;
}

type ModifierNodeMember = Space | UnaryOperator | ExpressionNode;

function isModifierNodeMember(node: Node): node is ModifierNodeMember {
  return isSpace(node) || isUnaryOperator(node) || isExpressionNode(node);
}

export function isModifierNode(node: Node): node is ModifierNode {
  const { operator, operand } = node as unknown as Record<string, unknown>;

  return (
    isGroupNode(node) &&
    node.members.every(isModifierNodeMember) &&
    node.type === "modifier" &&
    isNode(operator) &&
    isUnaryOperator(operator) &&
    isNode(operand) &&
    isExpressionNode(operand)
  );
}

function createModifier(nodes: ModifierNodeMember[]): ModifierNode {
  const modifier = createGroup("modifier", nodes);
  const [operator, operand, invalid] = filterMeaningfulNodes(nodes);

  if (!operator || !isOperator(operator)) {
    throw new Error(
      createNodeErrorMessage(
        modifier,
        `Modifier must have an operator, but encountered ${operator.type} instead`
      )
    );
  }
  if (!operand || !isExpressionNode(operand)) {
    throw new Error(
      createNodeErrorMessage(
        modifier,
        `Modifier must have an operand expression, but encountered ${operand.type} instead`
      )
    );
  }
  if (invalid) {
    throw new Error(
      createNodeErrorMessage(
        modifier,
        `Modifier must have exactly 2 members, but encountered an extra ${invalid.type} instead`
      )
    );
  }

  return {
    ...modifier,
    operator,
    operand,
  };
}

export const reduceModifiers: NodeReducer = ([
  ...nodes
]: readonly Node[]): Node[] => {
  const meaningfulNodes = filterMeaningfulNodes(nodes);

  const operators: UnaryOperator[] = meaningfulNodes.filter(isUnaryOperator);

  const nodeGroups: ModifierNodeMember[][] = operators
    .map((operator) => {
      const operatorIndex = meaningfulNodes.indexOf(operator);

      const before = meaningfulNodes[operatorIndex - 1];
      const after = meaningfulNodes[operatorIndex + 1];

      return { before, operator, after };
    })
    .filter(({ before, after }) => {
      return (
        (!before || isOperator(before)) && after && isExpressionNode(after)
      );
    })
    .map(({ operator, after: operand }) => {
      const operatorIndex = nodes.indexOf(operator);
      const expressionIndex = nodes.indexOf(operand);

      return nodes.slice(operatorIndex, expressionIndex + 1);
    })
    .filter((nodes) =>
      nodes.every(isModifierNodeMember)
    ) as ModifierNodeMember[][];

  nodeGroups.forEach((members: ModifierNodeMember[]) => {
    const modifier = createModifier(members);
    const index = nodes.indexOf(modifier.operator);
    nodes.splice(index, members.length, modifier);
  });

  return nodes;
};

import { tokenize } from "./tokenize";
import {
  composeReducers,
  createNodeErrorMessage,
  eagerlyRepeat,
  ExpressionNode,
  GroupNode,
  isExpressionNode,
  isGroupNode,
  Node,
  NodeReducer,
  reduceArgumentLists,
  reduceEnclosedExpressions,
  reduceFieldReferences,
  reduceFunctionCalls,
  reduceFunctionReferences,
  reduceModifiers,
  reduceOperations,
  reduceSpaces,
  separateNodes,
} from "./nodes";

function reduceGroups(reducer: NodeReducer): NodeReducer {
  // Using named function here as it makes debugging easier
  function reduceGroups(nodes: readonly Node[]): Node[] {
    return nodes.map((node) =>
      isGroupNode(node)
        ? { ...node, members: reduceNodes(node.members) } ?? node
        : node
    );
  }
  const reduceNodes = composeReducers(reduceGroups, reducer);

  return reduceNodes;
}

const reduceNodes: NodeReducer = reduceGroups(
  separateNodes(
    eagerlyRepeat(
      composeReducers(
        reduceEnclosedExpressions,
        reduceFieldReferences,
        reduceFunctionReferences,
        reduceModifiers,
        reduceOperations,
        reduceArgumentLists,
        reduceFunctionCalls
      )
    )
  )
);

export type ParseOptions = {
  removeSpace?: boolean;
};

/**
 * Parses a formula string into an AST.
 * @experimental This function is experimental, potentially unstable and may change in future versions.
 * @param formula
 * @param options
 */

export function parse(
  formula: string,
  { removeSpace = false }: ParseOptions = {}
): ExpressionNode | null {
  const tokenGroup: GroupNode<"group"> = tokenize(
    formula
  ) as GroupNode<"group">;

  const nodes = reduceNodes(tokenGroup.members);

  const [expression = null, unexpectedNode] = reduceSpaces(nodes);

  if (unexpectedNode) {
    throw new Error(
      createNodeErrorMessage(
        unexpectedNode,
        `Unexpected node ${unexpectedNode.type}`
      )
    );
  }

  if (expression !== null && !isExpressionNode(expression)) {
    throw new Error(
      createNodeErrorMessage(
        expression,
        `Expected to find an expression, got ${expression.type} instead`
      )
    );
  }

  if (expression && removeSpace) {
    const [expressionWithoutSpaces] = reduceGroups(reduceSpaces)([expression]);
    return expressionWithoutSpaces as ExpressionNode;
  }

  return expression;
}

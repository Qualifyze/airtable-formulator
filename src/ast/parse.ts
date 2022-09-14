import { tokenize } from "./tokenize";
import {
  createNodeErrorMessage,
  ExpressionNode,
  GroupNode,
  isExpressionNode,
  isGroupNode,
  Node,
  reduceSpaces,
  reduceArgumentLists,
  reduceDelimitedExpressionLists,
  reduceEnclosedExpressions,
  reduceFieldReferences,
  reduceFunctionCalls,
  reduceFunctionReferences,
  reduceModifiers,
  reduceOperations,
  composeReducers,
  eagerlyRepeat,
  NodeReducer,
} from "./nodes";

function groupReducer(reducer: NodeReducer): NodeReducer {
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

const reduceNodes: NodeReducer = groupReducer(
  composeReducers(
    eagerlyRepeat(
      composeReducers(
        eagerlyRepeat(
          composeReducers(
            reduceFieldReferences,
            reduceFunctionReferences,
            reduceModifiers,
            reduceOperations,
            reduceArgumentLists
          )
        ),
        reduceEnclosedExpressions,
        reduceFunctionCalls,
        reduceDelimitedExpressionLists
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
    const [expressionWithoutSpaces] = groupReducer(reduceSpaces)([expression]);
    return expressionWithoutSpaces as ExpressionNode;
  }

  return expression;
}

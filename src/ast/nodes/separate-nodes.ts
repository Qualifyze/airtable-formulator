import { NodeReducer } from "./node-reducer";
import { createNodeErrorMessage, isArgumentSeparator } from "./primitives";

/**
 * Creates a reducer that runs a reducer on each 'argumentSeparator' delimited set of nodes.
 * @param reduceNodes
 */

export function separateNodes(reduceNodes: NodeReducer): NodeReducer {
  // Using named function here as it makes debugging easier
  return function separateNodes([...nodes]) {
    const separators = nodes.filter(isArgumentSeparator);

    const index = separators.reduce((previousIndex, separator) => {
      const separatorIndex = nodes.indexOf(separator);
      const nodesBefore = nodes.slice(previousIndex, separatorIndex);

      if (nodesBefore.length === 0) {
        throw new Error(
          createNodeErrorMessage(
            separator,
            `Expected at least one node before separator, but got none`
          )
        );
      }

      const replacementNodes = reduceNodes(nodesBefore);

      nodes.splice(previousIndex, nodesBefore.length, ...replacementNodes);

      // With the splice, the index of the separator has potentially.
      return nodes.indexOf(separator) + 1;
    }, 0);

    const nodesAfter = nodes.slice(index);

    if (nodesAfter.length === 0 && separators.length > 0) {
      throw new Error(
        createNodeErrorMessage(
          separators[separators.length - 1],
          `expected at least one node after separator, but got ${nodesAfter.length}`
        )
      );
    }

    nodes.splice(index, nodesAfter.length, ...reduceNodes(nodesAfter));

    return nodes;
  };
}

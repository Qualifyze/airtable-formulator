import {
  createNodeErrorMessage,
  filterMeaningfulNodes,
  isArgumentSeparator,
  isEnclosedNode,
  isOperator,
  isReference,
  Node,
} from "./primitives";
import { isArgumentListNode } from "./argument-list";
import { NodeReducer } from "./node-reducer";

const functionReferenceType = "functionReference";

type FunctionReferenceType = typeof functionReferenceType;

function isFunctionReferenceType(type: string): type is FunctionReferenceType {
  return type === functionReferenceType;
}

export type FunctionReference = Node<FunctionReferenceType>;

export function isFunctionReference(node: Node): node is FunctionReference {
  return isFunctionReferenceType(node.type);
}

function createFunctionReference(node: Node): FunctionReference {
  if (!isReference(node)) {
    // Sanity check
    throw new Error(
      createNodeErrorMessage(
        node,
        `expected reference type as a source for function reference, but got ${node.type}`,
        "Internal"
      )
    );
  }
  return {
    ...node,
    type: functionReferenceType,
  };
}

export const reduceFunctionReferences: NodeReducer = ([
  ...nodes
]: readonly Node[]): Node[] => {
  const meaningfulNodes = filterMeaningfulNodes(nodes);
  // Function name does not have spaces and thus cannot be enclosed by braces.
  const references = meaningfulNodes
    .filter(isReference)
    .filter((node) => !isEnclosedNode(node));

  // A function reference must have an operator, argumentSeparator or nothing before it
  // and an argument list after it.
  const applicableReferences = new WeakSet<Node>(
    references.filter((reference) => {
      const index = meaningfulNodes.indexOf(reference);
      const previous = meaningfulNodes[index - 1];
      const next = meaningfulNodes[index + 1];
      return (
        (!previous || isOperator(previous) || isArgumentSeparator(previous)) &&
        next &&
        isArgumentListNode(next)
      );
    })
  );
  return nodes.map((node) =>
    applicableReferences.has(node) ? createFunctionReference(node) : node
  );
};

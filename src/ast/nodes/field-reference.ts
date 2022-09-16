import {
  createNodeErrorMessage,
  filterMeaningfulNodes,
  isArgumentSeparator,
  isOperator,
  isReference,
  Node,
} from "./primitives";
import { NodeReducer } from "./node-reducer";

const fieldReferenceType = "fieldReference";

type FieldReferenceType = typeof fieldReferenceType;

function isFieldReferenceType(type: string): type is FieldReferenceType {
  return type === fieldReferenceType;
}

export type FieldReference = Node<FieldReferenceType>;

export function isFieldReference(node: Node): node is FieldReference {
  return isFieldReferenceType(node.type);
}

function createFieldReference(node: Node): FieldReference {
  if (!isReference(node)) {
    // Sanity check
    throw new Error(
      createNodeErrorMessage(
        node,
        `expected reference type, but got ${node.type}`,
        "Internal"
      )
    );
  }
  return {
    ...node,
    type: fieldReferenceType,
  };
}

function isValidNeighbour(node: Node): boolean {
  return isOperator(node) || isArgumentSeparator(node);
}

export const reduceFieldReferences: NodeReducer = ([
  ...nodes
]: readonly Node[]): Node[] => {
  const meaningfulNodes = filterMeaningfulNodes(nodes);
  const references = meaningfulNodes.filter(isReference);

  // A field reference can only be adjacent to operators or argument separators
  const applicableReferences = new WeakSet<Node>(
    references.filter((reference) => {
      const index = meaningfulNodes.indexOf(reference);
      const previous = meaningfulNodes[index - 1];
      const next = meaningfulNodes[index + 1];
      return (
        (!previous || isValidNeighbour(previous)) &&
        (!next || isValidNeighbour(next))
      );
    })
  );
  return nodes.map((node) =>
    applicableReferences.has(node) ? createFieldReference(node) : node
  );
};

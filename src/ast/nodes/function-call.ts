import {
  createGroup,
  GroupNode,
  isGroupNode,
  isNode,
  Node,
  isSpace,
  Space,
  filterMeaningfulNodes,
  createNodeErrorMessage,
} from "./primitives";
import { ArgumentListNode, isArgumentListNode } from "./argument-list";
import { FunctionReference, isFunctionReference } from "./function-reference";
import { eagerlyRepeat, NodeReducer } from "./node-reducer";

const functionCallType = "functionCall";

type FunctionCallType = typeof functionCallType;

function isFunctionCallType(type: string): type is FunctionCallType {
  return type === functionCallType;
}

type FunctionCallMember = Space | FunctionReference | ArgumentListNode;

function isFunctionCallMember(node: unknown): node is FunctionCallMember {
  return (
    isNode(node) &&
    (isSpace(node) || isFunctionReference(node) || isArgumentListNode(node))
  );
}

export interface FunctionCallNode extends GroupNode<"functionCall"> {
  readonly members: readonly FunctionCallMember[];
  readonly reference: FunctionReference;
  readonly argumentList: ArgumentListNode;
}

export function isFunctionCallNode(node: Node): node is FunctionCallNode {
  const { reference, argumentList } = node as unknown as Record<
    string,
    unknown
  >;

  return (
    isGroupNode(node) &&
    node.members.every(isFunctionCallMember) &&
    node.type === "functionCall" &&
    isNode(reference) &&
    isFunctionReference(reference) &&
    isNode(argumentList) &&
    isArgumentListNode(argumentList)
  );
}

function createFunctionCall(nodes: Node[]): FunctionCallNode {
  const [reference, argumentList] = filterMeaningfulNodes(nodes);

  const functionCall = createGroup("functionCall", nodes);

  if (!isGroupNode(functionCall, isFunctionCallType, isFunctionCallMember)) {
    throw new Error(
      createNodeErrorMessage(
        functionCall,
        `expected function call to have a function reference and argument list, but got ${nodes.map(
          (node) => node.type
        )}`
      )
    );
  }

  if (!isFunctionReference(reference)) {
    throw new Error(
      createNodeErrorMessage(
        functionCall,
        `Function call must have a function reference, but encountered ${reference.type} instead`
      )
    );
  }

  if (!isArgumentListNode(argumentList)) {
    throw new Error(
      createNodeErrorMessage(
        functionCall,
        `Function call must have an argument list, but encountered ${argumentList.type} instead`
      )
    );
  }

  return {
    ...functionCall,
    reference,
    argumentList,
  };
}

export const reduceFunctionCalls: NodeReducer = eagerlyRepeat(([...nodes]) => {
  const meaningfulNodes = filterMeaningfulNodes(nodes);

  const argumentList = meaningfulNodes
    .filter(isArgumentListNode)
    .find((node) => {
      const previousNode = meaningfulNodes[meaningfulNodes.indexOf(node) - 1];

      return isFunctionReference(previousNode);
    });

  if (argumentList) {
    const reference =
      meaningfulNodes[meaningfulNodes.indexOf(argumentList) - 1];

    const referenceIndex = nodes.indexOf(reference);
    const argumentListIndex = nodes.indexOf(argumentList);

    const members = nodes.slice(referenceIndex, argumentListIndex + 1);

    nodes.splice(referenceIndex, members.length, createFunctionCall(members));
  }

  return nodes;
});

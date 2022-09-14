import { Node } from "./index";

export type NodeReducer = (nodes: ReadonlyArray<Node>) => Node[];

export function eagerlyRepeat(replacer: NodeReducer): NodeReducer {
  return ([...nodes]: readonly Node[]): Node[] => {
    let nodeCount = Infinity;
    let isStale = false;

    do {
      isStale = nodes.length === nodeCount;
      nodeCount = nodes.length;
      nodes = replacer(nodes);
    } while (nodes.length < nodeCount || !isStale);

    return nodes;
  };
}

export function composeReducers(
  ...reducers: readonly NodeReducer[]
): NodeReducer {
  return (nodes: readonly Node[]): Node[] =>
    reducers.reduce((nodes, reducer) => reducer([...nodes]), [...nodes]);
}

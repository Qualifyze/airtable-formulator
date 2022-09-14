import { isNode, Node, NodeType, TokenNode } from "./node";

export interface EnclosedNode<
  T extends NodeType = NodeType,
  Opener extends TokenNode = TokenNode,
  Closer extends TokenNode = TokenNode
> extends Node<T> {
  readonly opener: Opener;
  readonly closer: Closer;
}

export function isEnclosedNode(node: Node): node is EnclosedNode {
  const { opener, closer } = node as unknown as Record<string, unknown>;

  return isNode(opener) && isNode(closer);
}

export function encloseNode<
  T extends Node,
  Opener extends TokenNode,
  Closer extends TokenNode
>(
  node: T,
  opener: Opener,
  closer: Closer
): T & EnclosedNode<NodeType, Opener, Closer> {
  return {
    ...node,
    opener,
    closer,
  };
}

import { Node, TokenNode } from "./node";
import { computeGroupValue, GroupNode, GroupType, isGroupNode } from "./group";
import { EnclosedNode, encloseNode, isEnclosedNode } from "./enclosed";

export interface EnclosedGroupNode<
  T extends GroupType = GroupType,
  M extends Node = Node,
  Opener extends TokenNode = TokenNode,
  Closer extends TokenNode = TokenNode
> extends EnclosedNode<T, Opener, Closer>,
    GroupNode<T, M> {}

export function isEnclosedGroupNode(node: Node): node is EnclosedGroupNode {
  return isEnclosedNode(node) && isGroupNode(node);
}

export function createEnclosedGroup<
  T extends GroupType,
  M extends Node,
  Opener extends TokenNode,
  Closer extends TokenNode
>(
  type: T,
  nodes: readonly M[],
  opener: Opener,
  closer: Closer
): EnclosedGroupNode<T, M, Opener, Closer> {
  return encloseNode(
    {
      type,
      members: nodes,
      start: opener.end,
      end: closer.start,
      value: computeGroupValue(nodes),
    },
    opener,
    closer
  );
}

export function isEnclosedWithParenthesis(
  node: Node
): node is EnclosedGroupNode<
  GroupType,
  Node,
  TokenNode<"openParenthesis">,
  TokenNode<"closeParenthesis">
> {
  return (
    isEnclosedGroupNode(node) &&
    node.opener.type === "openParenthesis" &&
    node.closer.type === "closeParenthesis"
  );
}

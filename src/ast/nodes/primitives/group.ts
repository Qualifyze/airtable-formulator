import { isNode, Node } from "./node";
import { isEnclosedNode } from "./enclosed";

export const groupTypes = [
  "group",
  "argumentList",
  "enclosedExpression",
  "functionCall",
  "operation",
  "modifier",
] as const;
export type GroupType = typeof groupTypes[number];

export function isGroupType(type: string): type is GroupType {
  return groupTypes.includes(type as GroupType);
}

export interface GroupNode<
  T extends GroupType = GroupType,
  M extends Node = Node
> extends Node<T> {
  readonly members: Readonly<M[]>;
}

export function isGroupNode<
  T extends GroupType = GroupType,
  M extends Node = Node
>(
  node: Node,
  checkType: (type: string) => type is T = isGroupType as (
    type: string
  ) => type is T,
  checkMember: (node: unknown) => node is M = isNode as (
    node: unknown
  ) => node is M
): node is GroupNode<T, M> {
  const { members } = node as unknown as Record<string, unknown>;

  return (
    checkType(node.type) && Array.isArray(members) && members.every(checkMember)
  );
}

function createGap(a: Node, b = a, filler = " "): string {
  const bStart = isEnclosedNode(b) ? b.opener.start : b.start;
  const aEnd = isEnclosedNode(a) ? a.closer.end : a.end;
  const gap = bStart - aEnd;

  return gap > 0 ? filler.repeat(gap) : "";
}

function renderNode(node: Node): string {
  if (isEnclosedNode(node)) {
    return renderNode(node.opener) + node.value + renderNode(node.closer);
  }

  return node.value;
}

export function computeGroupValue<N extends Node>(
  members: readonly N[]
): string {
  return members
    .map((node, i) => `${renderNode(node)}${createGap(node, members[i + 1])}`)
    .join("");
}

export function createGroup<T extends GroupType, M extends Node>(
  type: T,
  nodes: readonly M[]
): GroupNode<T, M> {
  return {
    type,
    start: nodes[0]?.start ?? 0,
    end: nodes[nodes.length - 1]?.end ?? 0,
    value: computeGroupValue(nodes),
    members: nodes,
  };
}

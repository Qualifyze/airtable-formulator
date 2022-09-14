import { Node, TokenNode } from "./node";
import { GroupNode, isGroupNode } from "./group";

export type Space = TokenNode<"space">;

export function isSpace(node: Node): node is Space {
  return node.type === "space";
}

export function filterMeaningfulNodes<T extends Node>(
  nodes: readonly T[]
): Exclude<T, Space>[] {
  return nodes.filter((node) => !isSpace(node)) as Exclude<T, Space>[];
}

export function removeSpaces<T extends GroupNode>(node: T): T {
  return {
    ...node,
    members: filterMeaningfulNodes(node.members).map((member) =>
      isGroupNode(member) ? removeSpaces(member) : member
    ),
  };
}

export function reduceSpaces(nodes: readonly Node[]): Node[] {
  return nodes.filter((node) => !isSpace(node));
}

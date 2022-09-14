import { Node, TokenNode } from "./node";

export type Space = TokenNode<"space">;

export function isSpace(node: Node): node is Space {
  return node.type === "space";
}

export function filterMeaningfulNodes<T extends Node>(
  nodes: readonly T[]
): Exclude<T, Space>[] {
  return nodes.filter((node) => !isSpace(node)) as Exclude<T, Space>[];
}

export function reduceSpaces(nodes: readonly Node[]): Node[] {
  return nodes.filter((node) => !isSpace(node));
}

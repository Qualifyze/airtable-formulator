import { isTokenName, TokenTypeName } from "../../tokenize";
import { GroupType, isGroupType } from "./group";

export type ExtendedNodeType = "fieldReference" | "functionReference";

export type NodeType = TokenTypeName | GroupType | ExtendedNodeType;

function isNodeType(type: string): type is NodeType {
  return (
    isTokenName(type) ||
    isGroupType(type) ||
    type === "fieldReference" ||
    type === "functionReference"
  );
}

export interface Node<T extends NodeType = NodeType> {
  readonly type: T;
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

export function isNode(node: unknown): node is Node {
  if (typeof node !== "object" || node === null) {
    return false;
  }

  const { type, start, end, value } = node as Record<string, unknown>;
  return (
    typeof type === "string" &&
    isNodeType(type) &&
    typeof start === "number" &&
    typeof end === "number" &&
    typeof value === "string"
  );
}

export type TokenNode<T extends TokenTypeName = TokenTypeName> = Node<T>;

export function isTokenNode(node: Node): node is TokenNode {
  return isTokenName(node.type);
}

export function createNodeErrorMessage(
  node: Node,
  message: string,
  type = "Syntax"
): string {
  return `${type} Error while parsing ${node.type} node at position ${node.start}: ${message}`;
}

export type GetNodeType<T extends Node> = T extends Node<infer U> ? U : never;

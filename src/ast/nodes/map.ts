import {
  ExtendedNodeType,
  GroupNode,
  GroupType,
  Operator,
  TokenNode,
} from "./primitives";
import { FieldReference } from "./field-reference";
import { OperationNode } from "./operation";
import { FunctionCallNode } from "./function-call";
import { ArgumentListNode } from "./argument-list";
import { ModifierNode } from "./modifier";
import { EnclosedExpressionNode } from "./enclosed-expression";
import { FunctionReference } from "./function-reference";
import { DelimitedExpressionList } from "./delimited-expression-list";
import { TokenTypeName } from "../tokenize";

/**
 * Map of all node types, that have additional properties to their corresponding
 * node interface.
 */

type Map = {
  operator: Operator;
  fieldReference: FieldReference;
  functionReference: FunctionReference;
  operation: OperationNode;
  functionCall: FunctionCallNode;
  argumentList: ArgumentListNode;
  modifier: ModifierNode;
  enclosedExpression: EnclosedExpressionNode;
  delimitedExpressionList: DelimitedExpressionList;
  group: GroupNode;
};

// This will ensure that no types are left out in Map
type ExtendedMap = {
  // Make sure Map contains all the keys that are needed
  [T in GroupType | ExtendedNodeType | "operator"]: Map[T];
};

// Map the types that don't have extra properties.
type TokenMap = {
  [T in Exclude<TokenTypeName, keyof Map>]: TokenNode<T>;
};

/**
 * Map of all node types to their corresponding node interface.
 */

export interface NodeMap extends ExtendedMap, TokenMap {}

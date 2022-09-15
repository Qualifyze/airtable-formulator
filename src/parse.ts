import * as ast from "./ast/nodes";
import { GetNodeType } from "./ast/nodes";
import {
  FieldReference,
  Formula,
  FunctionCall,
  FunctionName,
  isOperation,
  Operation,
  OperatorSymbol,
  validate as validateFormula,
} from "./schema";
import { NodeMap } from "./ast/nodes/map";
import { parse as parseAst } from "./ast";

type ParseOptions = {
  validate?: boolean;
};

function convertExpression<T extends ast.ExpressionNode>(
  node: NodeMap[GetNodeType<T>]
): Formula {
  const converter = convert[node.type] as (
    node: NodeMap[GetNodeType<T>]
  ) => Formula;
  return converter(node);
}

type MapNodeTypeToFormulaOutput = {
  fieldReference: FieldReference;
  functionReference: FunctionName;
  operation: Operation;
  functionCall: FunctionCall | boolean;
  argumentList: Formula[];
  modifier: Formula | number;
  enclosedExpression: Formula;
  number: number;
  string: string;
  operator: OperatorSymbol;
};

type ConverterMap = {
  [T in keyof MapNodeTypeToFormulaOutput]: (
    node: NodeMap[T]
  ) => MapNodeTypeToFormulaOutput[T];
};

const convert: ConverterMap = {
  string: ({ value }) => value,
  number: ({ value }) => Number(value),
  modifier: ({ operator, operand }) => {
    if (convert.operator(operator) === "-") {
      return -convertExpression(operand);
    } else {
      throw new Error(`Unknown modifier operator: ${operator}`);
    }
  },
  operation: ({ operator, left, right }) => {
    const op = convert.operator(operator);
    const l = convertExpression(left);
    const r = convertExpression(right);

    return [
      op,
      ...(isOperation(l) && l[0] === op ? l.slice(1) : [l]),
      ...(isOperation(r) && r[0] === op ? r.slice(1) : [r]),
    ];
  },
  functionCall: ({ reference, argumentList }) => {
    const functionName: FunctionName = convert.functionReference(reference);
    const args: Formula[] = convert.argumentList(argumentList);
    if (
      args.length === 0 &&
      (functionName === "TRUE" || functionName === "FALSE")
    ) {
      switch (functionName) {
        case "TRUE":
          return true;
        case "FALSE":
          return false;
      }
    }

    return [functionName, ...args];
  },
  fieldReference: ({ value }) => ({
    field: value,
  }),
  operator: ({ value }) => value,
  functionReference: ({ value }) => value as FunctionName,
  enclosedExpression: ({ expression }) => convertExpression(expression),
  argumentList: ({ args }) => args.map(convertExpression),
} as const;

export function parse(
  formula: string,
  { validate = false }: ParseOptions = {}
): Formula | null {
  const astExpression = parseAst(formula, { removeSpace: true });
  const arrayNotedFormula = astExpression && convertExpression(astExpression);

  if (validate && arrayNotedFormula) {
    const errors = validateFormula(arrayNotedFormula);
    if (errors.length > 0) {
      // XXX unfortunately AJV error messages are totally misleading. One should
      // use a package that outputs more human-readable error messages.
      throw new Error("Parsed formula failed validation");
    }
  }
  return arrayNotedFormula;
}

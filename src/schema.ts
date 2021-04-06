import { functions, operators } from "./airtable-formula-reference.json";
import Ajv, { ErrorObject, JSONSchemaType, ValidateFunction } from "ajv";

export type FunctionName = keyof typeof functions;
export type OperatorSymbol = keyof typeof operators;

const functionNames: Set<FunctionName> = new Set(
  Object.keys(functions) as FunctionName[]
);

const operatorSymbols: Set<OperatorSymbol> = new Set(
  Object.keys(operators) as OperatorSymbol[]
);

export function isFunctionName(name: string): name is FunctionName {
  // XXX typescript incorrectly enforces the has argument to always be of the type that generic has been cast as.
  return functionNames.has(name as FunctionName);
}

export function isOperatorSymbol(symbol: string): symbol is OperatorSymbol {
  // XXX typescript incorrectly enforces the has argument to always be of the type that generic has been cast as.
  return operatorSymbols.has(symbol as OperatorSymbol);
}

type Literal = string | number | boolean;

export type FieldReference = { field: string };

const operatorSymbolSchema: JSONSchemaType<OperatorSymbol> = {
  type: "string",
  enum: Array.from(operatorSymbols),
};

const functionNameSchema: JSONSchemaType<FunctionName> = {
  type: "string",
  enum: Array.from(functionNames),
};

type ArrayNotation<T extends string> = [T, ...Formula[]];

export type FunctionCall = ArrayNotation<FunctionName>;
export type Operation = ArrayNotation<OperatorSymbol>;

export type Formula = FunctionCall | Operation | Literal | FieldReference;

const operationName = "operation";
const functionCallName = "functionCall";

function ref(name: string) {
  return {
    $ref: `#/definitions/${name}`,
  };
}

const literalSchema: JSONSchemaType<Literal> = {
  anyOf: [
    {
      type: "string",
    },
    {
      type: "number",
    },
    {
      type: "boolean",
    },
  ],
};

const fieldReferenceSchema: JSONSchemaType<FieldReference> = {
  type: "object",
  properties: {
    field: {
      type: "string",
    },
  },
  maxProperties: 1,
  additionalProperties: false,
  required: ["field"],
};

const argSchemaList = [
  literalSchema,
  ref(operationName),
  ref(functionCallName),
  fieldReferenceSchema,
];

const functionCallSchema: JSONSchemaType<FunctionCall> = {
  type: "array",
  items: [functionNameSchema],
  additionalItems: {
    anyOf: argSchemaList,
  },
  minItems: 1,
  maxItems: 1024,
};

const operationSchema: JSONSchemaType<Operation> = {
  type: "array",
  items: [operatorSymbolSchema],
  additionalItems: {
    anyOf: argSchemaList,
  },
  minItems: 1,
  maxItems: 1024,
};

export const schema: JSONSchemaType<Formula> = {
  definitions: {
    [functionCallName]: functionCallSchema,
    [operationName]: operationSchema,
  },
  anyOf: [
    literalSchema,
    operationSchema,
    functionCallSchema,
    fieldReferenceSchema,
  ],
};

export function createValidator(
  ajv = new Ajv({ strict: false })
): ValidateFunction<Formula> {
  return ajv.compile(schema);
}

export function isFunctionCall(formula: Formula): formula is FunctionCall {
  return Array.isArray(formula) && isFunctionName(formula[0]);
}

export function isOperation(formula: Formula): formula is Operation {
  return Array.isArray(formula) && isOperatorSymbol(formula[0]);
}

const _validate: ValidateFunction<Formula> = createValidator();

export function validate<T>(data: T): ErrorObject[] {
  return _validate(data) ? [] : _validate.errors || [];
}

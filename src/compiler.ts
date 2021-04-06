import {
  validate,
  FieldReference,
  Formula,
  FunctionCall,
  FunctionName,
  isFunctionName,
  isOperation,
  Operation,
  OperatorSymbol,
} from "./schema";

export function compile(formula: Formula): string {
  const validationErrors = validate(formula);
  if (validationErrors.length > 0) {
    throw new Error(
      `Error in validating formula notation: ${JSON.stringify(
        validationErrors,
        null,
        2
      )}`
    );
  }

  return _compile(formula);
}

function _compileFieldReference({ field }: FieldReference): string {
  // XXX Airtable API does not support curly braces in fieldnames, even though fieldname can contain curly braces
  if (field.includes("{") || field.includes("}")) {
    throw new Error(`Invalid field name: '${field}'`);
  }
  return `{${field}}`;
}

function _compileBoolean(bool: boolean): string {
  return _compile([bool ? "TRUE" : "FALSE"], bool);
}

function _compileComposite(
  compositeOperation: FunctionCall | Operation,
  parent?: Formula
): string {
  const [name, ...args] = compositeOperation;
  const compiledArgs = args.map((arg) => _compile(arg, compositeOperation));

  if (isFunctionName(name)) {
    return _compileFunctionCall([name, ...compiledArgs]);
  }

  return _compileOperation([name, ...compiledArgs], parent);
}

function _compileFunctionCall([name, ...args]: [
  FunctionName,
  ...string[]
]): string {
  return `${name}(${args.join(",")})`;
}

function _compileOperation(
  [op, ...args]: [OperatorSymbol, ...string[]],
  parent?: Formula
): string {
  const operationString = args.join(op);
  if (parent && isOperation(parent)) {
    return `(${operationString})`;
  }

  return operationString;
}

function _compile(formula: Formula, parent?: Formula): string {
  switch (typeof formula) {
    case "boolean":
      return _compileBoolean(formula);
    case "number":
      return `${formula}`;
    case "string":
      return JSON.stringify(formula);
    default:
      if (Array.isArray(formula)) {
        return _compileComposite(formula, parent);
      }

      return _compileFieldReference(formula);
  }
}

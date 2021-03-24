import { functions, operators } from "./airtable-formula-reference.json";
import {
  FieldReference,
  Formula,
  FunctionReference,
  Operator,
} from "./formula";

export type FunctionName = keyof typeof functions;
export type OperatorSymbol = keyof typeof operators;

export function op(operator: OperatorSymbol, ...args: Formula[]): Operator {
  return new Operator(operator).addArgument(...args);
}

export function call(
  functionName: FunctionName,
  ...args: Formula[]
): FunctionReference {
  return new FunctionReference(functionName).addArgument(...args);
}

export function field(fieldName: string): FieldReference {
  return new FieldReference(fieldName);
}

type Formulator = Record<FunctionName, (...args: Formula[]) => Formula>;

export const formulator: Formulator & {
  op: typeof op;
  field: typeof field;
} = Object.assign(
  { op, field },
  ...Object.keys(functions).map((functionName) => ({
    [functionName]: (...args: Formula[]) =>
      call(functionName as FunctionName, ...args),
  }))
);

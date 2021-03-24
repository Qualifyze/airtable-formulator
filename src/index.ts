import { formulator } from "./formulator";
import { Formula } from "./formula";
import { parseFormula } from "./parser";

export function parse(formula: string): Formula {
  return parseFormula(formula);
}

export default {
  ...formulator,
  parse,
};

import { JSDOM } from "jsdom";
import jQuery from "jquery";

function queryHtml(html: string): typeof jQuery {
  const { window } = new JSDOM(html);
  return jQuery(window) as unknown as typeof jQuery;
}

function findTableWithHeader($: typeof jQuery, header: string): JQuery {
  return $(`table tbody:has(tr:first:contains("${header}"))`);
}

function getTableColumnContents($table: JQuery, column: number): string[] {
  return $table
    .find("tr:not(:first)")
    .find(`td:eq(${column})`)
    .map(function () {
      return $table.find(this).text().trim();
    })
    .get();
}

function parseFunctionName(prototype: string) {
  const [, functionName] = prototype.match(/^(\w+)\(/) || [];
  return functionName;
}

function listFunctions($: typeof jQuery): string[] {
  const $tables = findTableWithHeader($, "Function");
  const prototypes = getTableColumnContents($tables, 0);

  return prototypes.map((prototype) => parseFunctionName(prototype));
}

function listOperators($: typeof jQuery): string[] {
  const $tables = findTableWithHeader($, "Operator");
  return getTableColumnContents($tables, 0);
}

export type AirtableReference = {
  functions: { [functionName: string]: Record<string, never> };
  operators: { [operatorSymbol: string]: Record<string, never> };
};

function isSane({
  functions,
  operators,
}: {
  functions: string[];
  operators: string[];
}): boolean {
  const expectedFunctions = ["AND", "NOT", "NOW", "ABS"];
  const expectedOperators = ["&", ">", "+"];

  return (
    expectedFunctions.every((fn) => functions.includes(fn)) &&
    expectedOperators.every((op) => operators.includes(op))
  );
}

export function parseReference(html: string): AirtableReference {
  const $ = queryHtml(html);

  const functions = listFunctions($);
  const operators = listOperators($);

  if (!isSane({ functions, operators })) {
    throw new Error(
      `Parsed Reference failed sanity check: ${JSON.stringify(
        { functions, operators },
        null,
        2
      )}`
    );
  }

  return {
    functions: Object.assign({}, ...functions.map((fn) => ({ [fn]: {} }))),
    operators: Object.assign({}, ...operators.map((op) => ({ [op]: {} }))),
  };
}

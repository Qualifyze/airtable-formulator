import { parseScript } from "meriyah";
import { Node } from "meriyah/dist/src/estree";
import {
  FieldReference,
  Formula,
  FunctionReference,
  Literal,
  Operator,
} from "./formula";

export function parseFormula(formula: string): Formula {
  // Airtable formulas can be thought of extremely reduced subset of JS syntax, even though meanings deviate.
  // XXX This a very lazy approach. We should build our own parser here.
  // XXX the above assumption doesn't hold true for the = operator, where JS will not allow literal on the rhs.
  // This required a workaround.
  const ast = parseScript(formula.replace("=", "=="), {
    // The flag to allow module code
    module: false,

    // The flag to enable stage 3 support (ESNext)
    next: false,

    // The flag to enable start, end offsets and range: [start, end] to each node
    ranges: false,

    // Enable web compatibility
    webcompat: false,

    // The flag to enable line/column location information to each node
    loc: false,

    // The flag to attach raw property to each literal and identifier node
    raw: false,

    // Enabled directives
    directives: false,

    // The flag to allow return in the global scope
    globalReturn: false,

    // The flag to enable implied strict mode
    impliedStrict: false,

    // Allows comment extraction. Accepts either a function or array
    onComment: [],

    // Allows token extraction. Accepts either a function or array
    onToken: [],

    // Enable non-standard parenthesized expression node
    preserveParens: false,

    // Enable lexical binding and scope tracking
    lexical: false,

    // Adds a source attribute in every node’s loc object when the locations option is `true`
    // source: false,

    // Distinguish Identifier from IdentifierPattern
    identifierPattern: false,

    // Enable React JSX parsing
    jsx: false,

    // Allow edge cases that deviate from the spec
    specDeviation: false,
  });

  return convertAst(ast);
}

function convertAst(node: Node): Formula {
  switch (node.type) {
    case "Program":
      const [singleStatement, unexpectedStatement] = node.body;

      if (unexpectedStatement) {
        throw new Error("Encountered unexpected statement");
      }

      return convertAst(singleStatement);
    case "ExpressionStatement":
      return convertAst(node.expression);
    case "BinaryExpression":
      return new Operator(node.operator).addArgument(
        convertAst(node.left),
        convertAst(node.right)
      );
    case "CallExpression":
      const { callee, arguments: args } = node;

      if (callee.type !== "Identifier") {
        throw new Error(`Expected function Identifier, got ${callee.type}`);
      }

      return new FunctionReference(node.callee).addArgument(
        ...args.map(convertAst)
      );
    case "ObjectExpression":
      // This must be a field reference: {myField}
      // but the AST parser thinks its an object notation.
      const {
        properties: [property, unexpectedProperty],
      } = node;

      if (!property) {
        throw new Error("Field name cannot be empty");
      }

      if (unexpectedProperty) {
        throw new Error(`Unexpected token ${unexpectedProperty}`); //TODO render whatever we got here.
      }

      if (property.type !== "Property") {
        throw new Error(); // TODO explain why whatever this could be is not acceptable.
      }

      const { kind, shorthand, method, key, value } = property;

      if (kind !== "init" || !shorthand || method) {
        throw new Error(); // TODO we got something weird here, explain it.
      }

      if (
        key.type !== "Identifier" ||
        value.type !== "Identifier" ||
        key.name !== value.name
      ) {
        throw new Error(); // TODO
      }

      return new FieldReference(key.name);
    case "Literal":
      // XXX above we replaced all = operators with "==". This needs to be undone here on the literal level.
      return new Literal(
        typeof node.value === "number"
          ? node.value
          : node.toString().replace("==", "=")
      );
    default:
      throw new Error(`Encountered unexpected ${node.type} node`);
  }
}

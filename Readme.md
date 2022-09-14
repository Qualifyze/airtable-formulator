# @qualifyze/airtable-formulator

## What?

A library that allows you to formulate airtable formulas in a structured rather
than unstructured notation.

Example `AND({name}="Robert",{age}>35)`:

```ts
import { Formula } from "airtable-formulator";

const formula: Formula = [
  "AND",
  ["=", { field: "name" }, "Robert"],
  [">", { field: "age" }, 35],
];
```

## Why?

- To allow TypeScript detect problems with a formula at build time.
- To validate a formula at runtime, using JSON Schema, before it gets sent to the Airtable API.
- For easy runtime manipulations of formulae without risking a code injection vulnerability.

## How?

### Install

```
npm install @qualifyze/airtable-formulator
```

### Use

Validate formula:

```ts
import { validate } from "airtable-formulator";

const validationErrors = validate(formula);

if (validationErrors.length > 0) {
  throw new Error(
    `Invalid Formula: ${JSON.stringify(validationErrors, null, 2)}`
  );
}
```

Compile formula:

```ts
import { compile } from "airtable-formulator";

const formulaStr = compile(formula);
```

### Maintain

If Airtable expends their library of functions and operators that can be used in formulae, run:

```
npm run update-reference
```

This will update the JSON manifest that lists all available functions and operators.

### Experimental AST Parser

The AST parser is still experimental in the sense it should not be used for critical applications.

```ts
import { parse } from "airtable-formulator";
const ast = parse("IF({name}='Robert',{age},0)");
```

The parser will for now only output an abstract syntax tree. It will not yet convert it into an object notation formula

The syntax tree for the parser above returns an object that matches this:

```json
{
  "type": "functionCall",
  "reference": {
    "value": "IF"
  },
  "argumentList": {
    "args": [
      {
        "type": "operation",
        "left": {
          "type": "fieldReference",
          "value": "name"
        },
        "operator": {
          "value": "="
        },
        "right": {
          "type": "string",
          "value": "Robert"
        }
      },
      {
        "type": "fieldReference"
      },
      {
        "type": "number"
      }
    ]
  }
}
```

Note that each object above also contains positional information about the location of the token in the formula string.

```json
{
  "type": "operator",
  "value": "=",
  "start": 9,
  "end": 10
}
```

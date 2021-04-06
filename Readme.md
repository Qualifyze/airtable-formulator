airtable-formulator
===================
## What?
A library that allows you to formulate airtable formulas in a structured rather
than unstructured notation.

Example `AND({name}="Robert",{age}>35)`:

```ts
import { Formula } from "airtable-formulator";

const formula: Formula = ["AND", ["=", {field: "name"}, "Robert"], [">", {field: "age"}, 35]];
```

## Why?
* To allow TypeScript detect problems with a formula at build time.
* To validate a formula at runtime, using JSON Schema, before it gets sent to the Airtable API.
* For easy runtime manipulations of formulae without risking a code injection vulnerability.

## How?

### Install
```
npm install airtable-formulator
```

### Use
Validate formula:
```ts
import { validate } from "airtable-formulator";

const validationErrors = validate(formula);

if (validationErrors.length > 0) {
    throw new Error(`Invalid Formula: ${JSON.stringify(validationErrors, null, 2)}`);
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

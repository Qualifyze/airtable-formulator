import { describe, expect, it } from "@jest/globals";
import { operators } from "../../airtable-formula-reference.json";
import { tokenize } from "../tokenize";

describe("tokenize()", () => {
  it("Should tokenize a simple formula", () => {
    expect(tokenize("1 + 2")).toMatchInlineSnapshot(`
      Object {
        "end": 5,
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "number",
            "value": "1",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 3,
            "start": 2,
            "type": "operator",
            "value": "+",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 5,
            "start": 4,
            "type": "number",
            "value": "2",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "1 + 2",
      }
    `);
  });

  it.each(Object.keys(operators))(`should tokenize operator %s`, (op) => {
    expect(tokenize(`1 ${op} 2`)).toMatchObject({
      members: [
        { type: "number", value: "1" },
        { type: "space", value: " " },
        { type: "operator", value: op },
        { type: "space", value: " " },
        { type: "number", value: "2" },
      ],
    });
  });

  it("Should tokenize a formula with decimal numbers", () => {
    expect(tokenize("1.5 + 2.5")).toMatchInlineSnapshot(`
      Object {
        "end": 9,
        "members": Array [
          Object {
            "end": 3,
            "start": 0,
            "type": "number",
            "value": "1.5",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 5,
            "start": 4,
            "type": "operator",
            "value": "+",
          },
          Object {
            "end": 6,
            "start": 5,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 9,
            "start": 6,
            "type": "number",
            "value": "2.5",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "1.5 + 2.5",
      }
    `);
  });

  it("Should tokenize a minus operator over a negative number", () => {
    expect(tokenize("-1-2")).toMatchInlineSnapshot(`
      Object {
        "end": 4,
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "operator",
            "value": "-",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "number",
            "value": "1",
          },
          Object {
            "end": 3,
            "start": 2,
            "type": "operator",
            "value": "-",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "number",
            "value": "2",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "-1-2",
      }
    `);
  });

  it("Should tokenize a formula with a string", () => {
    expect(tokenize("1 + 'Hello world'")).toMatchInlineSnapshot(`
      Object {
        "end": 17,
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "number",
            "value": "1",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 3,
            "start": 2,
            "type": "operator",
            "value": "+",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "space",
            "value": " ",
          },
          Object {
            "closer": Object {
              "end": 17,
              "start": 16,
              "type": "quoteMark",
              "value": "'",
            },
            "end": 16,
            "members": Array [],
            "opener": Object {
              "end": 5,
              "start": 4,
              "type": "quoteMark",
              "value": "'",
            },
            "start": 5,
            "type": "string",
            "value": "Hello world",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "1 + 'Hello world'",
      }
    `);
  });

  it("Should tokenize a formula with a field reference", () => {
    expect(tokenize("1 + myField")).toMatchInlineSnapshot(`
      Object {
        "end": 11,
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "number",
            "value": "1",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 3,
            "start": 2,
            "type": "operator",
            "value": "+",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 11,
            "start": 4,
            "type": "reference",
            "value": "myField",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "1 + myField",
      }
    `);
  });

  it("Should tokenize a formula with a function call", () => {
    expect(tokenize("1 + SUM(2, 3)")).toMatchInlineSnapshot(`
      Object {
        "end": 13,
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "number",
            "value": "1",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 3,
            "start": 2,
            "type": "operator",
            "value": "+",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 7,
            "start": 4,
            "type": "reference",
            "value": "SUM",
          },
          Object {
            "closer": Object {
              "end": 13,
              "start": 12,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 12,
            "members": Array [
              Object {
                "end": 9,
                "start": 8,
                "type": "number",
                "value": "2",
              },
              Object {
                "end": 10,
                "start": 9,
                "type": "argumentSeparator",
                "value": ",",
              },
              Object {
                "end": 11,
                "start": 10,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 12,
                "start": 11,
                "type": "number",
                "value": "3",
              },
            ],
            "opener": Object {
              "end": 8,
              "start": 7,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 8,
            "type": "group",
            "value": "2, 3",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "1 + SUM(2, 3)",
      }
    `);
  });

  it("Should tokenize braced references", () => {
    expect(tokenize("MIN({Regular Price}, {Sale Price})"))
      .toMatchInlineSnapshot(`
      Object {
        "end": 34,
        "members": Array [
          Object {
            "end": 3,
            "start": 0,
            "type": "reference",
            "value": "MIN",
          },
          Object {
            "closer": Object {
              "end": 34,
              "start": 33,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 33,
            "members": Array [
              Object {
                "closer": Object {
                  "end": 19,
                  "start": 18,
                  "type": "closeBrace",
                  "value": "}",
                },
                "end": 18,
                "members": Array [],
                "opener": Object {
                  "end": 5,
                  "start": 4,
                  "type": "openBrace",
                  "value": "{",
                },
                "start": 5,
                "type": "reference",
                "value": "Regular Price",
              },
              Object {
                "end": 20,
                "start": 19,
                "type": "argumentSeparator",
                "value": ",",
              },
              Object {
                "end": 21,
                "start": 20,
                "type": "space",
                "value": " ",
              },
              Object {
                "closer": Object {
                  "end": 33,
                  "start": 32,
                  "type": "closeBrace",
                  "value": "}",
                },
                "end": 32,
                "members": Array [],
                "opener": Object {
                  "end": 22,
                  "start": 21,
                  "type": "openBrace",
                  "value": "{",
                },
                "start": 22,
                "type": "reference",
                "value": "Sale Price",
              },
            ],
            "opener": Object {
              "end": 4,
              "start": 3,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 4,
            "type": "group",
            "value": ", ",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "MIN({Regular Price}, {Sale Price})",
      }
    `);
  });

  it("Should tokenize a formula with a function call with a field reference", () => {
    expect(tokenize("1 + SUM(myField, 3)")).toMatchInlineSnapshot(`
      Object {
        "end": 19,
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "number",
            "value": "1",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 3,
            "start": 2,
            "type": "operator",
            "value": "+",
          },
          Object {
            "end": 4,
            "start": 3,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 7,
            "start": 4,
            "type": "reference",
            "value": "SUM",
          },
          Object {
            "closer": Object {
              "end": 19,
              "start": 18,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 18,
            "members": Array [
              Object {
                "end": 15,
                "start": 8,
                "type": "reference",
                "value": "myField",
              },
              Object {
                "end": 16,
                "start": 15,
                "type": "argumentSeparator",
                "value": ",",
              },
              Object {
                "end": 17,
                "start": 16,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 18,
                "start": 17,
                "type": "number",
                "value": "3",
              },
            ],
            "opener": Object {
              "end": 8,
              "start": 7,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 8,
            "type": "group",
            "value": "myField, 3",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "1 + SUM(myField, 3)",
      }
    `);
  });

  it("Should tokenize a formula with parenthesis", () => {
    expect(tokenize("(1 + 2) * 3")).toMatchInlineSnapshot(`
      Object {
        "end": 11,
        "members": Array [
          Object {
            "closer": Object {
              "end": 7,
              "start": 6,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 6,
            "members": Array [
              Object {
                "end": 2,
                "start": 1,
                "type": "number",
                "value": "1",
              },
              Object {
                "end": 3,
                "start": 2,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 4,
                "start": 3,
                "type": "operator",
                "value": "+",
              },
              Object {
                "end": 5,
                "start": 4,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 6,
                "start": 5,
                "type": "number",
                "value": "2",
              },
            ],
            "opener": Object {
              "end": 1,
              "start": 0,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 1,
            "type": "group",
            "value": "1 + 2",
          },
          Object {
            "end": 8,
            "start": 7,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 9,
            "start": 8,
            "type": "operator",
            "value": "*",
          },
          Object {
            "end": 10,
            "start": 9,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 11,
            "start": 10,
            "type": "number",
            "value": "3",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "(1 + 2) * 3",
      }
    `);
  });

  it("Should tokenize a formula with a new lines", () => {
    expect(
      tokenize(`IF(
      {Sales Tax} * {Price} > 100,
      "This is over 100",
      "This is less than 100"
    )`)
    ).toMatchInlineSnapshot(`
      Object {
        "end": 100,
        "members": Array [
          Object {
            "end": 2,
            "start": 0,
            "type": "reference",
            "value": "IF",
          },
          Object {
            "closer": Object {
              "end": 100,
              "start": 99,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 99,
            "members": Array [
              Object {
                "end": 10,
                "start": 3,
                "type": "space",
                "value": "
            ",
              },
              Object {
                "closer": Object {
                  "end": 21,
                  "start": 20,
                  "type": "closeBrace",
                  "value": "}",
                },
                "end": 20,
                "members": Array [],
                "opener": Object {
                  "end": 11,
                  "start": 10,
                  "type": "openBrace",
                  "value": "{",
                },
                "start": 11,
                "type": "reference",
                "value": "Sales Tax",
              },
              Object {
                "end": 22,
                "start": 21,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 23,
                "start": 22,
                "type": "operator",
                "value": "*",
              },
              Object {
                "end": 24,
                "start": 23,
                "type": "space",
                "value": " ",
              },
              Object {
                "closer": Object {
                  "end": 31,
                  "start": 30,
                  "type": "closeBrace",
                  "value": "}",
                },
                "end": 30,
                "members": Array [],
                "opener": Object {
                  "end": 25,
                  "start": 24,
                  "type": "openBrace",
                  "value": "{",
                },
                "start": 25,
                "type": "reference",
                "value": "Price",
              },
              Object {
                "end": 32,
                "start": 31,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 33,
                "start": 32,
                "type": "operator",
                "value": ">",
              },
              Object {
                "end": 34,
                "start": 33,
                "type": "space",
                "value": " ",
              },
              Object {
                "end": 37,
                "start": 34,
                "type": "number",
                "value": "100",
              },
              Object {
                "end": 38,
                "start": 37,
                "type": "argumentSeparator",
                "value": ",",
              },
              Object {
                "end": 45,
                "start": 38,
                "type": "space",
                "value": "
            ",
              },
              Object {
                "closer": Object {
                  "end": 63,
                  "start": 62,
                  "type": "quoteMark",
                  "value": "\\"",
                },
                "end": 62,
                "members": Array [],
                "opener": Object {
                  "end": 46,
                  "start": 45,
                  "type": "quoteMark",
                  "value": "\\"",
                },
                "start": 46,
                "type": "string",
                "value": "This is over 100",
              },
              Object {
                "end": 64,
                "start": 63,
                "type": "argumentSeparator",
                "value": ",",
              },
              Object {
                "end": 71,
                "start": 64,
                "type": "space",
                "value": "
            ",
              },
              Object {
                "closer": Object {
                  "end": 94,
                  "start": 93,
                  "type": "quoteMark",
                  "value": "\\"",
                },
                "end": 93,
                "members": Array [],
                "opener": Object {
                  "end": 72,
                  "start": 71,
                  "type": "quoteMark",
                  "value": "\\"",
                },
                "start": 72,
                "type": "string",
                "value": "This is less than 100",
              },
              Object {
                "end": 99,
                "start": 94,
                "type": "space",
                "value": "
          ",
              },
            ],
            "opener": Object {
              "end": 3,
              "start": 2,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 3,
            "type": "group",
            "value": "
             *  > 100,
            ,
            
          ",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "IF(
            {Sales Tax} * {Price} > 100,
            \\"This is over 100\\",
            \\"This is less than 100\\"
          )",
      }
    `);
  });

  it("Should tokenize a string with escaped quotes", () => {
    expect(tokenize(`"This is a \\"string\\""`)).toMatchInlineSnapshot(`
      Object {
        "end": 22,
        "members": Array [
          Object {
            "closer": Object {
              "end": 22,
              "start": 21,
              "type": "quoteMark",
              "value": "\\"",
            },
            "end": 21,
            "members": Array [],
            "opener": Object {
              "end": 1,
              "start": 0,
              "type": "quoteMark",
              "value": "\\"",
            },
            "start": 1,
            "type": "string",
            "value": "This is a \\\\\\"string\\\\\\"",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "\\"This is a \\\\\\"string\\\\\\"\\"",
      }
    `);
  });

  it("Should tokenize mixed quotes", () => {
    expect(tokenize(`"'"`)).toMatchInlineSnapshot(`
      Object {
        "end": 3,
        "members": Array [
          Object {
            "closer": Object {
              "end": 3,
              "start": 2,
              "type": "quoteMark",
              "value": "\\"",
            },
            "end": 2,
            "members": Array [],
            "opener": Object {
              "end": 1,
              "start": 0,
              "type": "quoteMark",
              "value": "\\"",
            },
            "start": 1,
            "type": "string",
            "value": "'",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "\\"'\\"",
      }
    `);

    expect(tokenize(`'"'`)).toMatchInlineSnapshot(`
      Object {
        "end": 3,
        "members": Array [
          Object {
            "closer": Object {
              "end": 3,
              "start": 2,
              "type": "quoteMark",
              "value": "'",
            },
            "end": 2,
            "members": Array [],
            "opener": Object {
              "end": 1,
              "start": 0,
              "type": "quoteMark",
              "value": "'",
            },
            "start": 1,
            "type": "string",
            "value": "\\"",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "'\\"'",
      }
    `);
  });

  it("Should not tokenize special characters in strings", () => {
    expect(tokenize(`"(){}''"`)).toMatchInlineSnapshot(`
      Object {
        "end": 8,
        "members": Array [
          Object {
            "closer": Object {
              "end": 8,
              "start": 7,
              "type": "quoteMark",
              "value": "\\"",
            },
            "end": 7,
            "members": Array [],
            "opener": Object {
              "end": 1,
              "start": 0,
              "type": "quoteMark",
              "value": "\\"",
            },
            "start": 1,
            "type": "string",
            "value": "(){}''",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "\\"(){}''\\"",
      }
    `);
    expect(tokenize(`foo("(){}''")`)).toMatchInlineSnapshot(`
      Object {
        "end": 13,
        "members": Array [
          Object {
            "end": 3,
            "start": 0,
            "type": "reference",
            "value": "foo",
          },
          Object {
            "closer": Object {
              "end": 13,
              "start": 12,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 12,
            "members": Array [
              Object {
                "closer": Object {
                  "end": 12,
                  "start": 11,
                  "type": "quoteMark",
                  "value": "\\"",
                },
                "end": 11,
                "members": Array [],
                "opener": Object {
                  "end": 5,
                  "start": 4,
                  "type": "quoteMark",
                  "value": "\\"",
                },
                "start": 5,
                "type": "string",
                "value": "(){}''",
              },
            ],
            "opener": Object {
              "end": 4,
              "start": 3,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 4,
            "type": "group",
            "value": "",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "foo(\\"(){}''\\")",
      }
    `);
  });

  it("Should tokenize a string with escaped backlash", () => {
    expect(tokenize(`"\\\\"`)).toMatchInlineSnapshot(`
      Object {
        "end": 4,
        "members": Array [
          Object {
            "closer": Object {
              "end": 4,
              "start": 3,
              "type": "quoteMark",
              "value": "\\"",
            },
            "end": 3,
            "members": Array [],
            "opener": Object {
              "end": 1,
              "start": 0,
              "type": "quoteMark",
              "value": "\\"",
            },
            "start": 1,
            "type": "string",
            "value": "\\\\\\\\",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "\\"\\\\\\\\\\"",
      }
    `);
  });

  it("Should tokenize triple operators", () => {
    expect(tokenize(`Name & " - " & Age`)).toMatchInlineSnapshot(`
      Object {
        "end": 18,
        "members": Array [
          Object {
            "end": 4,
            "start": 0,
            "type": "reference",
            "value": "Name",
          },
          Object {
            "end": 5,
            "start": 4,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 6,
            "start": 5,
            "type": "operator",
            "value": "&",
          },
          Object {
            "end": 7,
            "start": 6,
            "type": "space",
            "value": " ",
          },
          Object {
            "closer": Object {
              "end": 12,
              "start": 11,
              "type": "quoteMark",
              "value": "\\"",
            },
            "end": 11,
            "members": Array [],
            "opener": Object {
              "end": 8,
              "start": 7,
              "type": "quoteMark",
              "value": "\\"",
            },
            "start": 8,
            "type": "string",
            "value": " - ",
          },
          Object {
            "end": 13,
            "start": 12,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 14,
            "start": 13,
            "type": "operator",
            "value": "&",
          },
          Object {
            "end": 15,
            "start": 14,
            "type": "space",
            "value": " ",
          },
          Object {
            "end": 18,
            "start": 15,
            "type": "reference",
            "value": "Age",
          },
        ],
        "start": 0,
        "type": "group",
        "value": "Name & \\" - \\" & Age",
      }
    `);
  });

  it("Should throw on unbalanced quotes", () => {
    expect(() =>
      tokenize(`"This is a "string"`)
    ).toThrowErrorMatchingInlineSnapshot(
      `"SyntaxError: Unclosed token doubleQuotedString, with \\" at position 18, but no closing token at position 19"`
    );
  });

  it("Should throw on unbalanced field reference", () => {
    expect(() =>
      tokenize(`{this is a field`)
    ).toThrowErrorMatchingInlineSnapshot(
      `"SyntaxError: Unclosed token bracedReference, with { at position 0, but no closing token at position 16"`
    );
  });

  it("Should throw on unbalanced parentheses", () => {
    expect(() => tokenize(`IF(1, 2, 3`)).toThrowErrorMatchingInlineSnapshot(
      `"SyntaxError: Unclosed token group, with ( at position 2, but no closing token at position 10"`
    );
    expect(() => tokenize(`IF1, 2, 3)`)).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error: Unexpected closing token ) at 9"`
    );
  });

  it("Should throw on invalid tokens", () => {
    // Invalid []
    expect(() => tokenize(`[`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 0 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"[\\""
    `);
    expect(() => tokenize(`]`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 0 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"]\\""
    `);
    expect(() => tokenize(`a[1`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 1 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"[1\\""
    `);
    expect(() => tokenize(`IF[1, 2, 3]`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 2 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"[1, 2, 3]\\""
    `);
    // Invalid ``
    expect(() => tokenize("`")).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 0 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"\`\\""
    `);
    expect(() => tokenize("`Hello World`")).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 0 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"\`Hello World\`\\""
    `);
    // Invalid operator %
    expect(() => tokenize(`%`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 0 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"%\\""
    `);
    expect(() => tokenize(`a%b`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 1 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"%b\\""
    `);
    // Invalid operator $
    expect(() => tokenize(`$`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 0 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"$\\""
    `);
    expect(() => tokenize(`a$b`)).toThrowErrorMatchingInlineSnapshot(`
      "Syntax error at position 1 for group:
      	Expected: openDoubleQuote (/\\"/), openSingleQuote (/'/), openParenthesis (/\\\\(/), openBrace (/\\\\{/), closeParenthesis (/\\\\)/), number (/\\\\d+(?:\\\\.\\\\d+)?/), argumentSeparator (/,/), operator (/>=|<=|!=|\\\\+|\\\\*|&|>|<|=|-|\\\\//), reference (/\\\\b[a-z]\\\\w*/i), space (/\\\\s+/), group (/[]/)
      	Got: \\"$b\\""
    `);
  });
});

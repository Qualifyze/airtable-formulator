import { expect, it, describe } from "@jest/globals";
import { parse } from "../parse";

describe("parse()", () => {
  it("should work with the example in the readme", () => {
    expect(parse("IF({name}='Robert',{age},0)")).toMatchObject({
      type: "functionCall",
      reference: {
        value: "IF",
      },
      argumentList: {
        args: [
          {
            type: "operation",
            left: {
              type: "fieldReference",
              value: "name",
            },
            operator: {
              value: "=",
            },
            right: {
              type: "string",
              value: "Robert",
            },
          },
          {
            type: "fieldReference",
          },
          {
            type: "number",
          },
        ],
      },
    });
  });

  it("should parse empty extremes", () => {
    expect(parse("")).toBeNull();
    expect(parse(" ")).toBeNull();
  });

  it("should parse literals", () => {
    expect(parse("1")).toMatchObject({
      type: "number",
      value: "1",
    });
    expect(parse("1.234")).toMatchObject({
      type: "number",
      value: "1.234",
    });
    expect(parse("'hello'")).toMatchObject({
      type: "string",
      value: "hello",
      opener: {
        type: "quoteMark",
      },
      closer: {
        type: "quoteMark",
      },
    });
  });

  it("should parse field references", () => {
    expect(parse("foo")).toMatchObject({
      type: "fieldReference",
      value: "foo",
    });
    expect(parse("{foo bar}")).toMatchObject({
      type: "fieldReference",
      value: "foo bar",
    });
  });

  it("should parse modifiers", () => {
    expect(parse("-1")).toMatchObject({
      type: "modifier",
      value: "-1",
      operator: {
        type: "operator",
        value: "-",
      },
      operand: {
        type: "number",
        value: "1",
      },
    });
    expect(parse("-a")).toMatchObject({
      type: "modifier",
      value: "-a",
      operator: {
        type: "operator",
        value: "-",
      },
      operand: {
        type: "fieldReference",
        value: "a",
      },
    });

    expect(parse("--a")).toMatchObject({
      type: "modifier",
      value: "--a",
      operator: {
        type: "operator",
        value: "-",
      },
      operand: {
        type: "modifier",
        value: "-a",
        operator: {
          type: "operator",
          value: "-",
        },
        operand: {
          type: "fieldReference",
          value: "a",
        },
      },
    });
  });

  it("should parse operations", () => {
    expect(parse("1 + 2")).toMatchObject({
      type: "operation",
      value: "1 + 2",
      operator: {
        type: "operator",
        value: "+",
      },
      left: {
        type: "number",
        value: "1",
      },
      right: {
        type: "number",
        value: "2",
      },
    });
    expect(parse("1 != 3")).toMatchObject({
      type: "operation",
      value: "1 != 3",
      operator: {
        type: "operator",
        value: "!=",
      },
      left: {
        type: "number",
        value: "1",
      },
      right: {
        type: "number",
        value: "3",
      },
    });
    expect(parse("1 + 2 + 3")).toMatchObject({
      type: "operation",
      value: "1 + 2 + 3",
      operator: {
        type: "operator",
        value: "+",
      },
      left: {
        type: "operation",
        value: "1 + 2",
        operator: {
          type: "operator",
          value: "+",
        },
        left: {
          type: "number",
          value: "1",
        },
        right: {
          type: "number",
          value: "2",
        },
      },
      right: {
        type: "number",
        value: "3",
      },
    });
    expect(parse("-1 + 2")).toMatchObject({
      type: "operation",
      left: {
        type: "modifier",
        operator: {
          value: "-",
        },
        operand: {
          type: "number",
          value: "1",
        },
      },
      operator: {
        type: "operator",
        value: "+",
      },
      right: {
        type: "number",
        value: "2",
      },
    });
    expect(parse("1 <= 5")).toMatchObject({
      type: "operation",
      left: {
        type: "number",
        value: "1",
      },
      operator: {
        type: "operator",
        value: "<=",
      },
      right: {
        type: "number",
        value: "5",
      },
    });
  });

  it("should respect operator precedence", () => {
    expect(parse("1 + 2 * 3")).toMatchObject({
      left: {
        value: "1",
      },
      operator: {
        value: "+",
      },
      right: {
        left: {
          value: "2",
        },
        operator: {
          value: "*",
        },
        right: {
          value: "3",
        },
      },
    });
    expect(parse("1 * 2 + 3")).toMatchObject({
      left: {
        left: {
          value: "1",
        },
        operator: {
          value: "*",
        },
        right: {
          value: "2",
        },
      },
      operator: {
        value: "+",
      },
      right: {
        value: "3",
      },
    });
  });

  it("should parse enclosed expressions", () => {
    expect(parse("(1)")).toMatchObject({
      type: "enclosedExpression",
      value: "1",
      opener: {
        type: "openParenthesis",
      },
      closer: {
        type: "closeParenthesis",
      },
      expression: {
        type: "number",
        value: "1",
      },
    });

    expect(parse("(1 + 2)")).toMatchObject({
      type: "enclosedExpression",
      value: "1 + 2",
      opener: {
        type: "openParenthesis",
      },
      closer: {
        type: "closeParenthesis",
      },
      expression: {
        type: "operation",
        value: "1 + 2",
        operator: {
          type: "operator",
          value: "+",
        },
        left: {
          type: "number",
          value: "1",
        },
        right: {
          type: "number",
          value: "2",
        },
      },
    });

    expect(parse("((1))")).toMatchObject({
      type: "enclosedExpression",
      value: "(1)",
      expression: {
        type: "enclosedExpression",
        value: "1",
        expression: {
          type: "number",
          value: "1",
        },
      },
    });

    expect(parse("((0) * (0))")).toMatchObject({
      type: "enclosedExpression",
      value: "(0) * (0)",
      expression: {
        type: "operation",
        value: "(0) * (0)",
        operator: {
          type: "operator",
          value: "*",
        },
        left: {
          type: "enclosedExpression",
          value: "0",
          expression: {
            type: "number",
            value: "0",
          },
        },
        right: {
          type: "enclosedExpression",
          value: "0",
          expression: {
            type: "number",
            value: "0",
          },
        },
      },
    });
  });

  it("should parse function calls", () => {
    expect(parse("foo()")).toMatchObject({
      type: "functionCall",
      value: "foo()",
      argumentList: {
        type: "argumentList",
        args: [],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });
    expect(parse("foo(1)")).toMatchObject({
      type: "functionCall",
      value: "foo(1)",
      argumentList: {
        type: "argumentList",
        args: [
          {
            type: "number",
            value: "1",
          },
        ],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });
    expect(parse("foo(a)")).toMatchObject({
      type: "functionCall",
      value: "foo(a)",
      argumentList: {
        type: "argumentList",
        args: [
          {
            type: "fieldReference",
            value: "a",
          },
        ],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });
    expect(parse("foo('a')")).toMatchObject({
      type: "functionCall",
      value: "foo('a')",
      argumentList: {
        type: "argumentList",
        args: [
          {
            type: "string",
            value: "a",
          },
        ],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });
    expect(parse("foo(bar())")).toMatchObject({
      type: "functionCall",
      value: "foo(bar())",
      argumentList: {
        type: "argumentList",
        args: [
          {
            type: "functionCall",
            value: "bar()",
            argumentList: {
              type: "argumentList",
              args: [],
            },
            reference: {
              type: "functionReference",
              value: "bar",
            },
          },
        ],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });
    expect(parse("foo(1, 2)")).toMatchObject({
      type: "functionCall",
      value: "foo(1, 2)",
      argumentList: {
        type: "argumentList",
        args: [
          {
            type: "number",
            value: "1",
          },
          {
            type: "number",
            value: "2",
          },
        ],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });
    expect(parse("foo(1, a, 'x', bar())")).toMatchObject({
      type: "functionCall",
      argumentList: {
        args: [
          {
            type: "number",
            value: "1",
          },
          {
            type: "fieldReference",
            value: "a",
          },
          {
            type: "string",
            value: "x",
          },
          {
            type: "functionCall",
            argumentList: {
              args: [],
            },
            reference: {
              value: "bar",
            },
          },
        ],
      },
      reference: {
        type: "functionReference",
        value: "foo",
      },
    });

    expect(parse("foo(1, bar(), 2)")).toMatchObject({
      type: "functionCall",
      argumentList: {
        args: [
          {
            type: "number",
            value: "1",
          },
          {
            type: "functionCall",
            argumentList: {
              args: [],
            },
            reference: {
              value: "bar",
            },
          },
          {
            type: "number",
            value: "2",
          },
        ],
      },
      reference: {
        value: "foo",
      },
    });

    expect(parse("foo(bar(), 'x', 3)")).toMatchObject({
      argumentList: {
        args: [
          {
            type: "functionCall",
            argumentList: {
              args: [],
            },
            reference: {
              value: "bar",
            },
          },
          {
            type: "string",
            value: "x",
          },
          {
            type: "number",
            value: "3",
          },
        ],
      },
      reference: {
        value: "foo",
      },
    });
    expect(parse("IF(TRUE(), FALSE())")).toMatchObject({
      type: "functionCall",
      reference: { value: "IF" },
      argumentList: {
        type: "argumentList",
        args: [
          {
            type: "functionCall",
            reference: { value: "TRUE" },
            argumentList: {
              args: [],
            },
          },
          {
            type: "functionCall",
            reference: { value: "FALSE" },
            argumentList: {
              args: [],
            },
          },
        ],
      },
    });
  });

  it("should parse complicated formulas", () => {
    expect(parse("a+foo()")).toMatchInlineSnapshot(`
      Object {
        "end": 6,
        "left": Object {
          "end": 1,
          "start": 0,
          "type": "fieldReference",
          "value": "a",
        },
        "members": Array [
          Object {
            "end": 1,
            "start": 0,
            "type": "fieldReference",
            "value": "a",
          },
          Object {
            "end": 2,
            "start": 1,
            "type": "operator",
            "value": "+",
          },
          Object {
            "argumentList": Object {
              "args": Array [],
              "closer": Object {
                "end": 7,
                "start": 6,
                "type": "closeParenthesis",
                "value": ")",
              },
              "end": 6,
              "members": Array [],
              "opener": Object {
                "end": 6,
                "start": 5,
                "type": "openParenthesis",
                "value": "(",
              },
              "start": 6,
              "type": "argumentList",
              "value": "",
            },
            "end": 6,
            "members": Array [
              Object {
                "end": 5,
                "start": 2,
                "type": "functionReference",
                "value": "foo",
              },
              Object {
                "args": Array [],
                "closer": Object {
                  "end": 7,
                  "start": 6,
                  "type": "closeParenthesis",
                  "value": ")",
                },
                "end": 6,
                "members": Array [],
                "opener": Object {
                  "end": 6,
                  "start": 5,
                  "type": "openParenthesis",
                  "value": "(",
                },
                "start": 6,
                "type": "argumentList",
                "value": "",
              },
            ],
            "reference": Object {
              "end": 5,
              "start": 2,
              "type": "functionReference",
              "value": "foo",
            },
            "start": 2,
            "type": "functionCall",
            "value": "foo()",
          },
        ],
        "operator": Object {
          "end": 2,
          "start": 1,
          "type": "operator",
          "value": "+",
        },
        "right": Object {
          "argumentList": Object {
            "args": Array [],
            "closer": Object {
              "end": 7,
              "start": 6,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 6,
            "members": Array [],
            "opener": Object {
              "end": 6,
              "start": 5,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 6,
            "type": "argumentList",
            "value": "",
          },
          "end": 6,
          "members": Array [
            Object {
              "end": 5,
              "start": 2,
              "type": "functionReference",
              "value": "foo",
            },
            Object {
              "args": Array [],
              "closer": Object {
                "end": 7,
                "start": 6,
                "type": "closeParenthesis",
                "value": ")",
              },
              "end": 6,
              "members": Array [],
              "opener": Object {
                "end": 6,
                "start": 5,
                "type": "openParenthesis",
                "value": "(",
              },
              "start": 6,
              "type": "argumentList",
              "value": "",
            },
          ],
          "reference": Object {
            "end": 5,
            "start": 2,
            "type": "functionReference",
            "value": "foo",
          },
          "start": 2,
          "type": "functionCall",
          "value": "foo()",
        },
        "start": 0,
        "type": "operation",
        "value": "a+foo()",
      }
    `);
    expect(
      parse(
        "IF(AND(name='Robert',age >= {minimum age} + 10), TRUE(), 'not robert or underage')"
      )
    ).toMatchObject({
      type: "functionCall",
      reference: { value: "IF" },
      argumentList: {
        args: [
          {
            type: "functionCall",
            reference: { value: "AND" },
            argumentList: {
              args: [
                {
                  type: "operation",
                  left: {
                    type: "fieldReference",
                    value: "name",
                  },
                  operator: {
                    value: "=",
                  },
                  right: {
                    type: "string",
                    value: "Robert",
                  },
                },
                {
                  type: "operation",
                  left: {
                    type: "fieldReference",
                    value: "age",
                  },
                  operator: {
                    value: ">=",
                  },

                  right: {
                    type: "operation",
                    left: {
                      type: "fieldReference",
                      value: "minimum age",
                    },
                    operator: {
                      value: "+",
                    },
                    right: {
                      value: "10",
                    },
                  },
                },
              ],
            },
          },
          {
            type: "functionCall",
            reference: { value: "TRUE" },
            argumentList: {
              args: [],
            },
          },
          {
            value: "not robert or underage",
          },
        ],
      },
    });
  });

  it("should throw on invalid function call syntax", () => {
    expect(() => parse("foo(,)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 4: Expected at least one node before separator, but got none"`
    );
    expect(() => parse("foo(,3)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 4: Expected at least one node before separator, but got none"`
    );
    expect(() => parse("foo(1,,3)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 6: Expected at least one node before separator, but got none"`
    );
    expect(() => parse("foo(2,)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 5: expected at least one node after separator, but got 0"`
    );
    expect(() => parse("(1,2)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing group node at position 1: Expected an argument list to be preceded by a reference, but got undefined instead"`
    );
    expect(() => parse("foo(1,2)s")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing reference node at position 8: Unexpected node reference"`
    );
    expect(() => parse("1,2")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 1: Unexpected node argumentSeparator"`
    );
    expect(() => parse("f o(1,2)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing reference node at position 2: Unexpected node reference"`
    );

    expect(() => parse("&3")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing number node at position 1: Unexpected node number"`
    );
    expect(() => parse("(*3)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing enclosedExpression node at position 1: Invalid Enclosed expression"`
    );
  });

  it("should throw on invalid operator usage", () => {
    expect(() => parse("1+")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing operator node at position 1: Unexpected node operator"`
    );
    expect(() => parse("1+()")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing group node at position 3: Expected an argument list to be preceded by a reference, but got operator instead"`
    );
  });

  it("should remove spaces", () => {
    expect(parse("1 + 2", { removeSpace: true })).toMatchObject({
      type: "operation",
      members: [
        {
          type: "number",
          value: "1",
        },
        {
          type: "operator",
          value: "+",
        },
        {
          type: "number",
          value: "2",
        },
      ],
    });
  });

  it("should keep spaces", () => {
    expect(parse("1 + 2", { removeSpace: false })).toMatchObject({
      type: "operation",
      members: [
        {
          type: "number",
          value: "1",
        },
        {
          type: "space",
          value: " ",
          start: 1,
          end: 2,
        },
        {
          type: "operator",
          value: "+",
        },
        {
          type: "space",
          value: " ",
          start: 3,
          end: 4,
        },
        {
          type: "number",
          value: "2",
        },
      ],
      left: {
        type: "number",
        value: "1",
      },
      right: {
        type: "number",
        value: "2",
      },
      operator: {
        type: "operator",
        value: "+",
      },
    });
  });
});

import { expect, it, describe } from "@jest/globals";
import { parse } from "../parse";

describe("parse()", () => {
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
    expect(parse("foo(1, a, 'x', bar())")).toMatchInlineSnapshot(`
      Object {
        "argumentList": Object {
          "args": Array [
            Object {
              "end": 5,
              "start": 4,
              "type": "number",
              "value": "1",
            },
            Object {
              "end": 8,
              "start": 7,
              "type": "fieldReference",
              "value": "a",
            },
            Object {
              "closer": Object {
                "end": 13,
                "start": 12,
                "type": "quoteMark",
                "value": "'",
              },
              "end": 12,
              "members": Array [],
              "opener": Object {
                "end": 11,
                "start": 10,
                "type": "quoteMark",
                "value": "'",
              },
              "start": 11,
              "type": "string",
              "value": "x",
            },
            Object {
              "argumentList": Object {
                "args": Array [],
                "closer": Object {
                  "end": 20,
                  "start": 19,
                  "type": "closeParenthesis",
                  "value": ")",
                },
                "end": 19,
                "members": Array [],
                "opener": Object {
                  "end": 19,
                  "start": 18,
                  "type": "openParenthesis",
                  "value": "(",
                },
                "start": 19,
                "type": "argumentList",
                "value": "",
              },
              "end": 19,
              "members": Array [
                Object {
                  "end": 18,
                  "start": 15,
                  "type": "functionReference",
                  "value": "bar",
                },
                Object {
                  "args": Array [],
                  "closer": Object {
                    "end": 20,
                    "start": 19,
                    "type": "closeParenthesis",
                    "value": ")",
                  },
                  "end": 19,
                  "members": Array [],
                  "opener": Object {
                    "end": 19,
                    "start": 18,
                    "type": "openParenthesis",
                    "value": "(",
                  },
                  "start": 19,
                  "type": "argumentList",
                  "value": "",
                },
              ],
              "reference": Object {
                "end": 18,
                "start": 15,
                "type": "functionReference",
                "value": "bar",
              },
              "start": 15,
              "type": "functionCall",
              "value": "bar()",
            },
          ],
          "closer": Object {
            "end": 21,
            "start": 20,
            "type": "closeParenthesis",
            "value": ")",
          },
          "end": 20,
          "members": Array [
            Object {
              "end": 19,
              "expressions": Array [
                Object {
                  "end": 5,
                  "start": 4,
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "end": 8,
                  "start": 7,
                  "type": "fieldReference",
                  "value": "a",
                },
                Object {
                  "closer": Object {
                    "end": 13,
                    "start": 12,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "end": 12,
                  "members": Array [],
                  "opener": Object {
                    "end": 11,
                    "start": 10,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "start": 11,
                  "type": "string",
                  "value": "x",
                },
                Object {
                  "argumentList": Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 20,
                      "start": 19,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 19,
                    "members": Array [],
                    "opener": Object {
                      "end": 19,
                      "start": 18,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 19,
                    "type": "argumentList",
                    "value": "",
                  },
                  "end": 19,
                  "members": Array [
                    Object {
                      "end": 18,
                      "start": 15,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 20,
                        "start": 19,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 19,
                      "members": Array [],
                      "opener": Object {
                        "end": 19,
                        "start": 18,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 19,
                      "type": "argumentList",
                      "value": "",
                    },
                  ],
                  "reference": Object {
                    "end": 18,
                    "start": 15,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  "start": 15,
                  "type": "functionCall",
                  "value": "bar()",
                },
              ],
              "members": Array [
                Object {
                  "end": 5,
                  "start": 4,
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "end": 6,
                  "start": 5,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 8,
                  "start": 7,
                  "type": "fieldReference",
                  "value": "a",
                },
                Object {
                  "end": 9,
                  "start": 8,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "closer": Object {
                    "end": 13,
                    "start": 12,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "end": 12,
                  "members": Array [],
                  "opener": Object {
                    "end": 11,
                    "start": 10,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "start": 11,
                  "type": "string",
                  "value": "x",
                },
                Object {
                  "end": 14,
                  "start": 13,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "argumentList": Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 20,
                      "start": 19,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 19,
                    "members": Array [],
                    "opener": Object {
                      "end": 19,
                      "start": 18,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 19,
                    "type": "argumentList",
                    "value": "",
                  },
                  "end": 19,
                  "members": Array [
                    Object {
                      "end": 18,
                      "start": 15,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 20,
                        "start": 19,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 19,
                      "members": Array [],
                      "opener": Object {
                        "end": 19,
                        "start": 18,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 19,
                      "type": "argumentList",
                      "value": "",
                    },
                  ],
                  "reference": Object {
                    "end": 18,
                    "start": 15,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  "start": 15,
                  "type": "functionCall",
                  "value": "bar()",
                },
              ],
              "separators": Array [
                Object {
                  "end": 6,
                  "start": 5,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 9,
                  "start": 8,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 14,
                  "start": 13,
                  "type": "argumentSeparator",
                  "value": ",",
                },
              ],
              "start": 4,
              "type": "delimitedExpressionList",
              "value": "1, a, 'x', bar()",
            },
          ],
          "opener": Object {
            "end": 4,
            "start": 3,
            "type": "openParenthesis",
            "value": "(",
          },
          "start": 4,
          "type": "argumentList",
          "value": "1, a, 'x', bar()",
        },
        "end": 20,
        "members": Array [
          Object {
            "end": 3,
            "start": 0,
            "type": "functionReference",
            "value": "foo",
          },
          Object {
            "args": Array [
              Object {
                "end": 5,
                "start": 4,
                "type": "number",
                "value": "1",
              },
              Object {
                "end": 8,
                "start": 7,
                "type": "fieldReference",
                "value": "a",
              },
              Object {
                "closer": Object {
                  "end": 13,
                  "start": 12,
                  "type": "quoteMark",
                  "value": "'",
                },
                "end": 12,
                "members": Array [],
                "opener": Object {
                  "end": 11,
                  "start": 10,
                  "type": "quoteMark",
                  "value": "'",
                },
                "start": 11,
                "type": "string",
                "value": "x",
              },
              Object {
                "argumentList": Object {
                  "args": Array [],
                  "closer": Object {
                    "end": 20,
                    "start": 19,
                    "type": "closeParenthesis",
                    "value": ")",
                  },
                  "end": 19,
                  "members": Array [],
                  "opener": Object {
                    "end": 19,
                    "start": 18,
                    "type": "openParenthesis",
                    "value": "(",
                  },
                  "start": 19,
                  "type": "argumentList",
                  "value": "",
                },
                "end": 19,
                "members": Array [
                  Object {
                    "end": 18,
                    "start": 15,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 20,
                      "start": 19,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 19,
                    "members": Array [],
                    "opener": Object {
                      "end": 19,
                      "start": 18,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 19,
                    "type": "argumentList",
                    "value": "",
                  },
                ],
                "reference": Object {
                  "end": 18,
                  "start": 15,
                  "type": "functionReference",
                  "value": "bar",
                },
                "start": 15,
                "type": "functionCall",
                "value": "bar()",
              },
            ],
            "closer": Object {
              "end": 21,
              "start": 20,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 20,
            "members": Array [
              Object {
                "end": 19,
                "expressions": Array [
                  Object {
                    "end": 5,
                    "start": 4,
                    "type": "number",
                    "value": "1",
                  },
                  Object {
                    "end": 8,
                    "start": 7,
                    "type": "fieldReference",
                    "value": "a",
                  },
                  Object {
                    "closer": Object {
                      "end": 13,
                      "start": 12,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "end": 12,
                    "members": Array [],
                    "opener": Object {
                      "end": 11,
                      "start": 10,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "start": 11,
                    "type": "string",
                    "value": "x",
                  },
                  Object {
                    "argumentList": Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 20,
                        "start": 19,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 19,
                      "members": Array [],
                      "opener": Object {
                        "end": 19,
                        "start": 18,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 19,
                      "type": "argumentList",
                      "value": "",
                    },
                    "end": 19,
                    "members": Array [
                      Object {
                        "end": 18,
                        "start": 15,
                        "type": "functionReference",
                        "value": "bar",
                      },
                      Object {
                        "args": Array [],
                        "closer": Object {
                          "end": 20,
                          "start": 19,
                          "type": "closeParenthesis",
                          "value": ")",
                        },
                        "end": 19,
                        "members": Array [],
                        "opener": Object {
                          "end": 19,
                          "start": 18,
                          "type": "openParenthesis",
                          "value": "(",
                        },
                        "start": 19,
                        "type": "argumentList",
                        "value": "",
                      },
                    ],
                    "reference": Object {
                      "end": 18,
                      "start": 15,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    "start": 15,
                    "type": "functionCall",
                    "value": "bar()",
                  },
                ],
                "members": Array [
                  Object {
                    "end": 5,
                    "start": 4,
                    "type": "number",
                    "value": "1",
                  },
                  Object {
                    "end": 6,
                    "start": 5,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 8,
                    "start": 7,
                    "type": "fieldReference",
                    "value": "a",
                  },
                  Object {
                    "end": 9,
                    "start": 8,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "closer": Object {
                      "end": 13,
                      "start": 12,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "end": 12,
                    "members": Array [],
                    "opener": Object {
                      "end": 11,
                      "start": 10,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "start": 11,
                    "type": "string",
                    "value": "x",
                  },
                  Object {
                    "end": 14,
                    "start": 13,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "argumentList": Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 20,
                        "start": 19,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 19,
                      "members": Array [],
                      "opener": Object {
                        "end": 19,
                        "start": 18,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 19,
                      "type": "argumentList",
                      "value": "",
                    },
                    "end": 19,
                    "members": Array [
                      Object {
                        "end": 18,
                        "start": 15,
                        "type": "functionReference",
                        "value": "bar",
                      },
                      Object {
                        "args": Array [],
                        "closer": Object {
                          "end": 20,
                          "start": 19,
                          "type": "closeParenthesis",
                          "value": ")",
                        },
                        "end": 19,
                        "members": Array [],
                        "opener": Object {
                          "end": 19,
                          "start": 18,
                          "type": "openParenthesis",
                          "value": "(",
                        },
                        "start": 19,
                        "type": "argumentList",
                        "value": "",
                      },
                    ],
                    "reference": Object {
                      "end": 18,
                      "start": 15,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    "start": 15,
                    "type": "functionCall",
                    "value": "bar()",
                  },
                ],
                "separators": Array [
                  Object {
                    "end": 6,
                    "start": 5,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 9,
                    "start": 8,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 14,
                    "start": 13,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                ],
                "start": 4,
                "type": "delimitedExpressionList",
                "value": "1, a, 'x', bar()",
              },
            ],
            "opener": Object {
              "end": 4,
              "start": 3,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 4,
            "type": "argumentList",
            "value": "1, a, 'x', bar()",
          },
        ],
        "reference": Object {
          "end": 3,
          "start": 0,
          "type": "functionReference",
          "value": "foo",
        },
        "start": 0,
        "type": "functionCall",
        "value": "foo(1, a, 'x', bar())",
      }
    `);
    expect(parse("foo(1, bar(), 2)")).toMatchInlineSnapshot(`
      Object {
        "argumentList": Object {
          "args": Array [
            Object {
              "end": 5,
              "start": 4,
              "type": "number",
              "value": "1",
            },
            Object {
              "argumentList": Object {
                "args": Array [],
                "closer": Object {
                  "end": 12,
                  "start": 11,
                  "type": "closeParenthesis",
                  "value": ")",
                },
                "end": 11,
                "members": Array [],
                "opener": Object {
                  "end": 11,
                  "start": 10,
                  "type": "openParenthesis",
                  "value": "(",
                },
                "start": 11,
                "type": "argumentList",
                "value": "",
              },
              "end": 11,
              "members": Array [
                Object {
                  "end": 10,
                  "start": 7,
                  "type": "functionReference",
                  "value": "bar",
                },
                Object {
                  "args": Array [],
                  "closer": Object {
                    "end": 12,
                    "start": 11,
                    "type": "closeParenthesis",
                    "value": ")",
                  },
                  "end": 11,
                  "members": Array [],
                  "opener": Object {
                    "end": 11,
                    "start": 10,
                    "type": "openParenthesis",
                    "value": "(",
                  },
                  "start": 11,
                  "type": "argumentList",
                  "value": "",
                },
              ],
              "reference": Object {
                "end": 10,
                "start": 7,
                "type": "functionReference",
                "value": "bar",
              },
              "start": 7,
              "type": "functionCall",
              "value": "bar()",
            },
            Object {
              "end": 15,
              "start": 14,
              "type": "number",
              "value": "2",
            },
          ],
          "closer": Object {
            "end": 16,
            "start": 15,
            "type": "closeParenthesis",
            "value": ")",
          },
          "end": 15,
          "members": Array [
            Object {
              "end": 15,
              "expressions": Array [
                Object {
                  "end": 5,
                  "start": 4,
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "argumentList": Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 12,
                      "start": 11,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 11,
                    "members": Array [],
                    "opener": Object {
                      "end": 11,
                      "start": 10,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 11,
                    "type": "argumentList",
                    "value": "",
                  },
                  "end": 11,
                  "members": Array [
                    Object {
                      "end": 10,
                      "start": 7,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 12,
                        "start": 11,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 11,
                      "members": Array [],
                      "opener": Object {
                        "end": 11,
                        "start": 10,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 11,
                      "type": "argumentList",
                      "value": "",
                    },
                  ],
                  "reference": Object {
                    "end": 10,
                    "start": 7,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  "start": 7,
                  "type": "functionCall",
                  "value": "bar()",
                },
                Object {
                  "end": 15,
                  "start": 14,
                  "type": "number",
                  "value": "2",
                },
              ],
              "members": Array [
                Object {
                  "end": 5,
                  "start": 4,
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "end": 6,
                  "start": 5,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "argumentList": Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 12,
                      "start": 11,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 11,
                    "members": Array [],
                    "opener": Object {
                      "end": 11,
                      "start": 10,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 11,
                    "type": "argumentList",
                    "value": "",
                  },
                  "end": 11,
                  "members": Array [
                    Object {
                      "end": 10,
                      "start": 7,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 12,
                        "start": 11,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 11,
                      "members": Array [],
                      "opener": Object {
                        "end": 11,
                        "start": 10,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 11,
                      "type": "argumentList",
                      "value": "",
                    },
                  ],
                  "reference": Object {
                    "end": 10,
                    "start": 7,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  "start": 7,
                  "type": "functionCall",
                  "value": "bar()",
                },
                Object {
                  "end": 13,
                  "start": 12,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 15,
                  "start": 14,
                  "type": "number",
                  "value": "2",
                },
              ],
              "separators": Array [
                Object {
                  "end": 6,
                  "start": 5,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 13,
                  "start": 12,
                  "type": "argumentSeparator",
                  "value": ",",
                },
              ],
              "start": 4,
              "type": "delimitedExpressionList",
              "value": "1, bar() , 2",
            },
          ],
          "opener": Object {
            "end": 4,
            "start": 3,
            "type": "openParenthesis",
            "value": "(",
          },
          "start": 4,
          "type": "argumentList",
          "value": "1, bar() , 2",
        },
        "end": 15,
        "members": Array [
          Object {
            "end": 3,
            "start": 0,
            "type": "functionReference",
            "value": "foo",
          },
          Object {
            "args": Array [
              Object {
                "end": 5,
                "start": 4,
                "type": "number",
                "value": "1",
              },
              Object {
                "argumentList": Object {
                  "args": Array [],
                  "closer": Object {
                    "end": 12,
                    "start": 11,
                    "type": "closeParenthesis",
                    "value": ")",
                  },
                  "end": 11,
                  "members": Array [],
                  "opener": Object {
                    "end": 11,
                    "start": 10,
                    "type": "openParenthesis",
                    "value": "(",
                  },
                  "start": 11,
                  "type": "argumentList",
                  "value": "",
                },
                "end": 11,
                "members": Array [
                  Object {
                    "end": 10,
                    "start": 7,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 12,
                      "start": 11,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 11,
                    "members": Array [],
                    "opener": Object {
                      "end": 11,
                      "start": 10,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 11,
                    "type": "argumentList",
                    "value": "",
                  },
                ],
                "reference": Object {
                  "end": 10,
                  "start": 7,
                  "type": "functionReference",
                  "value": "bar",
                },
                "start": 7,
                "type": "functionCall",
                "value": "bar()",
              },
              Object {
                "end": 15,
                "start": 14,
                "type": "number",
                "value": "2",
              },
            ],
            "closer": Object {
              "end": 16,
              "start": 15,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 15,
            "members": Array [
              Object {
                "end": 15,
                "expressions": Array [
                  Object {
                    "end": 5,
                    "start": 4,
                    "type": "number",
                    "value": "1",
                  },
                  Object {
                    "argumentList": Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 12,
                        "start": 11,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 11,
                      "members": Array [],
                      "opener": Object {
                        "end": 11,
                        "start": 10,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 11,
                      "type": "argumentList",
                      "value": "",
                    },
                    "end": 11,
                    "members": Array [
                      Object {
                        "end": 10,
                        "start": 7,
                        "type": "functionReference",
                        "value": "bar",
                      },
                      Object {
                        "args": Array [],
                        "closer": Object {
                          "end": 12,
                          "start": 11,
                          "type": "closeParenthesis",
                          "value": ")",
                        },
                        "end": 11,
                        "members": Array [],
                        "opener": Object {
                          "end": 11,
                          "start": 10,
                          "type": "openParenthesis",
                          "value": "(",
                        },
                        "start": 11,
                        "type": "argumentList",
                        "value": "",
                      },
                    ],
                    "reference": Object {
                      "end": 10,
                      "start": 7,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    "start": 7,
                    "type": "functionCall",
                    "value": "bar()",
                  },
                  Object {
                    "end": 15,
                    "start": 14,
                    "type": "number",
                    "value": "2",
                  },
                ],
                "members": Array [
                  Object {
                    "end": 5,
                    "start": 4,
                    "type": "number",
                    "value": "1",
                  },
                  Object {
                    "end": 6,
                    "start": 5,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "argumentList": Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 12,
                        "start": 11,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 11,
                      "members": Array [],
                      "opener": Object {
                        "end": 11,
                        "start": 10,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 11,
                      "type": "argumentList",
                      "value": "",
                    },
                    "end": 11,
                    "members": Array [
                      Object {
                        "end": 10,
                        "start": 7,
                        "type": "functionReference",
                        "value": "bar",
                      },
                      Object {
                        "args": Array [],
                        "closer": Object {
                          "end": 12,
                          "start": 11,
                          "type": "closeParenthesis",
                          "value": ")",
                        },
                        "end": 11,
                        "members": Array [],
                        "opener": Object {
                          "end": 11,
                          "start": 10,
                          "type": "openParenthesis",
                          "value": "(",
                        },
                        "start": 11,
                        "type": "argumentList",
                        "value": "",
                      },
                    ],
                    "reference": Object {
                      "end": 10,
                      "start": 7,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    "start": 7,
                    "type": "functionCall",
                    "value": "bar()",
                  },
                  Object {
                    "end": 13,
                    "start": 12,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 15,
                    "start": 14,
                    "type": "number",
                    "value": "2",
                  },
                ],
                "separators": Array [
                  Object {
                    "end": 6,
                    "start": 5,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 13,
                    "start": 12,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                ],
                "start": 4,
                "type": "delimitedExpressionList",
                "value": "1, bar() , 2",
              },
            ],
            "opener": Object {
              "end": 4,
              "start": 3,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 4,
            "type": "argumentList",
            "value": "1, bar() , 2",
          },
        ],
        "reference": Object {
          "end": 3,
          "start": 0,
          "type": "functionReference",
          "value": "foo",
        },
        "start": 0,
        "type": "functionCall",
        "value": "foo(1, bar() , 2)",
      }
    `);
    expect(parse("foo(bar(), 'x', 3)")).toMatchInlineSnapshot(`
      Object {
        "argumentList": Object {
          "args": Array [
            Object {
              "argumentList": Object {
                "args": Array [],
                "closer": Object {
                  "end": 9,
                  "start": 8,
                  "type": "closeParenthesis",
                  "value": ")",
                },
                "end": 8,
                "members": Array [],
                "opener": Object {
                  "end": 8,
                  "start": 7,
                  "type": "openParenthesis",
                  "value": "(",
                },
                "start": 8,
                "type": "argumentList",
                "value": "",
              },
              "end": 8,
              "members": Array [
                Object {
                  "end": 7,
                  "start": 4,
                  "type": "functionReference",
                  "value": "bar",
                },
                Object {
                  "args": Array [],
                  "closer": Object {
                    "end": 9,
                    "start": 8,
                    "type": "closeParenthesis",
                    "value": ")",
                  },
                  "end": 8,
                  "members": Array [],
                  "opener": Object {
                    "end": 8,
                    "start": 7,
                    "type": "openParenthesis",
                    "value": "(",
                  },
                  "start": 8,
                  "type": "argumentList",
                  "value": "",
                },
              ],
              "reference": Object {
                "end": 7,
                "start": 4,
                "type": "functionReference",
                "value": "bar",
              },
              "start": 4,
              "type": "functionCall",
              "value": "bar()",
            },
            Object {
              "closer": Object {
                "end": 14,
                "start": 13,
                "type": "quoteMark",
                "value": "'",
              },
              "end": 13,
              "members": Array [],
              "opener": Object {
                "end": 12,
                "start": 11,
                "type": "quoteMark",
                "value": "'",
              },
              "start": 12,
              "type": "string",
              "value": "x",
            },
            Object {
              "end": 17,
              "start": 16,
              "type": "number",
              "value": "3",
            },
          ],
          "closer": Object {
            "end": 18,
            "start": 17,
            "type": "closeParenthesis",
            "value": ")",
          },
          "end": 17,
          "members": Array [
            Object {
              "end": 17,
              "expressions": Array [
                Object {
                  "argumentList": Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 9,
                      "start": 8,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 8,
                    "members": Array [],
                    "opener": Object {
                      "end": 8,
                      "start": 7,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 8,
                    "type": "argumentList",
                    "value": "",
                  },
                  "end": 8,
                  "members": Array [
                    Object {
                      "end": 7,
                      "start": 4,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 9,
                        "start": 8,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 8,
                      "members": Array [],
                      "opener": Object {
                        "end": 8,
                        "start": 7,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 8,
                      "type": "argumentList",
                      "value": "",
                    },
                  ],
                  "reference": Object {
                    "end": 7,
                    "start": 4,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  "start": 4,
                  "type": "functionCall",
                  "value": "bar()",
                },
                Object {
                  "closer": Object {
                    "end": 14,
                    "start": 13,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "end": 13,
                  "members": Array [],
                  "opener": Object {
                    "end": 12,
                    "start": 11,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "start": 12,
                  "type": "string",
                  "value": "x",
                },
                Object {
                  "end": 17,
                  "start": 16,
                  "type": "number",
                  "value": "3",
                },
              ],
              "members": Array [
                Object {
                  "argumentList": Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 9,
                      "start": 8,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 8,
                    "members": Array [],
                    "opener": Object {
                      "end": 8,
                      "start": 7,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 8,
                    "type": "argumentList",
                    "value": "",
                  },
                  "end": 8,
                  "members": Array [
                    Object {
                      "end": 7,
                      "start": 4,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 9,
                        "start": 8,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 8,
                      "members": Array [],
                      "opener": Object {
                        "end": 8,
                        "start": 7,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 8,
                      "type": "argumentList",
                      "value": "",
                    },
                  ],
                  "reference": Object {
                    "end": 7,
                    "start": 4,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  "start": 4,
                  "type": "functionCall",
                  "value": "bar()",
                },
                Object {
                  "end": 10,
                  "start": 9,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "closer": Object {
                    "end": 14,
                    "start": 13,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "end": 13,
                  "members": Array [],
                  "opener": Object {
                    "end": 12,
                    "start": 11,
                    "type": "quoteMark",
                    "value": "'",
                  },
                  "start": 12,
                  "type": "string",
                  "value": "x",
                },
                Object {
                  "end": 15,
                  "start": 14,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 17,
                  "start": 16,
                  "type": "number",
                  "value": "3",
                },
              ],
              "separators": Array [
                Object {
                  "end": 10,
                  "start": 9,
                  "type": "argumentSeparator",
                  "value": ",",
                },
                Object {
                  "end": 15,
                  "start": 14,
                  "type": "argumentSeparator",
                  "value": ",",
                },
              ],
              "start": 4,
              "type": "delimitedExpressionList",
              "value": "bar() , 'x', 3",
            },
          ],
          "opener": Object {
            "end": 4,
            "start": 3,
            "type": "openParenthesis",
            "value": "(",
          },
          "start": 4,
          "type": "argumentList",
          "value": "bar() , 'x', 3",
        },
        "end": 17,
        "members": Array [
          Object {
            "end": 3,
            "start": 0,
            "type": "functionReference",
            "value": "foo",
          },
          Object {
            "args": Array [
              Object {
                "argumentList": Object {
                  "args": Array [],
                  "closer": Object {
                    "end": 9,
                    "start": 8,
                    "type": "closeParenthesis",
                    "value": ")",
                  },
                  "end": 8,
                  "members": Array [],
                  "opener": Object {
                    "end": 8,
                    "start": 7,
                    "type": "openParenthesis",
                    "value": "(",
                  },
                  "start": 8,
                  "type": "argumentList",
                  "value": "",
                },
                "end": 8,
                "members": Array [
                  Object {
                    "end": 7,
                    "start": 4,
                    "type": "functionReference",
                    "value": "bar",
                  },
                  Object {
                    "args": Array [],
                    "closer": Object {
                      "end": 9,
                      "start": 8,
                      "type": "closeParenthesis",
                      "value": ")",
                    },
                    "end": 8,
                    "members": Array [],
                    "opener": Object {
                      "end": 8,
                      "start": 7,
                      "type": "openParenthesis",
                      "value": "(",
                    },
                    "start": 8,
                    "type": "argumentList",
                    "value": "",
                  },
                ],
                "reference": Object {
                  "end": 7,
                  "start": 4,
                  "type": "functionReference",
                  "value": "bar",
                },
                "start": 4,
                "type": "functionCall",
                "value": "bar()",
              },
              Object {
                "closer": Object {
                  "end": 14,
                  "start": 13,
                  "type": "quoteMark",
                  "value": "'",
                },
                "end": 13,
                "members": Array [],
                "opener": Object {
                  "end": 12,
                  "start": 11,
                  "type": "quoteMark",
                  "value": "'",
                },
                "start": 12,
                "type": "string",
                "value": "x",
              },
              Object {
                "end": 17,
                "start": 16,
                "type": "number",
                "value": "3",
              },
            ],
            "closer": Object {
              "end": 18,
              "start": 17,
              "type": "closeParenthesis",
              "value": ")",
            },
            "end": 17,
            "members": Array [
              Object {
                "end": 17,
                "expressions": Array [
                  Object {
                    "argumentList": Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 9,
                        "start": 8,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 8,
                      "members": Array [],
                      "opener": Object {
                        "end": 8,
                        "start": 7,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 8,
                      "type": "argumentList",
                      "value": "",
                    },
                    "end": 8,
                    "members": Array [
                      Object {
                        "end": 7,
                        "start": 4,
                        "type": "functionReference",
                        "value": "bar",
                      },
                      Object {
                        "args": Array [],
                        "closer": Object {
                          "end": 9,
                          "start": 8,
                          "type": "closeParenthesis",
                          "value": ")",
                        },
                        "end": 8,
                        "members": Array [],
                        "opener": Object {
                          "end": 8,
                          "start": 7,
                          "type": "openParenthesis",
                          "value": "(",
                        },
                        "start": 8,
                        "type": "argumentList",
                        "value": "",
                      },
                    ],
                    "reference": Object {
                      "end": 7,
                      "start": 4,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    "start": 4,
                    "type": "functionCall",
                    "value": "bar()",
                  },
                  Object {
                    "closer": Object {
                      "end": 14,
                      "start": 13,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "end": 13,
                    "members": Array [],
                    "opener": Object {
                      "end": 12,
                      "start": 11,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "start": 12,
                    "type": "string",
                    "value": "x",
                  },
                  Object {
                    "end": 17,
                    "start": 16,
                    "type": "number",
                    "value": "3",
                  },
                ],
                "members": Array [
                  Object {
                    "argumentList": Object {
                      "args": Array [],
                      "closer": Object {
                        "end": 9,
                        "start": 8,
                        "type": "closeParenthesis",
                        "value": ")",
                      },
                      "end": 8,
                      "members": Array [],
                      "opener": Object {
                        "end": 8,
                        "start": 7,
                        "type": "openParenthesis",
                        "value": "(",
                      },
                      "start": 8,
                      "type": "argumentList",
                      "value": "",
                    },
                    "end": 8,
                    "members": Array [
                      Object {
                        "end": 7,
                        "start": 4,
                        "type": "functionReference",
                        "value": "bar",
                      },
                      Object {
                        "args": Array [],
                        "closer": Object {
                          "end": 9,
                          "start": 8,
                          "type": "closeParenthesis",
                          "value": ")",
                        },
                        "end": 8,
                        "members": Array [],
                        "opener": Object {
                          "end": 8,
                          "start": 7,
                          "type": "openParenthesis",
                          "value": "(",
                        },
                        "start": 8,
                        "type": "argumentList",
                        "value": "",
                      },
                    ],
                    "reference": Object {
                      "end": 7,
                      "start": 4,
                      "type": "functionReference",
                      "value": "bar",
                    },
                    "start": 4,
                    "type": "functionCall",
                    "value": "bar()",
                  },
                  Object {
                    "end": 10,
                    "start": 9,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "closer": Object {
                      "end": 14,
                      "start": 13,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "end": 13,
                    "members": Array [],
                    "opener": Object {
                      "end": 12,
                      "start": 11,
                      "type": "quoteMark",
                      "value": "'",
                    },
                    "start": 12,
                    "type": "string",
                    "value": "x",
                  },
                  Object {
                    "end": 15,
                    "start": 14,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 17,
                    "start": 16,
                    "type": "number",
                    "value": "3",
                  },
                ],
                "separators": Array [
                  Object {
                    "end": 10,
                    "start": 9,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                  Object {
                    "end": 15,
                    "start": 14,
                    "type": "argumentSeparator",
                    "value": ",",
                  },
                ],
                "start": 4,
                "type": "delimitedExpressionList",
                "value": "bar() , 'x', 3",
              },
            ],
            "opener": Object {
              "end": 4,
              "start": 3,
              "type": "openParenthesis",
              "value": "(",
            },
            "start": 4,
            "type": "argumentList",
            "value": "bar() , 'x', 3",
          },
        ],
        "reference": Object {
          "end": 3,
          "start": 0,
          "type": "functionReference",
          "value": "foo",
        },
        "start": 0,
        "type": "functionCall",
        "value": "foo(bar() , 'x', 3)",
      }
    `);
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
  });

  it("should throw on invalid function call syntax", () => {
    expect(() => parse("foo(,)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 4: expected an expression to the left and right of separator to exist"`
    );
    expect(() => parse("foo(,3)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 4: expected an expression to the left and right of separator to exist"`
    );
    expect(() => parse("foo(1,,3)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 5: expected an expression to the right of separator, but got argumentSeparator"`
    );
    expect(() => parse("foo(2,)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing argumentSeparator node at position 5: expected an expression to the left and right of separator to exist"`
    );
    expect(() => parse("(1,2)")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing group node at position 1: Expected an argument list to be preceded by a reference, but got undefined instead"`
    );
    expect(() => parse("foo(1,2)s")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing reference node at position 8: Unexpected node reference"`
    );
    expect(() => parse("1,2")).toThrowErrorMatchingInlineSnapshot(
      `"Syntax Error while parsing delimitedExpressionList node at position 0: Expected to find an expression, got delimitedExpressionList instead"`
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

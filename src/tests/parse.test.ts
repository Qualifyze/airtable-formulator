import { expect, describe, it } from "@jest/globals";

import { parse } from "../parse";

describe("parse", () => {
  it("Should parse an empty string", () => {
    expect(parse("")).toBeNull();
  });

  it("Should parse a string literal", () => {
    expect(parse("'Hello world'", { validate: true })).toBe("Hello world");
  });

  it("Should parse a number literal", () => {
    expect(parse("5", { validate: true })).toBe(5);
  });

  it("Should parse a boolean", () => {
    expect(parse("TRUE()", { validate: true })).toBe(true);
    expect(parse("FALSE()", { validate: true })).toBe(false);
  });

  it("Should parse a field reference", () => {
    expect(parse("myField", { validate: true })).toEqual({
      field: "myField",
    });
    expect(parse("{my field}", { validate: true })).toEqual({
      field: "my field",
    });
  });

  it("Should parse a function call", () => {
    expect(parse("NOT(TRUE())", { validate: true })).toEqual(["NOT", true]);
  });

  it("should parse a modifier", () => {
    expect(parse("-1", { validate: true })).toEqual(-1);
  });

  it("Should parse an operation", () => {
    expect(parse("1 + 2", { validate: true })).toEqual(["+", 1, 2]);
    expect(parse("-1 + 2", { validate: true })).toEqual(["+", -1, 2]);
    expect(parse("1+-2", { validate: true })).toEqual(["+", 1, -2]);
    expect(parse("1!=-2", { validate: true })).toEqual(["!=", 1, -2]);
    expect(parse("1+2+3", { validate: true })).toEqual(["+", 1, 2, 3]);
    expect(parse("1+2*3", { validate: true })).toEqual(["+", 1, ["*", 2, 3]]);
    expect(parse("1*2+3", { validate: true })).toEqual(["+", ["*", 1, 2], 3]);
  });

  it("Should parse brackets", () => {
    expect(parse("(1+2)", { validate: true })).toEqual(["+", 1, 2]);
    expect(parse("((1+2))", { validate: true })).toEqual(["+", 1, 2]);
    expect(parse("1*(2+3)", { validate: true })).toEqual(["*", 1, ["+", 2, 3]]);
  });

  it("Should parse compositions", () => {
    expect(parse("NOT(1+2)", { validate: true })).toEqual(["NOT", ["+", 1, 2]]);
    expect(parse("1+NOT(2)", { validate: true })).toEqual(["+", 1, ["NOT", 2]]);
    expect(parse("NOT(1+2)+3", { validate: true })).toEqual([
      "+",
      ["NOT", ["+", 1, 2]],
      3,
    ]);
    expect(parse("1+NOT(2)+3", { validate: true })).toEqual([
      "+",
      1,
      ["NOT", 2],
      3,
    ]);
    expect(parse("1+NOT(2+3)", { validate: true })).toEqual([
      "+",
      1,
      ["NOT", ["+", 2, 3]],
    ]);
    expect(parse("1+NOT(2+3)+4", { validate: true })).toEqual([
      "+",
      1,
      ["NOT", ["+", 2, 3]],
      4,
    ]);
    expect(
      parse(
        "IF(AND(name='Robert',age >= {minimum age} + 10), TRUE(), 'not robert or underage')",
        { validate: true }
      )
    ).toEqual([
      "IF",
      [
        "AND",
        ["=", { field: "name" }, "Robert"],
        [">=", { field: "age" }, ["+", { field: "minimum age" }, 10]],
      ],
      true,
      "not robert or underage",
    ]);
  });
});

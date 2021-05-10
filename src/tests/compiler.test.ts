import { describe, expect, it } from "@jest/globals";
import { compile } from "../compiler";
import { Formula } from "../schema";

describe(`${compile.name}()`, () => {
  it("should format multiple operators correctly", () => {
    const formula: Formula = [
      "AND",
      ["=", { field: "bah" }, ["*", 5, 3]],
      ["<", ["NOW"], { field: "date" }],
    ];

    expect(compile(formula)).toMatchInlineSnapshot(
      `"AND({bah}=(5*3),NOW()<{date})"`
    );
  });

  it("should throw an error if you try to pass a { within the field name", () => {
    expect(() =>
      compile({ field: "{date" })
    ).toThrowErrorMatchingInlineSnapshot(`"Invalid field name: '{date'"`);
  });

  it("it should safely escape delimiting characters", () => {
    expect(compile("{hello}")).toMatchInlineSnapshot(`"\\"{hello}\\""`);
    expect(compile('{hello"}')).toMatchInlineSnapshot(`"\\"{hello\\\\\\"}\\""`);
  });

  it("should throw errors on an invalid formula", () => {
    expect(() => compile(["Santa"] as unknown as Formula)).toThrowError(
      "must be equal to one of the allowed values"
    );
    expect(() => compile((() => ({})) as unknown as Formula)).toThrowError(
      "Error in validating formula notation"
    );
  });
});

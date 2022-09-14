import { describe, it, expect } from "@jest/globals";

import { computeGroupValue, createGroup } from "../group";

describe("GroupNode", () => {
  describe("computeGroupValue()", () => {
    it("should should compute value of empty array", () => {
      expect(computeGroupValue([])).toBe("");
    });

    it("should concatenate node values", () => {
      expect(
        computeGroupValue([
          { type: "number", value: "1", start: 0, end: 1 },
          { type: "number", value: "2", start: 1, end: 2 },
        ])
      ).toBe("12");
    });

    it("should fill gaps with whitespace", () => {
      expect(
        computeGroupValue([
          { type: "number", value: "1", start: 0, end: 1 },
          { type: "number", value: "2", start: 3, end: 4 },
        ])
      ).toBe("1  2");
    });

    it("should include braces", () => {
      expect(
        computeGroupValue([
          {
            type: "number",
            value: "1",
            start: 1,
            end: 2,
            opener: { type: "openBrace", value: "{", start: 0, end: 1 },
            closer: { type: "closeBrace", value: "}", start: 2, end: 3 },
          },
          { type: "number", value: "2", start: 1, end: 2 },
        ])
      ).toBe("{1}2");
      expect(
        computeGroupValue([
          {
            type: "number",
            value: "1",
            start: 1,
            end: 2,
          },
          {
            type: "number",
            value: "2",
            start: 1,
            end: 2,
            opener: { type: "openBrace", value: "{", start: 0, end: 1 },
            closer: { type: "closeBrace", value: "}", start: 2, end: 3 },
          },
        ])
      ).toBe("1{2}");

      expect(
        computeGroupValue([
          {
            type: "number",
            value: "1",
            start: 1,
            end: 2,
          },
          {
            type: "number",
            value: "2",
            start: 5,
            end: 6,
            opener: { type: "openBrace", value: "{", start: 3, end: 4 },
            closer: { type: "closeBrace", value: "}", start: 6, end: 7 },
          },
        ])
      ).toBe("1 {2}");
    });
  });

  describe("createGroup()", () => {
    it("should be able to create empty groups", () => {
      expect(createGroup("group", [])).toMatchObject({
        type: "group",
        members: [],
        value: "",
        start: 0,
        end: 0,
      });
    });

    it("should create a group node from a list of nodes", () => {
      const nodes = [
        { type: "number", value: "1", start: 20, end: 21 },
        { type: "operator", value: "+", start: 21, end: 22 },
        { type: "number", value: "23", start: 22, end: 24 },
      ] as const;

      expect(createGroup("group", nodes)).toMatchObject({
        type: "group",
        members: nodes,
        value: "1+23",
        start: 20,
        end: 24,
      });
    });
  });
});

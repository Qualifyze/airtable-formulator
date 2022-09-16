import { expect, describe, it } from "@jest/globals";
import {
  ArgumentListGroup,
  ArgumentListNode,
  isArgumentListGroup,
  isArgumentListNode,
} from "../argument-list";

describe("ArgumentList", () => {
  describe("isArgumentListGroup()", () => {
    it("should return true for an empty group with a type of argumentList", () => {
      const node: ArgumentListGroup<"argumentList"> = {
        type: "argumentList",
        members: [],
        opener: { type: "openParenthesis", value: "(", start: 0, end: 1 },
        closer: { type: "closeParenthesis", value: ")", start: 1, end: 2 },
        start: 1,
        end: 2,
        value: "()",
      };
      expect(isArgumentListGroup(node, "argumentList")).toBe(true);
    });
  });

  describe("isArgumentListNode()", () => {
    it("should return true for an empty argument list node", () => {
      const argumentList: ArgumentListNode = {
        type: "argumentList",
        members: [],
        args: [],
        opener: {
          type: "openParenthesis",
          value: "(",
          start: 0,
          end: 1,
        },
        closer: {
          type: "closeParenthesis",
          value: ")",
          start: 1,
          end: 2,
        },
        start: 1,
        end: 2,
        value: "()",
      };

      expect(isArgumentListNode(argumentList)).toBe(true);
    });
  });
});

import { describe, it, expect } from "@jest/globals";
import {
  EnclosedGroupNode,
  isEnclosedGroupNode,
  isEnclosedWithParenthesis,
} from "../enclosed-group";

describe("EnclosedGroup", () => {
  describe("isEnclosedGroupNode()", () => {
    it("should return true for an empty group", () => {
      const group: EnclosedGroupNode<"group"> = {
        type: "group",
        members: [],
        opener: { type: "openParenthesis", value: "(", start: 0, end: 1 },
        closer: { type: "closeParenthesis", value: ")", start: 1, end: 2 },
        start: 1,
        end: 2,
        value: "()",
      };
      expect(isEnclosedGroupNode(group)).toBe(true);
    });
  });

  describe("isEnclosedWithParenthesis()", () => {
    it("should return true for an empty group", () => {
      const group: EnclosedGroupNode<"group"> = {
        type: "group",
        members: [],
        opener: { type: "openParenthesis", value: "(", start: 0, end: 1 },
        closer: { type: "closeParenthesis", value: ")", start: 1, end: 2 },
        start: 1,
        end: 2,
        value: "()",
      };
      expect(isEnclosedWithParenthesis(group)).toBe(true);
    });
  });
});

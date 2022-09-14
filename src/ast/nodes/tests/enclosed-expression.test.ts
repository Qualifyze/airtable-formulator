import { describe, it, expect } from "@jest/globals";
import {
  EnclosedExpressionNode,
  isEnclosedExpressionNode,
  reduceEnclosedExpressions,
} from "../enclosed-expression";

describe("EnclosedExpression", () => {
  describe("isEnclosedExpressionNode()", () => {
    it("should return true for a valid EnclosedExpressionNode", () => {
      const node: EnclosedExpressionNode = {
        type: "enclosedExpression",
        value: "(1)",
        start: 1,
        end: 2,
        members: [
          {
            type: "number",
            value: "1",
            start: 1,
            end: 2,
          },
        ],
        opener: {
          type: "openParenthesis",
          value: "(",
          start: 0,
          end: 1,
        },
        closer: {
          type: "closeParenthesis",
          value: ")",
          start: 2,
          end: 3,
        },
        expression: {
          type: "number",
          value: "1",
          start: 1,
          end: 2,
        },
      };
      expect(isEnclosedExpressionNode(node)).toBe(true);
    });
  });

  describe("replaceEnclosedExpressions()", () => {
    it("should replace enclosed expression groups with enclosedExpression nodes", () => {
      const nodes = [
        {
          type: "group",
          opener: {
            type: "openParenthesis",
            start: 1,
            end: 2,
            value: "(",
          },
          closer: {
            type: "closeParenthesis",
            start: 3,
            end: 4,
            value: ")",
          },
          value: "0",
          start: 2,
          end: 3,
          members: [
            {
              type: "number",
              start: 2,
              end: 3,
              value: "0",
            },
          ],
        },
        {
          type: "operator",
          start: 5,
          end: 6,
          value: "*",
        },
        {
          type: "group",
          opener: {
            type: "openParenthesis",
            start: 7,
            end: 8,
            value: "(",
          },
          closer: {
            type: "closeParenthesis",
            start: 9,
            end: 10,
            value: ")",
          },
          value: "0",
          start: 8,
          end: 9,
          members: [
            {
              type: "number",
              start: 8,
              end: 9,
              value: "0",
            },
          ],
        },
      ] as const;

      expect(reduceEnclosedExpressions(nodes)).toMatchObject([
        {
          type: "enclosedExpression",
        },
        {
          type: "operator",
        },
        {
          type: "enclosedExpression",
        },
      ]);
    });
  });
});

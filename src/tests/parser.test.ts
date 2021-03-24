import _ from "../index";
import { Literal } from "../formula";

describe("unit | parser", () => {
  it("should reverse the formula string into an object", () => {
    const formula = _.AND(
      _.op("=", _.field("bah"), new Literal(5)),
      _.op("<", _.NOW(), _.field("date"))
    );

    const parsed = _.parse(formula.toString());
    expect(parsed.toString()).toEqual("AND({bah}=5,NOW()<{date})");
  });
});

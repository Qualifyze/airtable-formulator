// import { describe, it, expect } from "jest";
import _ from "../index";
import { Literal } from "../formula";

describe("unit | airtable formulator", () => {
  it("should format multiple operators correctly", () => {
    // TODO implicitly allow literals
    const formula = _.AND(
      _.op("=", _.field("bah"), new Literal(5)),
      _.op("<", _.NOW(), _.field("date"))
    ).toString();

    expect(formula).toEqual("AND({bah}=5,NOW()<{date})");
  });

  it("should throw an error if you try to pass a { within the field name", () => {
    expect(() => {
      const formula = _.AND(_.op("<", _.NOW(), _.field("{date")));
      formula.toString();
    }).toThrowError("Invalid field name: '{date'");
  });

  it("it should safely escape delimiting characters", () => {
    expect(new Literal("{hello}").toString()).toEqual('"{hello}"');
    expect(new Literal('{hello"}').toString()).toEqual('"{hello\\"}"');
  });
});

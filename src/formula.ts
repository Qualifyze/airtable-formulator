export abstract class Formula {
  abstract render(): string;

  toString(): string {
    return this.render();
  }
}

export abstract class Computation extends Formula {
  protected args: Formula[] = [];

  addArgument(...arg: Formula[]): this {
    this.args.push(...arg);
    return this;
  }
}

export class FunctionReference extends Computation {
  public readonly name: string;

  constructor(functionName: string) {
    super();
    this.name = functionName;
  }

  render() {
    return `${this.name}(${this.args.join(",")})`;
  }
}

export class Operator extends Computation {
  public readonly symbol: string;

  constructor(operatorSymbol: string) {
    super();
    this.symbol = operatorSymbol;
  }

  render(): string {
    return this.args.join(this.symbol);
  }
}

export class FieldReference extends Formula {
  public readonly name: string;

  constructor(fieldName: string) {
    super();

    // XXX Airtable API does not support curly braces in fieldnames, even though fieldname can contain curly braces
    if (fieldName.includes("{") || fieldName.includes("}")) {
      throw new Error(`Invalid field name: '${fieldName}'`);
    }

    this.name = fieldName;
  }

  render(): string {
    return `{${this.name.replace(/[{}]/, (brace) => `\\${brace}`)}}`;
  }
}

export class Literal<T extends string | number> extends Formula {
  public readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  render(): string {
    return JSON.stringify(this.value);
  }
}

import { operators } from "../airtable-formula-reference.json";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// convert operators to a regexp matcher
export const operatorMatcher = new RegExp(
  Object.keys(operators)
    .map((op) => escapeRegExp(op))
    .join("|")
);

const workingTokens = [
  "escapedSingleQuote",
  "escapedDoubleQuote",
  "escapedBackslash",
  "openSingleQuote",
  "closeSingleQuote",
  "openDoubleQuote",
  "closeDoubleQuote",
  "singleQuotedString",
  "doubleQuotedString",
  "bracedReference",
] as const;

const tokenNames = [
  "space",
  "number",
  "string",
  "quoteMark",
  "operator",
  "openParenthesis",
  "closeParenthesis",
  "openBrace",
  "closeBrace",
  "reference",
  "argumentSeparator",
  "group",
] as const;

export type TokenTypeName = typeof tokenNames[number];

type WorkingTokenTypeName = TokenTypeName | typeof workingTokens[number];

function isWorkingTokenTypeName(type: string): type is WorkingTokenTypeName {
  return [...tokenNames, ...workingTokens].includes(
    type as WorkingTokenTypeName
  );
}

export function isTokenName(token: string): token is TokenTypeName {
  return tokenNames.includes(token as TokenTypeName);
}

type TokenType = (
  | { type: WorkingTokenTypeName; finalType: TokenTypeName }
  | { type: TokenTypeName; finalType?: TokenTypeName }
) & {
  on: RegExp;
  onlyIn?: WorkingTokenTypeName;
};

type OpeningTokenType = TokenType & {
  opens: WorkingTokenTypeName;
  closes?: never;
  memberOf?: never;
};

type ClosingTokenType = TokenType & {
  opens?: never;
  closes: WorkingTokenTypeName;
  memberOf?: never;
};

type MemberTokenType = TokenType & {
  opens?: never;
  closes?: never;
  memberOf: WorkingTokenTypeName;
  flatten?: boolean;
};

type EnclosedToken = TokenType & {
  opens?: never;
  closes?: never;
  memberOf?: never;
  flatten?: never;
};

function isOpening(token: TokenType): token is OpeningTokenType {
  const { opens, closes, memberOf } = token as unknown as Record<
    string,
    unknown
  >;
  return (
    typeof opens === "string" &&
    isWorkingTokenTypeName(opens) &&
    !closes &&
    !memberOf
  );
}

function isClosing(token: TokenType): token is ClosingTokenType {
  const { opens, closes, memberOf } = token as unknown as Record<
    string,
    unknown
  >;
  return (
    typeof closes === "string" &&
    isWorkingTokenTypeName(closes) &&
    !opens &&
    !memberOf
  );
}

function isMember(token: TokenType): token is MemberTokenType {
  const { opens, closes, memberOf } = token as unknown as Record<
    string,
    unknown
  >;
  return (
    typeof memberOf === "string" &&
    isWorkingTokenTypeName(memberOf) &&
    !opens &&
    !closes
  );
}

function isEnclosed(token: TokenType): token is EnclosedToken {
  const { opens, closes, memberOf } = token as unknown as Record<
    string,
    unknown
  >;
  return typeof !memberOf && !opens && !closes;
}

const openingTokens: readonly OpeningTokenType[] = [
  {
    type: "openDoubleQuote",
    finalType: "quoteMark",
    on: /"/,
    opens: "doubleQuotedString",
    onlyIn: "group",
  },
  {
    type: "openSingleQuote",
    finalType: "quoteMark",
    on: /'/,
    opens: "singleQuotedString",
    onlyIn: "group",
  },
  {
    type: "openParenthesis",
    on: /\(/,
    opens: "group",
    onlyIn: "group",
  },
  {
    type: "openBrace",
    on: /\{/,
    opens: "bracedReference",
    onlyIn: "group",
  },
] as const;

const closingTokens: readonly ClosingTokenType[] = [
  {
    type: "closeDoubleQuote",
    finalType: "quoteMark",
    on: /"/,
    closes: "doubleQuotedString",
  },
  {
    type: "closeSingleQuote",
    finalType: "quoteMark",
    on: /'/,
    closes: "singleQuotedString",
  },
  {
    type: "closeParenthesis",
    on: /\)/,
    closes: "group",
  },
  {
    type: "closeBrace",
    on: /}/,
    closes: "bracedReference",
  },
] as const;

const memberTokens: readonly MemberTokenType[] = [
  {
    type: "escapedBackslash",
    finalType: "string",
    on: /(?:\\{2})+/,
    flatten: true,
    memberOf: "doubleQuotedString",
  },
  {
    type: "escapedBackslash",
    finalType: "string",
    on: /(?:\\{2})+/,
    flatten: true,
    memberOf: "singleQuotedString",
  },
  {
    type: "escapedDoubleQuote",
    finalType: "string",
    on: /\\"/,
    memberOf: "doubleQuotedString",
    flatten: true,
  },
  {
    type: "escapedSingleQuote",
    finalType: "string",
    on: /\\''/,
    memberOf: "singleQuotedString",
    flatten: true,
  },
  {
    type: "number",
    on: /\d+(?:\.\d+)?/,
    memberOf: "group",
  },
  {
    type: "argumentSeparator",
    on: /,/,
    memberOf: "group",
  },
  {
    type: "operator",
    on: operatorMatcher,
    memberOf: "group",
  },
  {
    type: "reference",
    // The Assumption is that a reference may not contain special characters
    // So that refs like `$myField` or `%myField` are not allowed, unless they
    // are braced with `{}`.
    on: /\b[a-z]\w*/i,
    memberOf: "group",
  },
  {
    type: "space",
    on: /\s+/,
    memberOf: "group",
  },
] as const;

const enclosedTokens: readonly EnclosedToken[] = [
  {
    type: "bracedReference",
    finalType: "reference",
    on: /[^{}]+/,
  },
  {
    type: "doubleQuotedString",
    finalType: "string",
    on: /[^"\\]+/,
  },
  {
    type: "singleQuotedString",
    finalType: "string",
    on: /[^']+/,
  },
  {
    type: "group",
    // eslint-disable-next-line no-empty-character-class
    on: /[]/, // Everything should have been matched by now. So anything else is an error.
  },
] as const;

const tokenTypes = [
  ...openingTokens,
  ...closingTokens,
  ...memberTokens,
  ...enclosedTokens,
] as const;

type DirtyToken = {
  type: WorkingTokenTypeName;
  value: string;
  start: number;
  end: number;
  opener?: DirtyToken;
  closer?: DirtyToken;
  members?: DirtyToken[];
};

export type Token = Omit<
  DirtyToken,
  "type" | "opener" | "closer" | "members"
> & {
  type: TokenTypeName;
  opener?: Token;
  closer?: Token;
  members?: Token[];
};

type StartedToken = Omit<DirtyToken, "end"> &
  Partial<DirtyToken> &
  Required<Pick<DirtyToken, "members">>;

function finalizeToken({
  type,
  opener,
  closer,
  members,
  ...rest
}: Readonly<DirtyToken>): Token {
  const typeDef = tokenTypes.find((t) => t.type === type);

  if (!typeDef) {
    throw new Error(`Unknown token type: ${type}`);
  }

  return {
    type: typeDef.finalType || typeDef.type,
    ...Object.fromEntries(
      [
        ["opener", opener && finalizeToken(opener)],
        ["closer", closer && finalizeToken(closer)],
        ["members", members && members.map(finalizeToken)],
      ].filter(([, value]) => value !== undefined)
    ),
    ...rest,
  };
}

function createTokenFromMatch(
  type: WorkingTokenTypeName | TokenTypeName,
  match: RegExpExecArray,
  offset = 0
): DirtyToken {
  return {
    type,
    start: offset + match.index,
    end: offset + match.index + match[0].length,
    value: match[0],
  };
}

function isToken(obj: Record<string, unknown>): obj is Token {
  const { type, start, end, value } = obj;

  return (
    typeof type === "string" &&
    isTokenName(type) &&
    typeof start === "number" &&
    typeof end === "number" &&
    typeof value === "string"
  );
}

function closeEnclosedToken(
  currentToken: StartedToken,
  closer: DirtyToken
): DirtyToken {
  return {
    ...currentToken,
    closer,
    end: closer.start,
  };
}

function appendToken(
  group: StartedToken,
  member: DirtyToken,
  addMember = true
) {
  if (!group.end) {
    group.value += member.value;
  }
  if (addMember) {
    group.members.push(member);
  }
}

function getApplicableTypes(currentToken: StartedToken) {
  return tokenTypes.filter(
    ({ type, closes, memberOf, onlyIn }) =>
      type === currentToken.type ||
      (closes && closes === currentToken.type) ||
      (memberOf && memberOf === currentToken.type) ||
      (onlyIn && onlyIn === currentToken.type)
  );
}

function findNextToken(
  applicableTypes: (
    | OpeningTokenType
    | ClosingTokenType
    | MemberTokenType
    | EnclosedToken
  )[],
  remaining: string,
  i: number,
  currentToken: Omit<DirtyToken, "end"> &
    Partial<DirtyToken> &
    Required<Pick<DirtyToken, "members">>
) {
  const matches = applicableTypes
    .map((tokenType) => ({ match: tokenType.on.exec(remaining), tokenType }))
    .filter(({ match }) => match?.index === 0) as {
    match: RegExpExecArray;
    tokenType: TokenType;
  }[];

  if (matches.length === 0) {
    throw new Error(
      `Syntax error at position ${i} for ${
        currentToken.type
      }:\n\tExpected: ${applicableTypes
        .map(({ type, on }) => `${type} (${on})`)
        .join(", ")}\n\tGot: "${remaining}"`
    );
  }

  const { match, tokenType } = matches.reduce((a, b) =>
    a.match.index <= b.match.index ? a : b
  );
  return { match, tokenType };
}

export function tokenize(formula: string): Token {
  const rootToken: StartedToken = {
    start: 0,
    end: formula.length,
    type: "group",
    value: formula,
    members: [],
  };

  let currentToken: StartedToken = rootToken;
  const stack: StartedToken[] = [];

  for (let i = 0; i < formula.length; i++) {
    const remaining = formula.slice(i);

    const applicableTypes = getApplicableTypes(currentToken);
    const { match, tokenType } = findNextToken(
      applicableTypes,
      remaining,
      i,
      currentToken
    );

    const matchedToken = createTokenFromMatch(tokenType.type, match, i);

    const invalidStr = formula.slice(i, matchedToken.start);

    if (invalidStr) {
      throw new Error(
        `Syntax Error: Invalid tokens at position ${i}: ${invalidStr}`
      );
    }

    if (isOpening(tokenType)) {
      const { opens } = tokenType;
      const openingToken: StartedToken = {
        type: opens,
        value: "",
        start: matchedToken.end,
        opener: matchedToken,
        members: [],
      };
      stack.push(currentToken);
      currentToken = openingToken;
    } else if (isClosing(tokenType)) {
      const superToken = stack.pop();
      if (!superToken) {
        throw new Error(
          `Syntax Error: Unexpected closing token ${match[0]} at ${i}`
        );
      }

      superToken.members.push(closeEnclosedToken(currentToken, matchedToken));

      currentToken = superToken;
    } else if (isMember(tokenType) || isEnclosed(tokenType)) {
      const { flatten } = tokenType;

      appendToken(currentToken, matchedToken, isMember(tokenType) && !flatten);
      i = matchedToken.end - 1;
    } else {
      throw new Error(`Syntax Error: Unexpected token ${match[0]} at ${i}`);
    }
  }

  if (currentToken !== rootToken) {
    throw new Error(
      `SyntaxError: Unclosed token ${currentToken.type}, with ${
        currentToken.opener?.value
      } at position ${
        currentToken.opener?.start
      }, but no closing token at position ${
        currentToken.start + currentToken.value.length
      }`
    );
  }

  if (!isToken(rootToken)) {
    throw new Error("Internal error: Root Token is incomplete");
  }

  return finalizeToken(rootToken);
}

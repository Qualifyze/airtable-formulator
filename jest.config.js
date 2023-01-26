module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/lib/"],
};

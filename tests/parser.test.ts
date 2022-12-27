import { instructionDictionaryType } from "../src/instructions";
import { Parser } from "../src/parser";

const testDictionary: instructionDictionaryType = [
  {
    type: "source",
    name: "SRC",
    implementation: () => {
      return 0;
    },
  },
  {
    type: "source",
    name: "OP",
    isOperand: true,
    implementation: () => {
      return 0;
    },
  },
  {
    type: "destination",
    name: "DEST",
    implementation: () => {},
  },
];

const parser = new Parser(testDictionary);

it("Parses basic instruction", () => {
  expect(parser.parse(String.raw`SRC => DEST`).instructions).toMatchObject([
    { source: "SRC", destination: "DEST", carry: false, zero: false },
  ]);
});

it("Parses multiple instructions", () => {
  expect(
    parser.parse(String.raw`SRC => DEST SRC => DEST SRC => DEST`).instructions
      .length
  ).toBe(3);
});

it("Parses instruction with flags", () => {
  expect(parser.parse(String.raw`SRC => DEST c z`).instructions).toMatchObject([
    { source: "SRC", destination: "DEST", carry: true, zero: true },
  ]);
});

it("Parses basic variable", () => {
  expect(parser.parse(String.raw`word var = 10`).variables).toMatchObject([
    { name: "var", size: 1, dimension: [1], value: 10 },
  ]);
});

it("Parses array", () => {
  expect(
    parser.parse(String.raw`word var[10] = "abcd"`).variables
  ).toMatchObject([
    { name: "var", size: 10, dimension: [10], value: [97, 98, 99, 100, 0] },
  ]);
});

it("Parses multidimensional array", () => {
  expect(
    parser.parse(String.raw`word var[2][2][3] = [[['a',-1],"ab"],0x5]`)
      .variables
  ).toMatchObject([
    {
      name: "var",
      size: 12,
      dimension: [2, 2, 3],
      value: [
        [
          [97, -1],
          [97, 98, 0],
        ],
        5,
      ],
    },
  ]);
});

it("Parses label", () => {
  expect(parser.parse(String.raw`label:`).labels).toMatchObject([
    { address: 0, name: "label" },
  ]);
});

it("Throws error when literal value is too high", () => {
  expect(() => parser.parse(String.raw`65536 => DEST`)).toThrow();
});

it("Throws error when literal value is too low", () => {
  expect(() => parser.parse(String.raw`-32769 => DEST`)).toThrow();
});

it("Throws error when reference name is redeclared", () => {
  expect(() => parser.parse(String.raw`name: word name`)).toThrow();
  expect(() => parser.parse(String.raw`word name2 name2:`)).toThrow();
});

it("Throws error on syntax error", () => {
  expect(() => parser.parse(String.raw`SRC -> DEST`)).toThrow();
});

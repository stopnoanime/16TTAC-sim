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

it("Parses basic instruction", () => {
  const parser = new Parser(testDictionary);
  expect(parser.parse(String.raw`SRC => DEST`).instructions).toMatchObject([
    { source: "SRC", destination: "DEST", carry: false, zero: false },
  ]);
});

it("Parses multiple instructions", () => {
  const parser = new Parser(testDictionary);
  expect(
    parser.parse(String.raw`SRC => DEST SRC => DEST SRC => DEST`).instructions
      .length
  ).toBe(3);
});

it("Parses instruction with flags", () => {
  const parser = new Parser(testDictionary);
  expect(parser.parse(String.raw`SRC => DEST c z`).instructions).toMatchObject([
    { source: "SRC", destination: "DEST", carry: true, zero: true },
  ]);
});

it("Parses basic variable", () => {
  const parser = new Parser(testDictionary);
  expect(parser.parse(String.raw`word var = 10`).variables).toMatchObject([
    { name: "var", size: 1, dimension: [1], value: 10 },
  ]);
});

it("Parses array", () => {
  const parser = new Parser(testDictionary);
  expect(
    parser.parse(String.raw`word var[10] = "abcd"`).variables
  ).toMatchObject([
    { name: "var", size: 10, dimension: [10], value: [97, 98, 99, 100, 0] },
  ]);
});

it("Parses multidimensional array", () => {
  const parser = new Parser(testDictionary);
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
  const parser = new Parser(testDictionary);
  expect(parser.parse(String.raw`label:`).labels).toMatchObject([
    { address: 0, name: "label" },
  ]);
});

it("Throws error when literal value is too high", () => {
  const parser = new Parser(testDictionary);
  expect(() => parser.parse(String.raw`65536 => DEST`)).toThrow();
});

it("Throws error when literal value is too low", () => {
  const parser = new Parser(testDictionary);
  expect(() => parser.parse(String.raw`-32769 => DEST`)).toThrow();
});

it("Throws error when reference name is redeclared", () => {
  const parser = new Parser(testDictionary);
  expect(() => parser.parse(String.raw`name: word name`)).toThrow();
});

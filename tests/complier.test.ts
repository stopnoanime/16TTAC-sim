import { instructionDictionaryType } from "../src/instructions";
import { Parser } from "../src/parser";
import { Compiler } from "../src/compiler";

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
const compiler = new Compiler(testDictionary);

it("Compiles basic instruction", () => {
  expect(compiler.compile(parser.parse(String.raw`SRC => DEST`))).toMatchObject(
    { 0: 0 }
  );
});

it("Compiles instruction with flags", () => {
  expect(
    compiler.compile(parser.parse(String.raw`SRC => DEST c z `))
  ).toMatchObject({ 0: 3 });
});

it("Compiles operand instruction", () => {
  expect(compiler.compile(parser.parse(String.raw`100 => DEST`))).toMatchObject(
    { 0: 512, 1: 100 }
  );
});

it("Compiles multiple instructions", () => {
  expect(
    compiler.compile(
      parser.parse(String.raw`SRC => DEST SRC => DEST z SRC => DEST c`)
    )
  ).toMatchObject({ 0: 0, 1: 1, 2: 2 });
});

it("Compiles basic variable", () => {
  expect(
    compiler.compile(parser.parse(String.raw`word var = 10`))
  ).toMatchObject({ 0: 10 });
});

it("Compiles array", () => {
  expect(
    compiler.compile(parser.parse(String.raw`word var[4] = "abc"`))
  ).toMatchObject({ 0: 97, 1: 98, 2: 99, 3: 0 });
});

it("Compiles multidimensional array", () => {
  expect(
    compiler.compile(
      parser.parse(String.raw`word var[2][2][2] = [[['a',-1],"b"],0x5]`)
    )
  ).toMatchObject({
    0: 97,
    1: 65535,
    2: 98,
    3: 0,
    4: 5,
    5: 5,
    6: 5,
    7: 5,
  });
});

it("Compiles reference", () => {
  expect(
    compiler.compile(
      parser.parse(String.raw`label: var => DEST label => DEST word var`)
    )
  ).toMatchObject({
    0: 512,
    1: 4,
    2: 512,
    3: 0,
    4: 0,
  });
});

it("Throws error when literal value is too long", () => {
  expect(() =>
    compiler.compile(parser.parse(String.raw`word var[3] = "abc"`))
  ).toThrow();
});

it("Throws error when literal value is too deep", () => {
  expect(() =>
    compiler.compile(parser.parse(String.raw`word var[2] = [['a', 'b']]`))
  ).toThrow();
});

it("Throws error when reference with name is not found", () => {
  expect(() =>
    compiler.compile(parser.parse(String.raw`varName => DEST`))
  ).toThrow();
});

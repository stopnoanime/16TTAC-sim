import { instructionDictionaryType, Instructions } from "../src/instructions";

const testDictionary: instructionDictionaryType = [
  {
    type: "source",
    name: "source1",
    implementation: () => {
      return 0;
    },
    opcode: 10,
  },
  {
    type: "source",
    name: "source2",
    implementation: () => {
      return 0;
    },
  },
  {
    type: "source",
    name: "operand",
    isOperand: true,
    implementation: () => {
      return 0;
    },
  },
  {
    type: "destination",
    name: "destination1",
    implementation: () => {},
    opcode: 0,
  },
  { type: "destination", name: "destination2", implementation: () => {} },
];

const ins = new Instructions(testDictionary);

it("Fails where there is no operand source", () => {
  expect(() => new Instructions([])).toThrow();
});

it("Doesn't modify provided dictionary", () => {
  const dict: instructionDictionaryType = [
    {
      type: "source",
      name: "",
      isOperand: true,
      implementation: () => {
        return 0;
      },
    },
  ];

  new Instructions(dict);

  expect(dict[0].opcode).toBeUndefined();
});

it("Initializes sources list", () => {
  expect(ins.sources).toEqual(["source1", "source2"]);
});

it("Initializes destinations list", () => {
  expect(ins.destinations).toEqual(["destination1", "destination2"]);
});

it("Initializes source name to opcode map", () => {
  expect(ins.sourceNameToOpcode).toEqual({
    source1: 10,
    source2: 0,
    operand: 1,
  });
});

it("Initializes destination name to opcode map", () => {
  expect(ins.destinationNameToOpcode).toEqual({
    destination1: 0,
    destination2: 1,
  });
});

it("Initializes source opcode to implementation map", () => {
  expect(typeof ins.sourceOpcodeToImplementation[0]).toBe("function");
  expect(typeof ins.sourceOpcodeToImplementation[1]).toBe("function");
  expect(typeof ins.sourceOpcodeToImplementation[10]).toBe("function");
});

it("Initializes destination opcode to implementation map", () => {
  expect(typeof ins.destinationOpcodeToImplementation[0]).toBe("function");
  expect(typeof ins.destinationOpcodeToImplementation[1]).toBe("function");
});

it("Initializes source operand opcode", () => {
  expect(ins.sourceOperandOpcode).toBe(1);
});

it("Initializes source operand name", () => {
  expect(ins.sourceOperandName).toBe("operand");
});

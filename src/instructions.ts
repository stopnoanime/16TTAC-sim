import { uint16_max } from "./common";
import { Sim } from "./sim";

export class Instructions {
  public sources: string[];
  public destinations: string[];

  public sourceNameToOpcode: { [key: string]: number };
  public destinationNameToOpcode: { [key: string]: number };

  public sourceOpcodeToImplementation: {
    [key: number]: sourceImplementationType;
  };
  public destinationOpcodeToImplementation: {
    [key: number]: destinationImplementationType;
  };

  public sourceOperandOpcode: number;
  public sourceOperandName: string;

  constructor(dictionary = defaultInstructionDictionary) {
    const sourceDictionary = this.getSubDictionary("source", dictionary);
    const destinationDictionary = this.getSubDictionary(
      "destination",
      dictionary
    );

    this.automaticOpcode(sourceDictionary);
    this.automaticOpcode(destinationDictionary);

    this.sources = this.mapNames(sourceDictionary);
    this.destinations = this.mapNames(destinationDictionary);

    this.sourceNameToOpcode = this.mapNameToOpcode(sourceDictionary);
    this.destinationNameToOpcode = this.mapNameToOpcode(destinationDictionary);

    this.sourceOpcodeToImplementation =
      this.mapOpcodeToImplementation(sourceDictionary);

    this.destinationOpcodeToImplementation = this.mapOpcodeToImplementation(
      destinationDictionary
    );

    const foundOperand = sourceDictionary.find(
      (e) => (e as sourceType).isOperand
    );

    if (!foundOperand)
      throw new Error("Provided dictionary has no entry for source operand");

    this.sourceOperandOpcode = foundOperand.opcode;
    this.sourceOperandName = foundOperand.name;
  }

  private getSubDictionary(
    type: "source" | "destination",
    dictionary: instructionDictionaryType
  ) {
    return dictionary.filter((e) => e.type == type).map((v) => ({ ...v }));
  }

  private automaticOpcode(dictionary: instructionDictionaryType) {
    let automaticOpcode = 0;
    dictionary.forEach((e) => {
      if (e.opcode === undefined) {
        while (dictionary.find((e) => e.opcode === automaticOpcode))
          automaticOpcode++;
        e.opcode = automaticOpcode;
      }
    });
  }

  private mapNames(dictionary: instructionDictionaryType) {
    return dictionary
      .filter((e) => !(e as sourceType).isOperand)
      .map((e) => e.name);
  }

  private mapNameToOpcode(dictionary: instructionDictionaryType) {
    return this.mapXToY(dictionary, "name", "opcode");
  }

  private mapOpcodeToImplementation(dictionary: instructionDictionaryType) {
    return this.mapXToY(dictionary, "opcode", "implementation");
  }

  private mapXToY(
    dictionary: instructionDictionaryType,
    x: Exclude<keyof destinationType, "implementation">,
    y: keyof destinationType
  ) {
    return dictionary.reduce((obj, cur) => {
      obj[cur[x]] = cur[y];
      return obj;
    }, {} as any);
  }
}

export const defaultInstructionDictionary: instructionDictionaryType = [
  {
    type: "source",
    name: "ACC",
    implementation: function () {
      return this.acc;
    },
  },
  {
    type: "source",
    name: "ADR",
    implementation: function () {
      return this.adr;
    },
  },
  {
    type: "source",
    name: "MEM",
    implementation: function () {
      return this.memory[this.adr];
    },
  },
  {
    type: "source",
    name: "OP",
    isOperand: true,
    implementation: function () {
      return this.memory[++this.pc];
    },
  },
  {
    type: "source",
    name: "IN",
    implementation: function () {
      if (!this.inputAvailableCallback?.()) return null;

      return this.inputRawCallback?.() || 0;
    },
  },
  {
    type: "source",
    name: "IN_AV",
    implementation: function () {
      return this.inputAvailableCallback?.() ? 0xffff : 0;
    },
  },
  {
    type: "source",
    name: "POP",
    implementation: function () {
      return this.pop();
    },
  },

  {
    type: "destination",
    name: "ACC",
    implementation: function (n) {
      this.acc = n;
    },
  },
  {
    type: "destination",
    name: "ADR",
    implementation: function (n) {
      this.adr = n;
    },
  },
  {
    type: "destination",
    name: "MEM",
    implementation: function (n) {
      this.memory[this.adr] = n;
    },
  },
  {
    type: "destination",
    name: "PLUS",
    implementation: function (n) {
      this.acc += n + (this.carry ? 1 : 0);
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "MINUS",
    implementation: function (n) {
      this.acc -= n + (this.carry ? 1 : 0);
      this.carry = this.acc < 0;
    },
  },
  {
    type: "destination",
    name: "CARRY",
    implementation: function (n) {
      this.carry = n != 0;
    },
  },
  {
    type: "destination",
    name: "ZERO",
    implementation: function (n) {
      this.zero = n != 0;
    },
  },
  {
    type: "destination",
    name: "OUT",
    implementation: function (n) {
      this.outputRawCallback?.(n);
    },
  },
  {
    type: "destination",
    name: "PC",
    implementation: function (n) {
      this.pc = n;
    },
  },
  {
    type: "destination",
    name: "HALT",
    implementation: function (n, instructionLength) {
      this.pc -= instructionLength;
      this.haltCallback();
    },
  },
  {
    type: "destination",
    name: "SHIFT_L",
    implementation: function (n) {
      if (n >= 32) this.acc = 0; //Js shift overflows if above 32
      else this.acc <<= n;
    },
  },
  {
    type: "destination",
    name: "SHIFT_R",
    implementation: function (n) {
      if (n >= 32) this.acc = 0; //Js shift overflows if above 32
      else this.acc >>>= n;
    },
  },
  {
    type: "destination",
    name: "MUL",
    implementation: function (n) {
      this.acc *= n;
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "DIV_S",
    implementation: function (n) {
      this.acc = ((this.acc << 16) >> 16) / ((n << 16) >> 16);
    },
  },
  {
    type: "destination",
    name: "DIV",
    implementation: function (n) {
      this.acc /= n;
    },
  },
  {
    type: "destination",
    name: "MOD_S",
    implementation: function (n) {
      this.acc = ((this.acc << 16) >> 16) % ((n << 16) >> 16);
    },
  },
  {
    type: "destination",
    name: "MOD",
    implementation: function (n) {
      this.acc %= n;
    },
  },
  {
    type: "destination",
    name: "PUSH",
    implementation: function (n) {
      this.push(n);
    },
  },
  {
    type: "destination",
    name: "CALL",
    implementation: function (n) {
      this.push(this.pc);
      this.pc = n;
    },
  },
];

export type instructionDictionaryType = Array<destinationType | sourceType>;

type destinationType = {
  type: "destination";
  name: string;
  opcode?: number;
  implementation: destinationImplementationType;
};

type sourceType = {
  type: "source";
  name: string;
  opcode?: number;
  isOperand?: boolean;
  implementation: sourceImplementationType;
};

type destinationImplementationType = (
  this: Sim,
  n: number,
  instructionLength?: number
) => void;
type sourceImplementationType = (this: Sim) => number;

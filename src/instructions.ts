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

  constructor(dictionary = defaultInstructionDictionary) {
    let automaticOpcode = 0;

    dictionary.forEach((e) => {
      if (e.opcode === undefined) {
        while (this.opcodeAlreadyUsed(automaticOpcode, dictionary))
          automaticOpcode++;
        e.opcode = automaticOpcode;
      }
    });

    this.sources = this.mapNames("source", dictionary);
    this.destinations = this.mapNames("destination", dictionary);

    this.sourceNameToOpcode = this.mapNameToOpcode("source", dictionary);
    this.destinationNameToOpcode = this.mapNameToOpcode(
      "destination",
      dictionary
    );

    this.sourceOpcodeToImplementation = this.mapOpcodeToImplementation(
      "source",
      dictionary
    );
    this.destinationOpcodeToImplementation = this.mapOpcodeToImplementation(
      "destination",
      dictionary
    );

    this.sourceOperandOpcode = dictionary.find(
      (e) => e.type == "source" && e.name == "op"
    ).opcode;
  }

  private mapNames(
    type: "source" | "destination",
    dictionary: instructionDictionaryType
  ) {
    return dictionary.filter((e) => e.type == type).map((e) => e.name);
  }

  private mapNameToOpcode(
    type: "source" | "destination",
    dictionary: instructionDictionaryType
  ) {
    return dictionary
      .filter((e) => e.type == type)
      .reduce((obj, cur) => {
        obj[cur.name] = cur.opcode;
        return obj;
      }, {} as any);
  }

  private mapOpcodeToImplementation(
    type: "source" | "destination",
    dictionary: instructionDictionaryType
  ) {
    return dictionary
      .filter((e) => e.type == type)
      .reduce((obj, cur) => {
        obj[cur.opcode] = cur.implementation;
        return obj;
      }, {} as any);
  }

  private opcodeAlreadyUsed(
    opcode: number,
    dictionary: instructionDictionaryType
  ) {
    return dictionary.find((e) => e.opcode === opcode);
  }
}

export const defaultInstructionDictionary: instructionDictionaryType = [
  {
    type: "source",
    name: "acc",
    implementation: function () {
      return this.acc;
    },
  },
  {
    type: "source",
    name: "adr",
    implementation: function () {
      return this.adr;
    },
  },
  {
    type: "source",
    name: "mem",
    implementation: function () {
      return this.memory[this.adr];
    },
  },
  {
    type: "source",
    name: "op",
    implementation: function () {
      return this.memory[++this.pc];
    },
  },
  {
    type: "source",
    name: "in",
    implementation: function () {
      if (!this.inputAvailableCallback?.()) return null;

      return this.inputRawCallback?.() || 0;
    },
  },
  {
    type: "source",
    name: "in_av",
    implementation: function () {
      return this.inputAvailableCallback?.() ? 0xffff : 0;
    },
  },
  {
    type: "source",
    name: "pop",
    implementation: function () {
      return this.pop();
    },
  },

  {
    type: "destination",
    name: "acc",
    implementation: function (n) {
      this.acc = n;
    },
  },
  {
    type: "destination",
    name: "adr",
    implementation: function (n) {
      this.adr = n;
    },
  },
  {
    type: "destination",
    name: "mem",
    implementation: function (n) {
      this.memory[this.adr] = n;
    },
  },
  {
    type: "destination",
    name: "plus",
    implementation: function (n) {
      this.acc += n + (this.carry ? 1 : 0);
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "minus",
    implementation: function (n) {
      this.acc -= n + (this.carry ? 1 : 0);
      this.carry = this.acc < 0;
    },
  },
  {
    type: "destination",
    name: "carry",
    implementation: function (n) {
      this.carry = n != 0;
    },
  },
  {
    type: "destination",
    name: "zero",
    implementation: function (n) {
      this.zero = n != 0;
    },
  },
  {
    type: "destination",
    name: "out",
    implementation: function (n) {
      this.outputRawCallback?.(n);
    },
  },
  {
    type: "destination",
    name: "pc",
    implementation: function (n) {
      this.pc = n;
    },
  },
  {
    type: "destination",
    name: "halt",
    implementation: function (n, instructionLength) {
      this.pc -= instructionLength;
      this.haltCallback();
    },
  },
  {
    type: "destination",
    name: "shift_l",
    implementation: function (n) {
      if (n >= 32) this.acc = 0; //Js shift overflows if above 32
      else this.acc <<= n;
    },
  },
  {
    type: "destination",
    name: "shift_r",
    implementation: function (n) {
      if (n >= 32) this.acc = 0; //Js shift overflows if above 32
      else this.acc >>>= n;
    },
  },
  {
    type: "destination",
    name: "mul",
    implementation: function (n) {
      this.acc *= n;
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "div_s",
    implementation: function (n) {
      this.acc = ((this.acc << 16) >> 16) / ((n << 16) >> 16);
    },
  },
  {
    type: "destination",
    name: "div",
    implementation: function (n) {
      this.acc /= n;
    },
  },
  {
    type: "destination",
    name: "mod_s",
    implementation: function (n) {
      this.acc = ((this.acc << 16) >> 16) % ((n << 16) >> 16);
    },
  },
  {
    type: "destination",
    name: "mod",
    implementation: function (n) {
      this.acc %= n;
    },
  },
  {
    type: "destination",
    name: "push",
    implementation: function (n) {
      this.push(n);
    },
  },
  {
    type: "destination",
    name: "call",
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
  implementation: sourceImplementationType;
};

type destinationImplementationType = (
  this: Sim,
  n: number,
  instructionLength?: number
) => void;
type sourceImplementationType = (this: Sim) => number;

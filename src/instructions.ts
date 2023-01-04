import { defaultInstructionDictionary } from "./instructionDictionary.js";
import { Sim } from "./sim.js";

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

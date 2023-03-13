import { defaultInstructionDictionary } from "./instructionDictionary.js";
import { Sim } from "./sim.js";

export class Instructions {
  /** Array of all source's names */
  public sources: string[];
  /** Array of all destination's names */
  public destinations: string[];

  public sourceNameToOpcode: { [key: string]: number };
  public destinationNameToOpcode: { [key: string]: number };

  public sourceOpcodeToImplementation: {
    [key: number]: sourceImplementationType;
  };
  public destinationOpcodeToImplementation: {
    [key: number]: destinationImplementationType;
  };

  /** Opcode of the source with isOperand set */
  public sourceOperandOpcode: number;
  /** Name of the source with isOperand set */
  public sourceOperandName: string;

  /**
   * Constructs the instructions helper class
   * @param dictionary Optional dictionary to use instead of the default one
   */
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

  /** Returns only specific type of instructions from dictionary */
  private getSubDictionary(
    type: "source" | "destination",
    dictionary: instructionDictionaryType
  ) {
    return dictionary.filter((e) => e.type == type).map((v) => ({ ...v }));
  }

  /** Automatically sets opcodes for instructions that don't have it */
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

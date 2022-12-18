import { instructionDictionaryType, Instructions } from "./instructions";
import { labelType, nestedNumber, Parser, variableType } from "./parser";

export class Compiler {
  private parser: Parser;
  private instructions: Instructions;

  constructor(dictionary?: instructionDictionaryType) {
    this.parser = new Parser(dictionary);
    this.instructions = new Instructions(dictionary);
  }

  public compile(input: string) {
    const pOut = this.parser.parse(input);

    const output: number[] = [];
    const variablesOffset = this.parser.nextTokenAddress(pOut.instructions);

    pOut.instructions.forEach((ins) => {
      output.push(
        (this.instructions.sourceNameToOpcode[ins.source] << 9) +
          (this.instructions.destinationNameToOpcode[ins.destination] << 2) +
          (ins.carry ? 2 : 0) +
          (ins.zero ? 1 : 0)
      );

      if (ins.source != "op") return;

      if (ins.operandType == "reference")
        output.push(
          this.getReferenceAddress(
            ins.operandValue as string,
            ins.sourceErrorMessage,
            variablesOffset,
            pOut.labels,
            pOut.variables
          )
        );
      else
        output.push(
          this.getVariableValueAtPosition([0], ins.operandValue as nestedNumber)
        );
    });

    pOut.variables.forEach((vr) => {
      output.push(
        // @ts-ignore
        ...this.getVariableSubArray([], vr.dimension, vr.value).flat(Infinity)
      );
    });

    return new Uint16Array(output);
  }

  private getVariableSubArray(
    dimBefore: number[],
    dim: number[],
    value: nestedNumber
  ): nestedNumber[] {
    if (dim.length == 1)
      return Array.from(Array(dim[0])).map((_, i) =>
        this.getVariableValueAtPosition([...dimBefore, i], value)
      );
    else
      return Array.from(Array(dim[0])).map((_, i) =>
        this.getVariableSubArray([...dimBefore, i], dim.slice(1), value)
      );
  }

  private getVariableValueAtPosition(
    pos: number[],
    value: nestedNumber
  ): number {
    if (Array.isArray(value)) {
      const pop = pos.length == 0 ? 0 : pos.shift(); // Value is array and pos has no elements = value literal is deeper than array structure, default to first subarray element
      if (pop >= value.length) return 0; //If element position in array is larger than given initial value size, default to 0

      return this.getVariableValueAtPosition(pos, value[pop]);
    } else return value; // value is number
  }

  private getReferenceAddress(
    name: string,
    errorMessage: string,
    variablesOffset: number,
    labels: labelType[],
    variables: variableType[]
  ) {
    const foundLabel = labels.find((v) => v.name == name);

    if (foundLabel) return foundLabel.address;

    const foundVar = variables.find((v) => v.name == name);

    if (!foundVar)
      throw errorMessage + `Reference with name "${name}" not found.`;

    return foundVar.address + variablesOffset;
  }
}

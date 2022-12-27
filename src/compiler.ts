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

      if (ins.operandReference)
        output.push(
          this.getReferenceAddress(
            ins.operandReference,
            ins.sourceErrorMessage,
            variablesOffset,
            pOut.labels,
            pOut.variables
          )
        );
      else output.push(ins.operandValue);
    });

    pOut.variables.forEach((vr) => {
      output.push(
        // @ts-ignore
        ...this.getVariableSubArray(
          vr.dimension,
          vr.value,
          vr.valueErrorMessage
        ).flat(Infinity)
      );
    });

    return new Uint16Array(output);
  }

  private getVariableSubArray(
    dim: number[],
    value: nestedNumber,
    errMsg: string
  ): nestedNumber[] {
    if (Array.isArray(value) && value.length > dim[0])
      throw new Error(errMsg + "Value literal is too long.");
    return Array.from(Array(dim[0])).map((_, i) => {
      if (dim.length == 1) {
        const val = this.getVariableValueAtPosition(i, value);
        if (Array.isArray(val))
          throw new Error(errMsg + "Value literal is too deep.");
        return val;
      } else {
        return this.getVariableSubArray(
          dim.slice(1),
          this.getVariableValueAtPosition(i, value),
          errMsg
        );
      }
    });
  }

  private getVariableValueAtPosition(
    pos: number,
    value: nestedNumber
  ): nestedNumber {
    if (Array.isArray(value)) {
      if (pos >= value.length) return 0;

      return value[pos];
    } else return value;
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
      throw new Error(
        errorMessage + `Reference with name "${name}" not found.`
      );

    return foundVar.address + variablesOffset;
  }
}

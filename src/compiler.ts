import { instructionDictionaryType, Instructions } from "./instructions";
import { labelType, nestedNumber, parserOutput, variableType } from "./parser";

export class Compiler {
  private instructions: Instructions;

  constructor(dictionary?: instructionDictionaryType) {
    this.instructions = new Instructions(dictionary);
  }

  public compile(parserOutput: parserOutput) {
    const output: number[] = [];

    parserOutput.instructions.forEach((ins) => {
      output.push(
        (this.instructions.sourceNameToOpcode[ins.source] << 9) +
          (this.instructions.destinationNameToOpcode[ins.destination] << 2) +
          (ins.carry ? 2 : 0) +
          (ins.zero ? 1 : 0)
      );

      if ("operandReference" in ins)
        output.push(
          this.getReferenceAddress(
            ins.operandReference,
            ins.sourceErrorMessage,
            parserOutput.labels,
            parserOutput.variables
          )
        );
      else if ("operandValue" in ins) output.push(ins.operandValue);
    });

    parserOutput.variables.forEach((vr) => {
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
    labels: labelType[],
    variables: variableType[]
  ) {
    const found = [...labels, ...variables].find((v) => v.name == name);

    if (!found)
      throw new Error(
        errorMessage + `Reference with name "${name}" not found.`
      );

    return found.address;
  }
}

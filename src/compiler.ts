import { uint16_max } from "./common.js";
import { instructionDictionaryType, Instructions } from "./instructions.js";
import {
  labelType,
  nestedNumber,
  parserOutput,
  variableType,
} from "./parser.js";

export class Compiler {
  private instructions: Instructions;

  /**
   * Constructs the compiler
   * @param dictionary Optional dictionary to use instead of the default one
   */
  constructor(dictionary?: instructionDictionaryType) {
    this.instructions = new Instructions(dictionary);
  }

  /**
   * Compiles given code
   * @param input The code to compile
   * @returns Compiled binary code
   */
  public compile(parserOutput: parserOutput) {
    const output: number[] = [];

    //First output instructions
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

    //Then output variables
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

    if (output.length > uint16_max + 1)
      throw new Error(
        `Program size ${output.length} is larger than the maximum of ${
          uint16_max + 1
        }`
      );

    return new Uint16Array(output);
  }

  /** Used to extract data from a variable literal in a recursive way */
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

  /**
   * Returns address of reference (variable or label) with given name
   * Throws error if it does not exist.
   */
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

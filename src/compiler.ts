import { destinationToVal, sourceToVal } from "./instructions";
import { labelType, nestedNumber, Parser, variableType } from "./parser";

export class Compiler {
  private parser = new Parser();

  public compile(input: string) {
    const pOut = this.parser.parse(input);

    const output: number[] = [];
    const variablesOffset = this.parser.nextTokenAddress(pOut.instructions);

    pOut.instructions.forEach((ins) => {
      output.push(
        (sourceToVal[ins.source] << 9) +
          (destinationToVal[ins.destination] << 2) +
          (ins.carry ? 2 : 0) +
          (ins.zero ? 1 : 0)
      );

      if (ins.source != "op") return;

      if (ins.operandType == "reference")
        output.push(
          this.getReferenceAddress(
            ins.operandValue as string,
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
      if (pos.length == 0)
        throw "Array initialization value is too deep for array structure";

      const pop = pos.shift();
      if (pop >= value.length) return 0; //If element position is array is larger than given initial value size, default to 0

      return this.getVariableValueAtPosition(pos, value[pop]);
    } else return value; // value is number
  }

  private getReferenceAddress(
    name: string,
    variablesOffset: number,
    labels: labelType[],
    variables: variableType[]
  ) {
    const foundLabel = labels.find((v) => v.name == name);

    if (foundLabel) return foundLabel.address;

    const foundVar = variables.find((v) => v.name == name);

    if (!foundVar) throw "reference not found";

    return foundVar.address + variablesOffset;
  }
}

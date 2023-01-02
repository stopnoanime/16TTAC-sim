import ohm from "ohm-js";
import { int16_min, uint16_max } from "./common.js";
import { Grammar } from "./grammar.js";
import { instructionDictionaryType, Instructions } from "./instructions.js";

export class Parser {
  private ohmGrammar: ohm.Grammar;
  private ohmSemantics: ohm.Semantics;

  private variables: variableType[];
  private instructions: instructionType[];
  private labels: labelType[];

  private grammar: Grammar;
  private instr: Instructions;

  constructor(dictionary?: instructionDictionaryType) {
    this.grammar = new Grammar(dictionary);
    this.instr = new Instructions(dictionary);

    this.ohmGrammar = ohm.grammar(this.grammar.grammarDefinition);
    this.ohmSemantics = this.ohmGrammar.createSemantics();

    const classThis = this;

    this.ohmSemantics.addOperation("eval", {
      Token_variable(_, name, arrDim, __, value) {
        classThis.checkIfReferenceAlreadyExists(name.eval(), name);

        const arr = arrDim.eval() as number[];
        const isArr = arr.length != 0;

        classThis.variables.push({
          name: name.eval(),
          address: classThis.nextTokenAddress(classThis.variables),
          size: isArr ? arr.reduce((a, c) => (a *= c)) : 1,
          dimension: isArr ? arr : [1], //Treat normal variable as one dimensional array with length 1
          value: value.eval()[0] || 0,
          valueErrorMessage: value.source.getLineAndColumnMessage(),
        });
      },

      Token_ins(src, _, dest, fc, fz) {
        const isOperand = src.ctorName != "src";

        classThis.instructions.push({
          source: isOperand ? classThis.instr.sourceOperandName : src.eval(),
          destination: dest.eval(),
          carry: fc.eval() == "c",
          zero: fz.eval() == "z",
          address: classThis.nextTokenAddress(classThis.instructions),
          sourceErrorMessage: src.source.getLineAndColumnMessage(),
          size: isOperand ? 2 : 1,
          ...(isOperand && {
            ...(src.ctorName == "varName" && {
              //Source is a reference to variable
              operandReference: src.eval(),
            }),
            ...(src.ctorName != "varName" && {
              //Source is literal value
              operandValue: src.eval(),
            }),
          }),
        });
      },

      Token_label(name, _) {
        classThis.checkIfReferenceAlreadyExists(name.eval(), name);

        classThis.labels.push({
          name: name.eval(),
          address: classThis.nextTokenAddress(classThis.instructions),
        });
      },

      ArrDim(_, dim, __) {
        return dim.children.map((c) => c.eval());
      },

      ArrLiteral_array(_, arr, __) {
        return arr.asIteration().children.map((c: any) => c.eval());
      },

      varName(_, __) {
        return this.sourceString;
      },

      number(_, __) {
        const n = parseInt(this.sourceString);
        classThis.checkIfNumberOutOfRange(n, this);
        return n;
      },

      hexLiteral(_, __) {
        const n = parseInt(this.sourceString, 16);
        classThis.checkIfNumberOutOfRange(n, this);
        return n;
      },

      charLiteral(_, c, __) {
        return c.eval().charCodeAt(0);
      },

      stringLiteral(_, s, __) {
        return [...s.eval().map((s: string) => s.charCodeAt(0)), 0];
      },

      escapedCharacter(_, s) {
        switch (s.sourceString) {
          case "n":
            return "\n";
          case "b":
            return "\b";
          case "t":
            return "\t";
          case "0":
            return "\0";

          default:
            return s.sourceString;
        }
      },

      cFlag(s, _) {
        return s.sourceString;
      },

      zFlag(s, _) {
        return s.sourceString;
      },

      dest(s, _) {
        return s.sourceString;
      },

      src(s, _) {
        return s.sourceString;
      },

      _iter(...children) {
        return children.map((c) => c.eval());
      },

      _terminal() {
        return this.sourceString;
      },
    });
  }

  public parse(input: string): parserOutput {
    this.variables = [];
    this.instructions = [];
    this.labels = [];

    const match = this.ohmGrammar.match(input);

    if (match.failed()) throw new Error(match.message);

    this.ohmSemantics(match).eval();

    const variablesOffset = this.nextTokenAddress(this.instructions);
    this.variables.forEach((v) => (v.address += variablesOffset));

    return {
      variables: this.variables,
      instructions: this.instructions,
      labels: this.labels,
    };
  }

  public nextTokenAddress(tokens: { address: number; size: number }[]) {
    return tokens.length == 0 ? 0 : tokens.at(-1).address + tokens.at(-1).size;
  }

  private checkIfNumberOutOfRange(n: number, node: ohm.Node) {
    if (n > uint16_max || n < int16_min)
      throw new Error(
        node.source.getLineAndColumnMessage() +
          `Literal value "${n}" is outside of valid range.`
      );
  }

  private checkIfReferenceAlreadyExists(name: string, node: ohm.Node) {
    if (
      this.variables.find((v) => v.name == name) ||
      this.labels.find((l) => l.name == name)
    )
      throw new Error(
        node.source.getLineAndColumnMessage() +
          `Reference with name "${name}" is already defined.`
      );
  }
}

export type instructionType = {
  source: string;
  destination: string;
  carry: boolean;
  zero: boolean;
  address: number;
  size: number;
  sourceErrorMessage: string;
  operandReference?: string;
  operandValue?: number;
};

export type labelType = {
  address: number;
  name: string;
};

export type nestedNumber = number | nestedNumber[];

export type variableType = {
  address: number;
  name: string;
  size: number;
  dimension: number[];
  value: nestedNumber;
  valueErrorMessage: string;
};

export type parserOutput = {
  variables: variableType[];
  instructions: instructionType[];
  labels: labelType[];
};

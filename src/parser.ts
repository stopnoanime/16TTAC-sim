import ohm from "ohm-js";
import { grammarDefinition } from "./grammar";
import { destinationType, sourceType } from "./instructions";

export class Parser {
  private ohmGrammar: ohm.Grammar;
  private ohmSemantics: ohm.Semantics;

  private variables: variableType[];
  private instructions: instructionType[];
  private labels: labelType[];

  constructor() {
    this.ohmGrammar = ohm.grammar(grammarDefinition);
    this.ohmSemantics = this.ohmGrammar.createSemantics();

    const classThis = this;

    this.ohmSemantics.addOperation("eval", {
      Token_variable(_, name, arrDim, __, value) {
        const arr = arrDim.eval() as number[];
        const isArr = arr.length != 0;

        classThis.variables.push({
          name: name.eval(),
          address: classThis.nextTokenAddress(classThis.variables),
          size: isArr ? arr.reduce((a, c) => (a *= c)) : 1,
          dimension: isArr ? arr : [1], //Treat normal variable as one dimensional array with length 1
          value: value.eval()[0] || 0,
        });
      },

      Token_ins(src, _, dest, f0, f1) {
        const isOperand = src.ctorName != "src";

        classThis.instructions.push({
          source: isOperand ? "op" : src.eval(),
          destination: dest.eval(),
          carry: f0.eval() == "c" || f1.eval() == "c",
          zero: f0.eval() == "z" || f1.eval() == "z",
          address: classThis.nextTokenAddress(classThis.instructions),
          size: isOperand ? 2 : 1,
          ...(isOperand && {
            operandType: src.ctorName == "varName" ? "reference" : "literal",
            operandValue: src.eval(),
          }),
        });
      },

      Token_label(name, _) {
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
        return parseInt(this.sourceString);
      },

      hexLiteral(_, __) {
        return parseInt(this.sourceString, 16);
      },

      charLiteral(_, c, __) {
        return c.sourceString.charCodeAt(0);
      },

      stringLiteral(_, s, __) {
        return [...s.sourceString].map((s) => s.charCodeAt(0));
      },

      _iter(...children) {
        return children.map((c) => c.eval());
      },

      _terminal() {
        return this.sourceString as any;
      },
    });
  }

  public parse(input: string) {
    this.variables = [];
    this.instructions = [];
    this.labels = [];

    const match = this.ohmGrammar.match(input);

    if (match.failed()) return null;

    this.ohmSemantics(match).eval();

    return {
      variables: this.variables,
      instructions: this.instructions,
      labels: this.labels,
    };
  }

  public nextTokenAddress(tokens: { address: number; size: number }[]) {
    return tokens.length == 0 ? 0 : tokens.at(-1).address + tokens.at(-1).size;
  }
}

export type instructionType = {
  source: sourceType;
  destination: destinationType;
  carry: boolean;
  zero: boolean;
  address: number;
  size: number;
  operandType?: "literal" | "reference";
  operandValue?: number | number[] | string;
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
};

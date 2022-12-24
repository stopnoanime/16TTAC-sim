import ohm from "ohm-js";
import { int16_min, uint16_max } from "./common";
import { Grammar } from "./grammar";
import { instructionDictionaryType } from "./instructions";

export class Parser {
  private ohmGrammar: ohm.Grammar;
  private ohmSemantics: ohm.Semantics;

  private variables: variableType[];
  private instructions: instructionType[];
  private labels: labelType[];

  private grammar: Grammar;

  constructor(dictionary?: instructionDictionaryType) {
    this.grammar = new Grammar(dictionary);

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

      Token_ins(src, _, dest, f0, f1) {
        const isOperand = src.ctorName != "src";

        classThis.instructions.push({
          source: isOperand ? "op" : src.eval(),
          destination: dest.eval(),
          carry: f0.eval() == "c" || f1.eval() == "c",
          zero: f0.eval() == "z" || f1.eval() == "z",
          address: classThis.nextTokenAddress(classThis.instructions),
          sourceErrorMessage: src.source.getLineAndColumnMessage(),
          size: isOperand ? 2 : 1,
          ...(isOperand &&
            src.ctorName == "varName" && {
              //Source is a reference to variable
              operandReference: src.eval(),
            }),
          ...(isOperand &&
            src.ctorName != "varName" && {
              //Source is literal value
              operandValue: src.eval(),
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
        return c.sourceString.charCodeAt(0);
      },

      stringLiteral(_, s, __) {
        return [...[...s.sourceString].map((s) => s.charCodeAt(0)), 0];
      },

      flag(s, _) {
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
        return this.sourceString as any;
      },
    });
  }

  public parse(input: string) {
    this.variables = [];
    this.instructions = [];
    this.labels = [];

    const match = this.ohmGrammar.match(input);

    if (match.failed()) throw match.message;

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

  private checkIfNumberOutOfRange(n: number, node: ohm.Node) {
    if (n > uint16_max || n < int16_min)
      throw (
        node.source.getLineAndColumnMessage() +
        `Literal value "${n}" is outside of valid range.`
      );
  }

  private checkIfReferenceAlreadyExists(name: string, node: ohm.Node) {
    if (
      this.variables.find((v) => v.name == name) ||
      this.labels.find((l) => l.name == name)
    )
      throw (
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

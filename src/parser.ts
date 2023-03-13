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

  /**
   * Constructs the parser
   * @param dictionary Optional dictionary to use instead of the default one
   */
  constructor(dictionary?: instructionDictionaryType) {
    this.grammar = new Grammar(dictionary);
    this.instr = new Instructions(dictionary);

    this.ohmGrammar = ohm.grammar(this.grammar.grammarDefinition);
    this.ohmSemantics = this.ohmGrammar.createSemantics();

    const classThis = this;

    // Add operations to the grammar
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
          sourceStart: this.source.startIdx,
          sourceEnd: this.source.endIdx,
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
          sourceStart: this.source.startIdx,
          sourceEnd: this.source.endIdx,
        });
      },

      Token_label(name, _) {
        classThis.checkIfReferenceAlreadyExists(name.eval(), name);

        classThis.labels.push({
          name: name.eval(),
          address: classThis.nextTokenAddress(classThis.instructions),
          sourceStart: this.source.startIdx,
          sourceEnd: this.source.endIdx,
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
        return eval(`'\\${s.sourceString}'`);
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

  /**
   * Parses given code
   * @param input The code to parse
   * @returns variables, instructions and labels from source code
   */
  public parse(input: string): parserOutput {
    this.variables = [];
    this.instructions = [];
    this.labels = [];

    const match = this.ohmGrammar.match(input);

    if (match.failed())
      throw new ParserError(
        match.message,
        (match as any).getRightmostFailurePosition()
      );

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

  /** Throws error if number is outside uint16 range */
  private checkIfNumberOutOfRange(n: number, node: ohm.Node) {
    if (n > uint16_max || n < int16_min)
      throw new ParserError(
        node.source.getLineAndColumnMessage() +
          `Literal value "${n}" is outside of valid range.`,
        node.source.startIdx
      );
  }

  /** Throws error if reference with name is already declared (there is another var or label with the same name) */
  private checkIfReferenceAlreadyExists(name: string, node: ohm.Node) {
    if (
      this.variables.find((v) => v.name == name) ||
      this.labels.find((l) => l.name == name)
    )
      throw new ParserError(
        node.source.getLineAndColumnMessage() +
          `Reference with name "${name}" is already defined.`,
        node.source.startIdx
      );
  }
}

export class ParserError extends Error {
  sourcePosition: number;

  constructor(message: string, sourcePosition: number) {
    super(message);
    this.name = this.constructor.name;
    this.sourcePosition = sourcePosition;
  }
}

export type parserTokenType = {
  address: number;
  sourceStart: number;
  sourceEnd: number;
};

export type nestedNumber = number | nestedNumber[];

export type instructionType = parserTokenType & {
  source: string;
  destination: string;
  carry: boolean;
  zero: boolean;
  size: number;
  sourceErrorMessage: string;
  operandReference?: string;
  operandValue?: number;
};

export type labelType = parserTokenType & {
  name: string;
};

export type variableType = parserTokenType & {
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

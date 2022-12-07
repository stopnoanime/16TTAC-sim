import ohm from 'ohm-js';
import { grammarDefinition } from './grammar'

const variables: variableType[] = [];


const myGrammar = ohm.grammar(grammarDefinition);
const m = myGrammar.match(String.raw`

  char name1
  char name2 = -100
  word name3 = 0xFFFF
  char name4 = 'a'
  word name5 = "b"

`);
const s = myGrammar.createSemantics();

s.addOperation('eval', {
  Token_variable(type, name, arrDim, _, value) {
    variables.push({
      name: name.eval(),
      address: variables.length == 0 ? 0 : variables.at(-1).address + variables.at(-1).size,
      size: type.eval() == "char" ? 1 : 2,
      value: value.eval()[0] || [0]
    })
  },

  varName(_, __) {
    return this.sourceString
  },

  number(_, __) {
    return [parseInt(this.sourceString)]
  },

  hexLiteral(_, __) {
    return [parseInt(this.sourceString, 16)]
  },

  charLiteral(_, c, __) {
    return [c.sourceString.charCodeAt(0)]
  },

  stringLiteral(_, s, __) {
    return [...s.sourceString].map(s => s.charCodeAt(0))
  },

  _iter(...children) {
    return children.map(c => c.eval());
  },

  _terminal() {
    return this.sourceString as any;
  }
})

if (m.succeeded()) {
  console.log('Good Match');
  s(m).eval()
  console.log(variables)
} else {
  console.log("Bad Match");
}

type sourceType = "acc" | "adr" | "mem" | "op"
type destinationType = "acc" | "adr" | "mem" | "plus" | "minus" | "carry" | "zero"

type instructionType = {
  source: sourceType,
  destination: destinationType,
  carry: boolean,
  zero: boolean,
  address: number,
  size: number,
  operandValue: number,
}

type labelType = {
  address: number,
  name: string
}

type variableType = {
  address: number,
  name: string,
  size: number,
  value: number[],
}
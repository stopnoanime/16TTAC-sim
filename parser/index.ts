import ohm from 'ohm-js';
import { grammarDefinition } from './grammar'

const variables: variableType[] = [];
const instructions: instructionType[] = [];
const labels: labelType[] = [];

const myGrammar = ohm.grammar(grammarDefinition);
const m = myGrammar.match(String.raw`

  word name1
  word name2 = -100
  word name3 = 0xFFFF
  word name4 = 'a'
  word name5[10] = "abc"
  word name5[3][10] = [0, "abc", [0xff, 'a', 4]]

  label0:
  acc => mem
  adr => acc c
  "abc" => acc z
  0xff => acc z
  label1:
  label0 => adr c z
`);
const s = myGrammar.createSemantics();

s.addOperation('eval', {
  Token_variable(_, name, arrDim, __, value) {
    const arr = arrDim.eval() as number[]
    const isArr = arr.length != 0

    variables.push({
      name: name.eval(),
      address: variables.length == 0 ? 0 : variables.at(-1).address + variables.at(-1).size,
      size: isArr ? arr.reduce((a,c) => a *= c) : 1,
      dimension: isArr ? arr : [1], //Treat normal variable as one dimensional array with length 1
      value: value.eval()[0] || 0
    })
  },

  Token_ins(src, _, dest, f0, f1) {
    const isOperand = src.ctorName != 'src'

    instructions.push({
      source: isOperand ? 'op' : src.eval(),
      destination: dest.eval(),
      carry: (f0.eval() == 'c' || f1.eval() == 'c'),
      zero: (f0.eval() == 'z' || f1.eval() == 'z'),
      address: instructions.length == 0 ? 0 : instructions.at(-1).address + instructions.at(-1).size,
      size: isOperand ? 2 : 1,
      ...(isOperand && { 
        operandType: src.ctorName == 'varName' ? 'reference' : 'literal',
        operandValue: src.eval()
      }),
    })
  },

  Token_label(name, _) {
    labels.push({
      name: name.eval(),
      address:  instructions.length == 0 ? 0 : instructions.at(-1).address + instructions.at(-1).size,
    })
  },

  ArrDim(_,dim,__) {
    return dim.children.map(c => c.eval());
  },

  ArrLiteral_array(_, arr, __) {
    return arr.asIteration().children.map((c: any) => c.eval())
  },

  varName(_, __) {
    return this.sourceString
  },

  number(_, __) {
    return parseInt(this.sourceString)
  },

  hexLiteral(_, __) {
    return parseInt(this.sourceString, 16)
  },

  charLiteral(_, c, __) {
    return c.sourceString.charCodeAt(0)
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
  console.log(instructions)
  console.log(labels)
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
  operandType?: 'literal' | 'reference',
  operandValue?: number | number[] | string,
}

type labelType = {
  address: number,
  name: string
}

type nestedNumber = number | nestedNumber[]

type variableType = {
  address: number,
  name: string,
  size: number,
  dimension: number[],
  value: nestedNumber,
}
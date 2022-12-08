import ohm from 'ohm-js';
import { grammarDefinition } from './grammar'

const sourceToVal: {[k in sourceType]: number}= {
  acc: 0,
  adr: 1,
  mem: 2,
  op: 3,
}

const destinationToVal: {[k in destinationType]: number}= {
  acc: 0,
  adr: 1,
  mem: 2,
  plus: 3,
  minus: 4,
  carry: 5,
  zero: 6,
}

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
  word name6[3][10] = [3, "abc", ['a', 4]]

  label0:
  acc => mem
  adr => acc c
  "abc" => acc z
  0xff => acc z
  name6 => adr
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
  console.log(secondPass());
} else {
  console.log("Bad Match");
}
 
function secondPass() {
  const output: number[] = [];

  const variablesOffset = instructions.length == 0 ? 0 : instructions.at(-1).address + instructions.at(-1).size;

  instructions.forEach(ins => {
    output.push((sourceToVal[ins.source] << 9) + (destinationToVal[ins.destination] << 2) + (ins.carry ? 2 : 0) + (ins.zero ? 1 : 0))

    if(ins.source != 'op') return

    if(ins.operandType == 'reference') output.push(getReferenceAddress(ins.operandValue as string, variablesOffset))
    else output.push(getVariableValueAtPosition([1], ins.operandValue as nestedNumber))
  })

  variables.forEach(vr => {
    // @ts-ignore
    output.push(...getVariableSubArray([], vr.dimension, vr.value).flat(Infinity))
  })

  return output
}

function getVariableSubArray(dimBefore: number[], dim: number[], value: nestedNumber): nestedNumber[] {
  if(dim.length == 1) return Array.from(Array(dim[0])).map((_,i) => getVariableValueAtPosition([...dimBefore, i], value));
  else return Array.from(Array(dim[0])).map((_,i)=> getVariableSubArray([...dimBefore, i], dim.slice(1), value));
}

function getVariableValueAtPosition(pos: number[], value: nestedNumber): number {
  if(Array.isArray(value)) {
    if(pos.length == 0) throw "Array initialization value is too deep for array structure"

    const pop = pos.shift();
    if(pop >= value.length) return 0 //If element position is array is larger than given initial value size, default to 0
    
    return getVariableValueAtPosition(pos, value[pop])
  } else return value // value is number
}

function getReferenceAddress(name: string, variablesOffset: number) {
  const foundLabel = labels.find(v => v.name == name)
  
  if(foundLabel) return foundLabel.address
  
  const foundVar = variables.find(v => v.name == name)

  if(!foundVar) throw "reference not found"
  
  return foundVar.address + variablesOffset
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
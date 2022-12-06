import ohm from 'ohm-js';
import { grammarDefinition } from './grammar'

const myGrammar = ohm.grammar(grammarDefinition);
const m = myGrammar.match(String.raw`char name1 = "abc \" cba"`);
const s = myGrammar.createSemantics();
s.addOperation('eval', {
  // @ts-ignore
  Token_variable(type, name, arrDim, _, value) {
    console.log(value.eval())
  },

  // @ts-ignore
  stringLiteral(_, s, __) {
    return s.sourceString
  },
  
  _iter(...children) {
    return children.map(c => c.eval());
  }
})

if (m.succeeded()) {
  console.log('Good Match');
  s(m).eval()
} else {
  console.log("Bad Match");
}
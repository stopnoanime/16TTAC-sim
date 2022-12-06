import ohm from 'ohm-js';
import { grammarDefinition } from './grammar'

const myGrammar = ohm.grammar(grammarDefinition);

const m = myGrammar.match(String.raw`char name1 = "abc \" cba"`);
if (m.succeeded()) {
  console.log('Good Match');
} else {
  console.log("Bad Match");
}
import ohm from 'ohm-js';
import { grammarDefinition } from './grammar'

const myGrammar = ohm.grammar(grammarDefinition);

const m = myGrammar.match(`char name1 = 'a'`);
if (m.succeeded()) {
  console.log('Good Match');
} else {
  console.log("Bad Match");
}
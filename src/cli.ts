import { Compiler } from "./compiler";
import { Sim } from "./sim";
const compiler = new Compiler();

const output = compiler.compile(String.raw`
  // word string[15] = "Hello World!"
  // word stringPos = 0
  // word size = 12

  // loop:
  //     string => acc
  //     stringPos => adr
  //     mem => plus

  //     acc => adr
  //     mem => out

  //     stringPos => adr
  //     mem => acc
  //     1 => plus
  //     acc => mem

  //     size => adr
  //     mem => minus
  //     end => pc z

  //     loop => pc

  // end:
  //     end => pc

  100 => out
  100 => out_num 
`);

console.log(output);

function outRaw(n: number) {
  console.log(String.fromCharCode(n));
}

function outInt(n: number) {
  console.log(n);
}

const sim = new Sim({ outputRawCallback: outRaw, outputIntCallback: outInt });

sim.initializeMemory(output);

for (let i = 0; i < 200; i++) {
  sim.singleStep();
}

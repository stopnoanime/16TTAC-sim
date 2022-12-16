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

  5 => push
  10 => push
  5 => acc
  pop => mul

  acc => out_num

  acc => halt



`);

console.log(output);

function outRaw(n: number) {
  console.log(String.fromCharCode(n));
}

function outInt(n: number) {
  console.log(n);
}

const input = [97];

function inAvil() {
  return input.length > 0;
}

function inp() {
  return input.pop();
}

let running = true;

function halt() {
  console.log("halting");
  running = false;
}

const sim = new Sim({
  outputRawCallback: outRaw,
  outputIntCallback: outInt,
  inputAvailableCallback: inAvil,
  inputRawCallback: inp,
  haltCallback: halt,
});

sim.initializeMemory(output);

while (running) {
  sim.singleStep();
}

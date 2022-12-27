import { Compiler } from "./compiler";
import { Sim } from "./sim";

import { defaultInstructionDictionary } from "./instructions";

const newins = defaultInstructionDictionary.slice();
newins.push({
  type: "source",
  name: "ACC2",
  implementation() {
    return 2;
  },
});

const compiler = new Compiler(newins);

const output = compiler.compile(String.raw`
1545 => PUSH
output_number => CALL

ACC => HALT

output_number:
  POP => ACC
  POP => ADR
  ACC => PUSH
  ADR => ACC
  0 => PUSH
  
  output_number_loop:
    10 => MOD
    0 => CARRY
    '0' => PLUS
    ACC => PUSH

    ADR => ACC
    10 => DIV
    ACC => ADR
    
  output_number_out => PC z
  output_number_loop => PC
  
  output_number_out:
    POP => ACC
    POP => PC z
    ACC => OUT
  output_number_out => PC

`);

console.log(output);

function outRaw(n: number) {
  console.log(String.fromCharCode(n));
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

const sim = new Sim(
  {
    outputRawCallback: outRaw,
    inputAvailableCallback: inAvil,
    inputRawCallback: inp,
    haltCallback: halt,
  },
  newins
);

sim.initializeMemory(output);

while (running) {
  sim.singleStep();
}

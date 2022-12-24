import { Compiler } from "./compiler";
import { Sim } from "./sim";

import { defaultInstructionDictionary } from "./instructions";

const newins = defaultInstructionDictionary.slice();
newins.push({
  type: "source",
  name: "acc2",
  implementation() {
    return 2;
  },
});

const compiler = new Compiler(newins);

const output = compiler.compile(String.raw`
word arr[4][2] = [[100,3],100,100,"a"]
'a' => acc

acc => push

output_number => call
acc => halt

output_number:
  pop => acc
  pop => adr
  acc => push
  adr => acc

  0 => push

  output_number_loop:
    10 => mod
    0 => carry
    '0' => plus
    acc => push

    adr => acc
    10 => div
    acc => adr

  output_number_out => pc z
  output_number_loop => pc

  output_number_out:
    pop => acc
    pop => pc z
    acc => out
  output_number_out => pc
  acc => halt

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

import { Compiler } from "./compiler";
import { Sim } from "./sim";
const compiler = new Compiler();

const output = compiler.compile(String.raw`
-2 => acc
-1 => mul
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

const sim = new Sim({
  outputRawCallback: outRaw,
  inputAvailableCallback: inAvil,
  inputRawCallback: inp,
  haltCallback: halt,
});

sim.initializeMemory(output);

while (running) {
  sim.singleStep();
}

import { Parser } from "../src/parser";
import { Compiler } from "../src/compiler";
import { Sim } from "../src/sim";

const parser = new Parser();
const compiler = new Compiler();

it("Initializes memory", () => {
  const sim = new Sim({});
  sim.initializeMemory(new Uint16Array([10, 11, 12, 13]));

  expect(sim.memory).toMatchObject({ 0: 10, 1: 11, 2: 12, 3: 13 });
});

it("Simulates output", () => {
  const outBuff: number[] = [];
  const sim = new Sim({
    outputRawCallback: (n) => {
      outBuff.push(n);
    },
  });
  sim.initializeMemory(
    compiler.compile(parser.parse(String.raw`1 => OUT 3000 => OUT`))
  );
  sim.singleStep();
  sim.singleStep();

  expect(outBuff).toEqual([1, 3000]);
});

it("Simulates input", () => {
  const inBuff: number[] = [10, 200, 3000];
  const sim = new Sim({
    inputRawCallback: () => {
      return inBuff.shift() as number;
    },
    inputAvailableCallback: () => {
      return inBuff.length > 0;
    },
  });
  sim.initializeMemory(
    compiler.compile(parser.parse(String.raw`IN => PUSH IN => PUSH IN => PUSH`))
  );
  sim.singleStep();
  sim.singleStep();
  sim.singleStep();

  expect(sim.stack).toMatchObject({ 0: 10, 1: 200, 2: 3000, 3: 0 });
});

it("Simulates halt", () => {
  let halted = false;
  const sim = new Sim({
    haltCallback: () => {
      halted = true;
    },
  });
  sim.initializeMemory(compiler.compile(parser.parse(String.raw`ACC => HALT`)));
  sim.singleStep();

  expect(halted).toBe(true);
});

it("Simulates complicated program", () => {
  let halted = false;
  const outBuff: number[] = [];
  const sim = new Sim({
    outputRawCallback: (n) => {
      outBuff.push(n);
    },
    haltCallback: () => {
      halted = true;
    },
  });
  sim.initializeMemory(
    compiler.compile(
      parser.parse(String.raw`
    15459 => PUSH
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
      output_number_out => PC`)
    )
  );

  while (!halted) sim.singleStep();

  expect(outBuff).toEqual([
    "1".charCodeAt(0),
    "5".charCodeAt(0),
    "4".charCodeAt(0),
    "5".charCodeAt(0),
    "9".charCodeAt(0),
  ]);
});

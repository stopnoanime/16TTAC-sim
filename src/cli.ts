import { Compiler } from "./compiler";
import { Sim } from "./sim";
import { Parser } from "./parser";
import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

const parser = new Parser();
const compiler = new Compiler();
const program = new Command();

const inputBuffer: number[] = [];
let simRunning = false;
const sim = new Sim({
  outputRawCallback: (n) => {
    if (n == 0x7f)
      //Backspace
      process.stdout.write("\b \b");
    else if (n == 0x0d || n == 0x0a)
      //CR
      process.stdout.write("\n");
    else process.stdout.write(String.fromCharCode(n));
  },
  inputAvailableCallback: () => inputBuffer.length > 0,
  inputRawCallback: () => inputBuffer.shift(),
  haltCallback: () => {
    console.log("\n\nHalting");
    simRunning = false;
  },
  badInsCallback: (adr) => console.warn("Bad instruction at address: ", adr),
});

function stepSim() {
  for (let i = 0; i < 1_000_000; i++) {
    sim.singleStep();
    if (!simRunning) return;
  }

  setTimeout(stepSim); //Set timeout allows for input handling code to run
}

function runSim() {
  process.stdin.setRawMode(true);
  process.stdin.on("data", (data) => {
    for (const d of data) {
      if (d == 3) process.exit(); // ctrl-c
      else inputBuffer.push(d);
    }
  });

  simRunning = true;
  stepSim();
  process.exit();
}

program.name("16TTAC-sim").description("Simulator and compiler for the 16TTAC");

program.argument("<source>", "Source file to run").action(async (source) => {
  const sourceCode = await fs.readFile(source, { encoding: "utf8" });
  sim.initializeMemory(compiler.compile(parser.parse(sourceCode)));

  runSim();
});

program
  .command("compile")
  .argument("<source>", "Source file to compile")
  .argument("[binary]", "File to write binary output to")
  .action(async (source, output) => {
    const sourceCode = await fs.readFile(source, { encoding: "utf8" });
    const outputName =
      output ||
      path.join(
        path.dirname(source),
        path.basename(source, path.extname(source)) + ".bin"
      );
    fs.writeFile(outputName, compiler.compile(parser.parse(sourceCode)));
  });

program
  .command("run")
  .argument("<binary>", "Binary file to run")
  .action(async (binary) => {
    const loadedBuffer = await fs.readFile(binary);
    sim.initializeMemory(
      new Uint16Array(
        loadedBuffer.buffer,
        loadedBuffer.byteOffset,
        loadedBuffer.length / 2
      )
    );

    runSim();
  });

program.parse();

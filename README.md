# 16TTAC-sim

A compiler and simulator written in Ts for a imaginary 16bit
[Transport Triggered Architecture](https://en.wikipedia.org/wiki/Transport_triggered_architecture) CPU.

# The CPU

- Up to 128 sources and destinations each
- Accumulator and Address registers
- 16 bit fixed width instruction, with optional 16 bit operand
- 64 kiloword, or 128KB RAM size
- 256 word stack
- Carry and Zero flags
- Conditional execution using Carry and Zero flags
- Halting support
- Built in IO support

### Instruction structure:

- bits 15-9 - source
- bits 8-2 - destination
- bit 1 - if set, instruction is only executed if carry flag is set
- bit 0 - if set, instruction is only executed if zero flag is set

### Sources and destinations:

All sources and destinations are completely customizable, but you can look [here](docs/src-dest.md) to see the descriptions of all of them that are available by default.

# The assembly language

Here is a small code snippet that should explain the whole syntax:

```
//Comments are single line

//Some example variable declarations:
word var = 123
word var2 = 0x5
word string[10] = "hello"
word string2[10] = [09,98,'c']
word MUL_ARR[10][2] = [[0,1], [2,3], "a"]

//Some example instructions:
SOURCE => DESTINATION
SOURCE => DESTINATION c //Executes only if carry flag is set
SOURCE => DESTINATION z //Executes only if zero flag is set
SOURCE => DESTINATION c z //Executes only if carry and zero flag is set

//Source can also be a constant value, provided by operand
123 => DESTINATION
0xFFFF => DESTINATION
'a' => DESTINATION

//They also can be a reference to a variable
string => ADR

//Labels:
label:
123 => ACC
another_label:
string => PUSH
```

# The Toolchain

The toolchain is written in TS, it is made to work both in web and node.
It also works as a standalone tool that you can use with npx.

# Using 16TTAC-sim as a npx tool

```
$ npx 16ttac-sim -h
$ npx 16ttac-sim examples/numbers.txt
```

# Using 16TTAC-sim as a library

```
$ npm i 16ttac-sim

//Include the required files...

const parser = new Parser();
const compiler = new Compiler();
const program = new Command();

let simRunning = true;
const sim = new Sim({
  haltCallback: () => {
    console.log("\n\nHalting");
    simRunning = false;
  }
});

sim.initializeMemory(compiler.compile(parser.parse(sourceCode)));

while(simRunning) sim.singleStep();
```

For more complicated examples with IO, look at [cli.ts](src/cli.ts) and [sim.test.ts](tests/sim.test.ts).

# Adding your own instructions

The main advantage of Transport Triggered Architecture is the ease of adding custom instructions, to do so you can extend the [defaultInstructionDictionary](src/instructionDictionary.ts)
or you can create your own dictionary.

### Important:

A dictionary needs one source with `isOperand` set for the toolchain to work correctly.

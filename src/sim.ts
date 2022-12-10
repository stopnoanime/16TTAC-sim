import { destinationToVal, sourceToVal } from "./instructions";

// To do:
// Carry,Zero flags
// Bound registers to their 16 bit range

export class Sim {
  private memory: Uint16Array;

  private acc: number;
  private adr: number;
  private pc: number;
  private carry: boolean;
  private zero: boolean;

  constructor(MEM_SIZE = 65536) {
    this.memory = new Uint16Array(MEM_SIZE);
    this.reset();
  }

  public initializeMemory(array: Uint16Array) {
    this.memory.fill(0);
    this.memory.set(array);
  }

  public reset() {
    this.acc = 0;
    this.adr = 0;
    this.pc = 0;
    this.carry = false;
    this.zero = false;
  }

  public singleStep() {
    const rawIns = this.memory.at(this.pc);
    const ins = this.decodeInstruction(rawIns);

    const sourceValue = this.getSourceValue(ins.source);

    this.pc++;

    if (!ins.zero || this.zero)
      this.writeToDestination(ins.destination, sourceValue);
  }

  private decodeInstruction(ins: number) {
    return {
      source: (ins >>> 9) & 127,
      destination: (ins >>> 2) & 127,
      carry: (ins >>> 1) & 1,
      zero: ins & 1,
    };
  }

  private getSourceValue(source: number) {
    switch (source) {
      case sourceToVal.acc:
        return this.acc;

      case sourceToVal.adr:
        return this.adr;

      case sourceToVal.mem:
        return this.memory[this.adr];

      case sourceToVal.op:
        this.pc++;
        return this.memory[this.pc];
    }
  }

  private writeToDestination(destination: number, value: number) {
    switch (destination) {
      case destinationToVal.acc:
        this.acc = value;
        this.zero = this.acc == 0;
        break;

      case destinationToVal.adr:
        this.adr = value;
        break;

      case destinationToVal.mem:
        this.memory[this.adr] = value;
        break;

      case destinationToVal.plus:
        this.acc += value;
        this.zero = this.acc == 0;
        break;

      case destinationToVal.minus:
        this.acc -= value;
        this.zero = this.acc == 0;
        break;

      case destinationToVal.out:
        console.log(String.fromCharCode(value));
        break;

      case destinationToVal.pc:
        this.pc = value;
        break;
    }
  }
}

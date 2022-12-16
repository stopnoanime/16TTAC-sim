import { destinationToVal, sourceToVal } from "./instructions";

export class Sim {
  public outputRawCallback: outputRawCallbackType;
  public outputIntCallback: outputIntCallbackType;
  public inputRawCallback: inputRawCallbackType;
  public inputAvailableCallback: inputAvailableCallbackType;
  public haltCallback: haltCallbackType;

  private memory: Uint16Array;
  private stack: Uint16Array;
  private stackPointer: number;

  private acc: number;
  private adr: number;
  private pc: number;
  private carry: boolean;
  private zero: boolean;

  private static u16_max = 65536;
  private static stack_size = 256;

  constructor(options: SimConstructorOptions) {
    this.memory = new Uint16Array(Sim.u16_max);
    this.stack = new Uint16Array(Sim.stack_size);

    this.outputRawCallback = options.outputRawCallback;
    this.outputIntCallback = options.outputIntCallback;
    this.inputRawCallback = options.inputRawCallback;
    this.inputAvailableCallback = options.inputAvailableCallback;
    this.haltCallback = options.haltCallback;

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
    this.stackPointer = 0;
    this.carry = false;
    this.zero = true;
  }

  public singleStep() {
    const rawIns = this.memory.at(this.pc);
    const ins = this.decodeInstruction(rawIns);

    const sourceValue = this.getSourceValue(ins.source);

    if (sourceValue === null) return; //Don't execute instruction if source is not yet available

    this.pc++;

    if ((!ins.zero || this.zero) && (!ins.carry || this.carry))
      this.writeToDestination(
        ins.destination,
        sourceValue,
        ins.source == sourceToVal.op
      );

    this.limitRegistersTo16Bits();
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

      case sourceToVal.in:
        if (!this.inputAvailableCallback?.()) return null;

        return this.inputRawCallback?.() || 0;

      case sourceToVal.in_avail:
        return this.inputAvailableCallback?.() ? 0xffff : 0;

      case sourceToVal.pop:
        this.stackPointer =
          this.stackPointer == 0 ? Sim.stack_size - 1 : this.stackPointer - 1;
        return this.stack[this.stackPointer];

      default:
        return 0;
    }
  }

  private writeToDestination(
    destination: number,
    value: number,
    sourceIsOp: boolean
  ) {
    switch (destination) {
      case destinationToVal.acc:
        this.acc = value;
        break;

      case destinationToVal.adr:
        this.adr = value;
        break;

      case destinationToVal.mem:
        this.memory[this.adr] = value;
        break;

      case destinationToVal.plus:
        this.acc += value + (this.carry ? 1 : 0);
        this.carry = this.acc >= Sim.u16_max;
        break;

      case destinationToVal.minus:
        this.acc -= value + (this.carry ? 1 : 0);
        this.carry = this.acc < 0;
        break;

      case destinationToVal.carry:
        this.carry = value != 0;
        break;

      case destinationToVal.zero:
        this.zero = value != 0;
        break;

      case destinationToVal.out:
        this.outputRawCallback?.(value);
        break;

      case destinationToVal.out_num:
        this.outputIntCallback?.(value);
        break;

      case destinationToVal.pc:
        this.pc = value;
        break;

      case destinationToVal.halt:
        this.pc -= sourceIsOp ? 2 : 1;
        this.haltCallback();
        break;

      case destinationToVal.shift_l:
        if (value >= 32) this.acc = 0; //Js shift overflows if above 32
        else this.acc <<= value;
        break;

      case destinationToVal.shift_r:
        if (value >= 32) this.acc = 0; //Js shift overflows if above 32
        else this.acc >>>= value;
        break;

      case destinationToVal.mul:
        this.acc *= value;
        this.carry = this.acc >= Sim.u16_max;
        break;

      case destinationToVal.div:
        this.acc /= value;
        break;

      case destinationToVal.mod:
        this.acc %= value;
        this.zero = this.acc == 0;
        break;

      case destinationToVal.push:
        this.stack[this.stackPointer] = value;
        this.stackPointer = ++this.stackPointer % Sim.stack_size;
    }
  }

  private limitRegistersTo16Bits() {
    this.acc = this.uint16(this.acc);
    this.zero = this.acc == 0;
    this.pc = this.uint16(this.pc);
  }

  private uint16(n: number) {
    return n & 0xffff;
  }
}

type SimConstructorOptions = Partial<{
  outputRawCallback: outputRawCallbackType;
  outputIntCallback: outputIntCallbackType;
  inputRawCallback: inputRawCallbackType;
  inputAvailableCallback: inputAvailableCallbackType;
  haltCallback: haltCallbackType;
}>;

export type outputRawCallbackType = (n: number) => void;
export type outputIntCallbackType = (n: number) => void;
export type inputRawCallbackType = () => number;
export type inputAvailableCallbackType = () => boolean;
export type haltCallbackType = () => void;

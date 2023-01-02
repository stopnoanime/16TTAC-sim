import { stack_size, uint16_max } from "./common.js";
import { instructionDictionaryType, Instructions } from "./instructions.js";

export class Sim {
  public outputRawCallback: outputRawCallbackType;
  public inputRawCallback: inputRawCallbackType;
  public inputAvailableCallback: inputAvailableCallbackType;
  public haltCallback: haltCallbackType;
  public badInsCallback: badInsCallbackType;

  public memory: Uint16Array;
  public stack: Uint16Array;
  public stackPointer: number;

  public acc: number;
  public adr: number;
  public pc: number;
  public carry: boolean;
  public zero: boolean;

  private instructions: Instructions;

  constructor(
    options: SimConstructorOptions,
    dictionary?: instructionDictionaryType
  ) {
    this.instructions = new Instructions(dictionary);

    this.memory = new Uint16Array(uint16_max + 1);
    this.stack = new Uint16Array(stack_size);

    this.outputRawCallback = options.outputRawCallback;
    this.inputRawCallback = options.inputRawCallback;
    this.inputAvailableCallback = options.inputAvailableCallback;
    this.haltCallback = options.haltCallback;
    this.badInsCallback = options.badInsCallback;

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

    if ((!ins.zero || this.zero) && (!ins.carry || this.carry)) {
      const sourceImplementation =
        this.instructions.sourceOpcodeToImplementation[ins.source];
      const destinationImplementation =
        this.instructions.destinationOpcodeToImplementation[ins.destination];

      //If source or destination is bad, skip this instruction
      if (!sourceImplementation || !destinationImplementation) {
        this.badInsCallback?.(this.pc);
        this.pc++;
        return;
      }

      const sourceValue = sourceImplementation?.call(this);

      if (sourceValue === null) return; //Don't execute instruction if source is not yet available

      this.pc++;

      destinationImplementation?.call(this, sourceValue, ins.length);
    } else {
      this.pc += ins.length;
    }

    this.limitRegistersTo16Bits();
  }

  public pop() {
    this.stackPointer =
      this.stackPointer == 0 ? stack_size - 1 : this.stackPointer - 1;
    return this.stack[this.stackPointer];
  }

  public push(n: number) {
    this.stack[this.stackPointer] = n;
    this.stackPointer = ++this.stackPointer % stack_size;
  }

  private decodeInstruction(ins: number) {
    return {
      source: (ins >>> 9) & 127,
      destination: (ins >>> 2) & 127,
      carry: (ins >>> 1) & 1,
      zero: ins & 1,
      length:
        ((ins >>> 9) & 127) == this.instructions.sourceOperandOpcode ? 2 : 1,
    };
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
  inputRawCallback: inputRawCallbackType;
  inputAvailableCallback: inputAvailableCallbackType;
  haltCallback: haltCallbackType;
  badInsCallback: badInsCallbackType;
}>;

export type outputRawCallbackType = (n: number) => void;
export type inputRawCallbackType = () => number;
export type inputAvailableCallbackType = () => boolean;
export type haltCallbackType = () => void;
export type badInsCallbackType = (adr: number) => void;

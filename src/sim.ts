import { stack_size, uint16_max } from "./common.js";
import { instructionDictionaryType, Instructions } from "./instructions.js";

export class Sim {
  public callbacks: SimCallbacks;

  public memory: Uint16Array;

  public acc: number;
  public adr: number;
  public led: number;
  public pc: number;
  public carry: boolean;
  public zero: boolean;
  public setZero: boolean;

  public stack: Uint16Array;
  public stackPointer: number;

  private instructions: Instructions;

  /**
   * Constructs the sim
   * @param callbacks Objects with sim callbacks, used for features like I/O or halting
   * @param dictionary Optional dictionary to use instead of the default one
   */
  constructor(callbacks: SimCallbacks, dictionary?: instructionDictionaryType) {
    this.instructions = new Instructions(dictionary);

    this.memory = new Uint16Array(uint16_max + 1);
    this.stack = new Uint16Array(stack_size);

    this.callbacks = { ...callbacks };

    this.reset();
  }

  /** Initializes memory from given array */
  public initializeMemory(array: Uint16Array) {
    this.memory.fill(0);
    this.memory.set(array);
  }

  /** Resets the CPU */
  public reset() {
    this.acc = 0;
    this.adr = 0;
    this.led = 0;
    this.pc = 0;
    this.stackPointer = 0;
    this.carry = false;
    this.zero = true;
    this.setZero = false;
  }

  /** Single steps the CPU */
  public singleStep() {
    const rawIns = this.memory.at(this.pc);
    const ins = this.decodeInstruction(rawIns);

    // If conditions to execute instruction are met
    if ((!ins.zero || this.zero) && (!ins.carry || this.carry)) {
      const sourceImplementation =
        this.instructions.sourceOpcodeToImplementation[ins.source];
      const destinationImplementation =
        this.instructions.destinationOpcodeToImplementation[ins.destination];

      if (!sourceImplementation || !destinationImplementation)
        this.callbacks.badInsCallback?.(this.pc);

      const sourceValue = sourceImplementation?.call(this);

      if (sourceValue === null) return; //Don't execute instruction if source is not yet available

      this.pc++;

      destinationImplementation?.call(this, sourceValue || 0, ins.length);
    } else {
      this.pc += ins.length;
    }

    this.limitRegistersTo16Bits();
  }

  /** Pops a value from stack and returns it */
  public pop() {
    this.stackPointer =
      this.stackPointer == 0 ? stack_size - 1 : this.stackPointer - 1;
    return this.stack[this.stackPointer];
  }

  /** Pushes a value onto the stack */
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

  /** Limits register value to uint16 range and also sets zero flag */
  private limitRegistersTo16Bits() {
    this.acc = this.uint16(this.acc);
    this.zero = this.acc == 0 || this.setZero;
    this.setZero = false;

    this.pc = this.uint16(this.pc);
  }

  private uint16(n: number) {
    return n & 0xffff;
  }
}

type SimCallbacks = Partial<{
  outputRawCallback: outputCallbackType;
  outputAvailableCallback: availableCallbackType;

  inputRawCallback: inputCallbackType;
  inputAvailableCallback: availableCallbackType;

  ledCallback: outputCallbackType;

  haltCallback: outputCallbackType;
  badInsCallback: outputCallbackType;
}>;

export type outputCallbackType = (n: number) => void;
export type inputCallbackType = () => number;
export type availableCallbackType = () => boolean;

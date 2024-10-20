import { instructionDictionaryType } from "./instructions";
import { uint16_max } from "./common.js";

export const defaultInstructionDictionary: instructionDictionaryType = [
  {
    type: "source",
    name: "NULL",
    implementation: function () {
      return 0;
    },
  },
  {
    type: "source",
    name: "ACC",
    implementation: function () {
      return this.acc;
    },
  },
  {
    type: "source",
    name: "TRUE",
    implementation: function () {
      return 0xffff;
    },
  },
  {
    type: "source",
    name: "OP",
    isOperand: true,
    implementation: function () {
      return this.memory[++this.pc];
    },
  },
  {
    type: "source",
    name: "ADR",
    implementation: function () {
      return this.adr;
    },
  },
  {
    type: "source",
    name: "MEM",
    implementation: function () {
      return this.memory[this.adr];
    },
  },
  {
    type: "source",
    name: "PC",
    implementation: function () {
      return this.pc + 1;
    },
  },
  {
    type: "source",
    name: "POP",
    implementation: function () {
      return this.pop();
    },
  },
  {
    type: "source",
    name: "IN",
    implementation: function () {
      if (!this.callbacks.inputAvailableCallback?.()) return null;

      return this.callbacks.inputRawCallback?.() || 0;
    },
  },
  {
    type: "source",
    name: "IN_AV",
    implementation: function () {
      return this.callbacks.inputAvailableCallback?.() ? 0xffff : 0;
    },
  },
  {
    type: "source",
    name: "OUT_AV",
    implementation: function () {
      return this.callbacks.outputAvailableCallback?.() ? 0xffff : 0;
    },
  },
  {
    type: "source",
    name: "LED",
    implementation: function () {
      return this.led;
    },
  },

  {
    type: "destination",
    name: "NULL",
    implementation: function (n) {},
  },
  {
    type: "destination",
    name: "ACC",
    implementation: function (n) {
      this.acc = n;
    },
  },
  {
    type: "destination",
    name: "ADD",
    implementation: function (n) {
      this.acc += n;
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "ADDC",
    implementation: function (n) {
      this.acc += n + (this.carry ? 1 : 0);
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "SUB",
    implementation: function (n) {
      this.acc -= n;
      this.carry = this.acc < 0;
    },
  },
  {
    type: "destination",
    name: "SUBC",
    implementation: function (n) {
      this.acc -= n + (this.carry ? 1 : 0);
      this.carry = this.acc < 0;
    },
  },
  {
    type: "destination",
    name: "CMP",
    implementation: function (n) {
      this.carry = this.acc - n < 0;
      this.setZero = this.acc == 0;
    },
  },
  {
    type: "destination",
    name: "MUL",
    implementation: function (n) {
      this.acc *= n;
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "SHIFT_L",
    implementation: function (n) {
      if (n >= 32) this.acc = 0; //Js shift overflows if above 32
      else this.acc <<= n;
    },
  },
  {
    type: "destination",
    name: "SHIFT_R",
    implementation: function (n) {
      if (n >= 32) this.acc = 0; //Js shift overflows if above 32
      else this.acc >>>= n;
    },
  },
  {
    type: "destination",
    name: "AND",
    implementation: function (n) {
      this.acc &= n;
    },
  },
  {
    type: "destination",
    name: "XOR",
    implementation: function (n) {
      this.acc ^= n;
    },
  },
  {
    type: "destination",
    name: "OR",
    implementation: function (n) {
      this.acc |= n;
    },
  },
  {
    type: "destination",
    name: "CARRY",
    implementation: function (n) {
      this.carry = n != 0;
    },
  },
  {
    type: "destination",
    name: "ZERO",
    implementation: function (n) {
      this.zero = n != 0;
    },
  },
  {
    type: "destination",
    name: "ADR",
    implementation: function (n) {
      this.adr = n;
    },
  },
  {
    type: "destination",
    name: "MEM",
    implementation: function (n) {
      this.memory[this.adr] = n;
    },
  },
  {
    type: "destination",
    name: "PC",
    implementation: function (n) {
      this.pc = n;
    },
  },
  {
    type: "destination",
    name: "CALL",
    implementation: function (n) {
      this.push(this.pc);
      this.pc = n;
    },
  },
  {
    type: "destination",
    name: "PUSH",
    implementation: function (n) {
      this.push(n);
    },
  },
  {
    type: "destination",
    name: "HALT",
    implementation: function (n, instructionLength) {
      this.pc -= instructionLength;
      this.callbacks.haltCallback?.(this.pc);
    },
  },
  {
    type: "destination",
    name: "OUT",
    implementation: function (n) {
      this.callbacks.outputRawCallback?.(n);
    },
  },
  {
    type: "destination",
    name: "LED",
    implementation: function (n) {
      this.led = n;
      this.callbacks.ledCallback?.(this.led);
    },
  },
];

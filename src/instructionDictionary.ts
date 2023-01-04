import { instructionDictionaryType } from "./instructions";
import { uint16_max } from "./common.js";

export const defaultInstructionDictionary: instructionDictionaryType = [
  {
    type: "source",
    name: "ACC",
    implementation: function () {
      return this.acc;
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
    name: "OP",
    isOperand: true,
    implementation: function () {
      return this.memory[++this.pc];
    },
  },
  {
    type: "source",
    name: "IN",
    implementation: function () {
      if (!this.inputAvailableCallback?.()) return null;

      return this.inputRawCallback?.() || 0;
    },
  },
  {
    type: "source",
    name: "IN_AV",
    implementation: function () {
      return this.inputAvailableCallback?.() ? 0xffff : 0;
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
    name: "NULL",
    implementation: function () {
      return 0;
    },
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
    name: "PLUS",
    implementation: function (n) {
      this.acc += n + (this.carry ? 1 : 0);
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "MINUS",
    implementation: function (n) {
      this.acc -= n + (this.carry ? 1 : 0);
      this.carry = this.acc < 0;
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
    name: "OUT",
    implementation: function (n) {
      this.outputRawCallback?.(n);
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
    name: "HALT",
    implementation: function (n, instructionLength) {
      this.pc -= instructionLength;
      this.haltCallback?.();
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
    name: "MUL",
    implementation: function (n) {
      this.acc *= n;
      this.carry = this.acc > uint16_max;
    },
  },
  {
    type: "destination",
    name: "DIV_S",
    implementation: function (n) {
      this.acc = ((this.acc << 16) >> 16) / ((n << 16) >> 16);
    },
  },
  {
    type: "destination",
    name: "DIV",
    implementation: function (n) {
      this.acc /= n;
    },
  },
  {
    type: "destination",
    name: "MOD_S",
    implementation: function (n) {
      this.acc = ((this.acc << 16) >> 16) % ((n << 16) >> 16);
    },
  },
  {
    type: "destination",
    name: "MOD",
    implementation: function (n) {
      this.acc %= n;
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
    name: "CALL",
    implementation: function (n) {
      this.push(this.pc);
      this.pc = n;
    },
  },
  {
    type: "destination",
    name: "NULL",
    implementation: function (n) {},
  },
];

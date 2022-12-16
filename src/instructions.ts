export const sourceToVal: { [k in sourceType]: number } = {
  acc: 0,
  adr: 1,
  mem: 2,
  op: 3,
  in: 4,
  in_avail: 5,
  pop: 6,
};

export const destinationToVal: { [k in destinationType]: number } = {
  acc: 0,
  adr: 1,
  mem: 2,
  plus: 3,
  minus: 4,
  carry: 5,
  zero: 6,
  out: 7,
  pc: 8,
  out_num: 9,
  halt: 10,
  shift_l: 11,
  shift_r: 12,
  mul: 13,
  div: 14,
  mod: 15,
  push: 16,
  call: 17,
};

export type sourceType =
  | "acc"
  | "adr"
  | "mem"
  | "op"
  | "in"
  | "in_avail"
  | "pop";
export type destinationType =
  | "acc"
  | "adr"
  | "mem"
  | "plus"
  | "minus"
  | "carry"
  | "zero"
  | "out"
  | "pc"
  | "out_num"
  | "halt"
  | "shift_l"
  | "shift_r"
  | "mul"
  | "div"
  | "mod"
  | "push"
  | "call";

export const sourceToVal: { [k in sourceType]: number } = {
  acc: 0,
  adr: 1,
  mem: 2,
  op: 3,
  in: 4,
  in_avail: 5
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
};

export type sourceType = "acc" | "adr" | "mem" | "op" | "in" | "in_avail";
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
  | "out_num";

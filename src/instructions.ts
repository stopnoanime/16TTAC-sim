export const sourceToVal: { [k in sourceType]: number } = {
  acc: 0,
  adr: 1,
  mem: 2,
  op: 3,
};

export const destinationToVal: { [k in destinationType]: number } = {
  acc: 0,
  adr: 1,
  mem: 2,
  plus: 3,
  minus: 4,
  carry: 5,
  zero: 6,
};

export type sourceType = "acc" | "adr" | "mem" | "op";
export type destinationType =
  | "acc"
  | "adr"
  | "mem"
  | "plus"
  | "minus"
  | "carry"
  | "zero";

import { Compiler } from "./compiler";

const compiler = new Compiler();

const output = compiler.compile(String.raw`
    word name1
    word name2 = -100
    word name3 = 0xFFFF
    word name4 = 'a'
    word name5[10] = "abc"
    word name6[3][10] = [3, "abc", ['a', 4]]

    label0:
    acc => mem
    adr => acc c
    "abc" => acc z
    0xff => acc z
    name6 => adr
    label1:
    label0 => adr c z
`);

console.log(output);

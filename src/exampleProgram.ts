// Taken from examples/numbers.txt
export const exampleProgram = String.raw`
word string[10] = "61293"

string => PUSH
string_to_number => CALL

number_out => CALL
NULL => HALT


//Function that converts provided string to number
//String address should be on the top of stack before calling it
string_to_number:
    POP => ACC
    POP => ADR
    ACC => PUSH

    0 => PUSH

    string_to_number_loop:
        MEM => ACC

        string_to_number_end => PC z

        POP => ACC
        10 => MUL
        MEM => ADD
        '0' => SUB
        ACC => PUSH

        ADR => ACC
        1 => ADD
        ACC => ADR
        
    string_to_number_loop => PC

    string_to_number_end:
        POP => ACC
        POP => ADR
        ACC => PUSH
        ADR => PC


//Function that outputs a provided number
//The number should be on the top of stack before calling it
number_out:
    POP => ADR
    POP => ACC
    ADR => PUSH
    ACC => ADR

    0 => PUSH

    number_out_loop:
        0xF => AND
        10  => CMP
        7   => SUB c
        55  => ADD
        ACC => PUSH

        ADR => ACC
        4 => SHIFT_R
        ACC => ADR
        
        number_out_write => PC z
    number_out_loop => PC

    number_out_write:
        POP => ACC
        POP => PC z
        ACC => OUT
    number_out_write => PC
`;

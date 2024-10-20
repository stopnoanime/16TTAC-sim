# Default sources and destinations

## Sources

### NULL

Returns 0x0000

### ACC

Returns the accumulator value.

### TRUE

Returns 0xFFFF

### OP

Returns the supplied operand.

### ADR

Returns the address register value.

### MEM

Returns the memory value at address specified by the address register.

### PC

Returns the Program Counter value.

### POP

Pops a value from the stack and returns it

### IN

Returns data from input device.
If there is no data available, it waits for any to arrive.

### IN_AV

Returns 0xFFFF if there is any input data available, otherwise returns 0x0000.

### OUT_AV

Returns 0xFFFF if the output device is ready to write, otherwise returns 0x0000.

### LED

Returns the value stored in the LED output register.

## Destinations

All destinations that set the accumulator also set the Zero flag with the correct value.

### NULL

Does nothing.

### ACC

Sets the accumulator with given value.

### ADD

Adds the given value to the accumulator. Uses sets the carry flag on overflow.

### ADDC

Adds the given value and carry to the accumulator. Sets the carry flag on overflow.

### SUB

Subtracts the given value from the accumulator. Sets the carry flag on underflow.

### SUBC

Subtracts the given value and carry from the accumulator. Sets the carry flag on underflow.

### CMP

Subtracts the given value from the accumulator, but does not store the value.
Sets the carry flag on underflow, and also updates the zero flag.

### MUL

Multiplies the given value and the accumulator. Sets the carry flag on overflow.

### SHIFT_L

Shifts the accumulator value left (given value)times.

### SHIFT_R

Shifts the accumulator value right (given value)times.

### AND

ANDs the given value and the accumulator.

### XOR

XORs the given value and the accumulator.

### OR

ORs the given value and the accumulator.

### CARRY

If the given value is 0x0000 unsets the Carry flag, otherwise sets it.

### ZERO

If the given value is 0x0000 unsets the Zero flag, otherwise sets it.

### ADR

Sets the address register with given value.

### MEM

Sets the memory value at address specified by the address register.

### PC

Sets the Program Counter with the given value.

### CALL

Pushes the Program counter onto the stack and sets it with the given value.

### PUSH

Pushes the given value onto the stack.

### HALT

Halts the CPU, the given value is ignored.

### OUT

Outputs the given value.

### LED

Sets the LED output register to the given value.
Bits (2 downto 0) of this register are used to control respectively
RED, GREEN and BLUE parts of the LED.

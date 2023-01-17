# Default sources and destinations

## Sources

### ACC

Returns the accumulator value.

### ADR

Returns the address register value.

### MEM

Returns the memory value at address specified by the address register.

### IN

Returns the first value from the input queue.
If there are no items in the input queue, it waits for any to arrive.

### IN_AV

Returns 0xFFFF if there are any items in the input queue, otherwise returns 0x0000.

### POP

Pops a value from the stack and returns it

### NULL

Returns 0x0000

## Destinations

All destinations that set the accumulator also set the Zero flag with the correct value.

### ACC

Sets the accumulator with given value.

### ADR

Sets the address register with given value.

### MEM

Sets the memory value at address specified by the address register.

### PC

Sets the Program Counter with the given value.

### HALT

Halts the CPU, the given value is ignored.

### OUT

Outputs the given value.

### PUSH

Pushes the given value onto the stack.

### CALL

Pushes the Program counter onto the stack and sets it with the given value.

### NULL

Does nothing.

### CARRY

If the given value is 0x0000 unsets the Carry flag, otherwise sets it.

### ZERO

If the given value is 0x0000 unsets the Zero flag, otherwise sets it.

### PLUS

Adds the given value to the accumulator. Uses and sets the carry flag on overflow.

### MINUS

Subtracts the given value to the accumulator. Uses and sets the carry flag on underflow.

### SHIFT_L

Shifts the accumulator value left (given value)times.

### SHIFT_R

Shifts the accumulator value right (given value)times.

### MUL

Multiplies the given value and the accumulator. Sets the carry flag on overflow.

### DIV_S

Performs signed division of the accumulator value by the given value.

### DIV

Performs unsigned division of the accumulator value by the given value.

### MOD_S

Performs the modulo operation on the accumulator value and the given value, while treating them as signed numbers.

### MOD

Performs the modulo operation on the accumulator value and the given value, while treating them as unsigned numbers.

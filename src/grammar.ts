export const grammarDefinition = String.raw`
Grammar {
  Exp = Token*
  
  Token = 
    varType  varName ArrDim ("=" (valueLiteral | ArrLiteral))?  -- variable
  | varName ":" -- label
  | (src | valueLiteral | varName) "=>" dest #space flag? flag?  -- ins
      
  ArrDim = ( "[" number "]" )*
  ArrLiteral = ("[" ListOf<ArrLiteral, ","> "]")  -- array
  | valueLiteral
  
  number = "-"? digit+
  charLiteral = "'"any"'"
  valueLiteral = hexLiteral | number | charLiteral | stringLiteral
  hexLiteral = "0x" hexDigit+
  stringLiteral = "\"" doubleStringCharacter* "\""

  doubleStringCharacter =
    "\\" any           -- escaped
    | ~"\"" any          -- nonEscaped
  
  varType = "word"
  varName = letter (letter | number)*
  
  src = "acc" | "adr" | "mem" | "in_avail" | "in"
  dest = "acc" | "adr" | "mem" | "plus" | "minus" | "carry" | "zero" | "out_num" | "out" | "pc"
  flag = ("c" | "z") space
  
  comment = "//" (~"\n" any)*
  space += comment
}
`;

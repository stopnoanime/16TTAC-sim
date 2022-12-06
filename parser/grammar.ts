export const grammarDefinition = String.raw`
Grammar {
  Exp = Token*
  
  Token = 
    varType  varName ArrDim ("=" (valueLiteral | ArrLiteral))?  -- variable
  | varName ":" -- label
  | src "->" dest flag*  -- ins
      
  ArrDim = ( "[" number "]" )*
  ArrLiteral = ("[" ListOf<ArrLiteral, ","> "]")  --ArrLiteralArr
  | valueLiteral
  
  number = digit+
  charLiteral = "'"any"'"
  valueLiteral = hexLiteral | number | charLiteral | stringLiteral
  hexLiteral = "0x" hexDigit+
  stringLiteral = "\"" doubleStringCharacter* "\""

  doubleStringCharacter =
    "\\" any           -- escaped
    | ~"\"" any          -- nonEscaped
  
  varType = "word" | "char"
  varName = letter (letter | number)*
  
  src = caseInsensitive<"acc"> | caseInsensitive<"mem">
  dest = caseInsensitive<"acc"> | caseInsensitive<"mem"> | caseInsensitive<"plus"> | caseInsensitive<"minus">
   flag = caseInsensitive<"c"> | caseInsensitive<"z">
  
  comment = "//" (~"\n" any)*
  space += comment
}
`

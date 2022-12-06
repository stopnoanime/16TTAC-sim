export const grammarDefinition = String.raw`
Grammar {
    Exp = 
       	varType  varName ArrDim* ("=" (valueLiteral | ArrLiteral | stringLiteral))?  -- variable
		| varName ":" -- label
		| src "->" dest flag*  -- ins
        
    ArrDim = ( "[" number "]" )
    ArrLiteral = ("[" ListOf<ArrLiteral, ","> "]")  --ArrLiteralArr
    | valueLiteral
    
    number = digit+
    charLiteral = "'"any"'"
    valueLiteral = hexLiteral | number | charLiteral
    hexLiteral = "0x" hexDigit+
    stringLiteral = "\"" (~"\"" any)* "\""
    
    varType = "word" | "char"
    varName = letter (letter | number)*
    
    src = caseInsensitive<"acc"> | caseInsensitive<"mem">
    dest = caseInsensitive<"acc"> | caseInsensitive<"mem"> | caseInsensitive<"plus"> | caseInsensitive<"minus">
   	flag = caseInsensitive<"c"> | caseInsensitive<"z">
}
`

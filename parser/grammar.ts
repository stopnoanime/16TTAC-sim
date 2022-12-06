export const grammarDefinition = `
Lang {
    Exp = 
       	varType  varName ArrDim* ("=" (valueLiteral | ArrLiteral | stringLiteral))?  -- variable


    ArrDim = ( "[" number "]" )
    ArrLiteral = ("[" ListOf<ArrLiteral, ","> "]")  --ArrLiteralArr
    | valueLiteral
    
    number = digit+
    charLiteral = "'"any"'"
    valueLiteral = number | charLiteral
    stringLiteral = "'"any*"'"
    
    varType = "word" | "char"
    varName = letter (letter | number)*
}
`

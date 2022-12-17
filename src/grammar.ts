import { Instructions } from "./instructions";

export class Grammar {
  private instructions = new Instructions();

  public grammarDefinition = String.raw`
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
    varName = letter (alnum | "_" | "-")*
    
    src = ${this.instructions.sources.map((e) => `"${e}"`).join("|")}
    dest = ${this.instructions.destinations.map((e) => `"${e}"`).join("|")}
    flag = ("c" | "z") space
    
    comment = "//" (~"\n" any)*
    space += comment
  }
  `;
}

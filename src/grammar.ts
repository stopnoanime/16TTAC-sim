import { instructionDictionaryType, Instructions } from "./instructions.js";

export class Grammar {
  private instructions: Instructions;
  public grammarDefinition: string;

  /**
   * Constructs the Ohm Grammar definition
   * @param dictionary Optional dictionary to use instead of the default one
   */
  constructor(dictionary?: instructionDictionaryType) {
    this.instructions = new Instructions(dictionary);

    this.grammarDefinition = String.raw`
      Grammar {
        Exp = Token*
        
        Token = 
          varType varName ArrDim ("=" (extendedValueLiteral | ArrLiteral))?  -- variable
        | varName ":" -- label
        | (src | valueLiteral | varName) "=>" dest cFlag? zFlag?  -- ins
            
        ArrDim = ( "[" valueLiteral "]" )*
        ArrLiteral = ("[" ListOf<ArrLiteral, ","> "]")  -- array
        | extendedValueLiteral
        
        number = "-"? digit+
        valueLiteral = hexLiteral | number | charLiteral
        extendedValueLiteral = valueLiteral | stringLiteral 
        hexLiteral = "0x" hexDigit+
        charLiteral = "'" charLiteralCharacter "'"
        stringLiteral = "\"" doubleStringCharacter* "\""
    
        charLiteralCharacter =
          escapedCharacter
          | ~"\'" any

        doubleStringCharacter =
          escapedCharacter
          | ~"\"" any
        
        escapedCharacter = "\\" any

        varType = "word"
        varName = lower (alnum | "_" | "-")*
        
        // &space is required for src/dest with same prefix as another src/dest to work
        src = ${this.instructions.sources
          .map((e) => `"${e}" &(space | "=")`)
          .join("|")}
        dest = ${this.instructions.destinations
          .map((e) => `"${e}" &(space | end)`)
          .join("|")}

        cFlag = "c" &(space | end)
        zFlag = "z" &(space | end)
        
        comment = "//" (~"\n" any)*
        space += comment
      }
      `;
  }
}

export class IconvTiny {
  /**
   * @param encodings A map of encodings to support.
   * @param aliases Comma-separated groups, each containing space-separated aliases for the same encoding.
   */
  constructor(encodings: { [key: string]: EncodingFactory }, aliases?: string);
  decode(buffer: Uint8Array, encoding: string, options?: Options): string;
  encode(content: string, encoding: string, options?: Options): Uint8Array;
}

interface Encoding {
  decode(array: Uint8Array): string;
  encode(text: string): Uint8Array;
}

interface EncodingFactory {
  create(options?: Options): Encoding;
}

type Overrides = Array<number | string>;

type DefaultCharFunction = (input: number, index: number) => number | null;

type Options = {
  /**
   * Sets the replacement byte used by the "encode" method for unmapped Unicode symbols (default: "?").
   */
  defaultCharByte?: string | DefaultCharFunction;
  /**
   * Sets the replacement character used by the "decode" method for unmapped bytes (default: "�").
   */
  defaultCharUnicode?: string | DefaultCharFunction;
  /**
   * Defines custom character mappings (default: null).
   *
   * Format: [<byte_1>, <character_1>, <byte_2>, <character_2>, ...].
   * Example: [0x8f, "⚡"] maps the byte 0x8f to "⚡" and vice versa during encoding.
   * Only symbols with code values no greater than 0xFFFF are allowed.
   */
  overrides?: Overrides;
  /**
   * Specifies the alternative symbols for the first 32 control bytes.
   *
   * The default is IBM PC memory-mapped symbols: " ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼"
   * - 0x00 maps to U+0020 " " Space
   * - 0x01 maps to U+263A "☺" White Smiling Face
   * - 0x02 maps to 0x263B "☻" Black Smiling Face
   * ...
   */
  graphics?: string;
  /**
   * Specifies whether to use the graphic symbols (default: false).
   */
  graphicMode?: boolean;
  /**
   * Specifies the behavior of "decode" method (default: false)
   *
   * - true: use native TextDecoder.decode if the given encoding supported
   * - false: use "software" decode according to the mapping rules.
   *
   * If defaultCharUnicode, overrides, or graphicMode are set then this option
   * is ignored as the native TextDecoder cannot emulate these features.
   */
  nativeDecode?: boolean;
  /**
   * Specifies the behavior of non-native "decode" method (default: false)
   *
   * - true: use String.fromCharCode to create a string from UTF-16 sequence.
   * - false: use TextDecoder("UTF-16") to create a string from UTF-16 sequence.
   *
   * **Dev Notes**:
   *
   * The non-strict decode works in 99.99% of cases, as long as the mapping
   * produces a correct sequence in UTF-16. There are no single-byte encodings
   * that map bytes to Unicode values greater than 0xFFFF or to the range
   * reserved for surrogate pairs.
   *
   * However, it is possible using `overrides`. In this case TextDecoder will
   * replace invalid UTF-16 codes by �.
   */
  strictDecode?: boolean;
};

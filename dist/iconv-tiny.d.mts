export class IconvTiny {
  /**
   * @param encodings A map of encodings to support.
   * @param aliases Comma-separated groups, each containing space-separated aliases for the same encoding.
   */
  constructor(encodings?: { [key: string]: EncodingFactory }, aliases?: string);
  decode(array: Uint8Array, encoding: string, options?: OptionsAndDecoderOptions): string;
  encode(content: string, encoding: string, options?: OptionsAndEncoderOptions): Uint8Array;
  getEncoding(encoding: string, options?: Options): Encoding;
}

/**
 * Converts an encoding name to a normalized, unique name.
 * Removes non-alphanumeric characters and leading zeros.
 * For more details, refer to: https://www.unicode.org/reports/tr22/tr22-8.html#Charset_Alias_Matching
 * @param {string} encoding
 * @returns {string}
 */
export function canonicalize(encoding: string): string;

interface Encoding {
  getName(): string;
  decode(array: Uint8Array, options?: DecoderOptions): string;
  encode(text: string, options?: EncoderOptions): Uint8Array;
  newDecoder(options?: DecoderOptions): CharsetDecoder;
  newEncoder(options?: EncoderOptions): CharsetEncoder;
}

interface EncodingFactory {
  create(options?: Options): Encoding;
}

interface CharsetDecoder {
  decode(array?: Uint8Array): string;
}

interface CharsetEncoder {
  encode(text?: string): Uint8Array;
  encodeInto(src: string, dst: Uint8Array): TextEncoderEncodeIntoResult;
  /**
   * Similar to Buffer.byteLength;
   * @param src input to calculate the length of
   * @returns The number of bytes of the specified string
   */
  byteLength(src: string): number;
}

type TextEncoderEncodeIntoResult = {
  read: number;
  written: number;
}

type DecoderOptions = {
  /**
   * Sets the replacement character used by the "decode" method for unmapped bytes (default: "�").
   */
  defaultCharUnicode?: string | DefaultCharUnicodeFunction;
  /**
   * Specifies the behavior of the "decode" method (default: false)
   *
   * - true: use the native TextDecoder when possible.
   * - false: use a software-based decoder that relies on a mapping table.
   *
   * This option is ignored for Unicode, as it uses algorithmic rules rather than a mapping table.
   */
  native?: boolean;
  /**
   * Unicode only. BOM is stripped by default, unless overridden by stripBOM: false
   */
  stripBOM?: boolean;
};

type EncoderOptions = {
  /**
   * Sets the replacement byte used by the "encode" method for unmapped symbols (default: "?").
   */
  defaultCharByte?: string | DefaultCharByteFunction;
  /**
   * Unicode only. No BOM added by default, unless overridden by addBOM: true
   */
  addBOM?: boolean;
}

type Options = {
  /**
   * Defines custom character mappings (default: undefined).
   *
   * Format: [<byte_1>, <character_1>, <byte_2>, <character_2>, ...].
   * Example: [0x8f, "⚡"] maps the byte 0x8f to "⚡" and vice versa during encoding.
   * Only symbols with code values no greater than 0xFFFF are allowed.
   * Unicode encodings ignore this option
   */
  overrides?: Overrides;
};

type Overrides = Array<number | string>;

/**
 * @param {number} input - input character code (0-65536)
 * @param {number} index - index of the character
 * @returns {number} default byte (0-255)
 */
type DefaultCharByteFunction = (input: number, index: number) => number | null | undefined;

/**
 * @param {number} input - input byte (0-255)
 * @param {number} index - index of the byte
 * @returns {number} default character code (0-65536)
 */
type DefaultCharUnicodeFunction = (input: number, index: number) => number | null | undefined;

type OptionsAndDecoderOptions = Options & DecoderOptions;
type OptionsAndEncoderOptions = Options & EncoderOptions;

export const ISO_8859_1: EncodingFactory;
export const ISO_8859_2: EncodingFactory;
export const ISO_8859_3: EncodingFactory;
export const ISO_8859_4: EncodingFactory;
export const ISO_8859_5: EncodingFactory;
export const ISO_8859_6: EncodingFactory;
export const ISO_8859_7: EncodingFactory;
export const ISO_8859_8: EncodingFactory;
export const ISO_8859_9: EncodingFactory;
export const ISO_8859_10: EncodingFactory;
export const ISO_8859_11: EncodingFactory;
export const ISO_8859_13: EncodingFactory;
export const ISO_8859_14: EncodingFactory;
export const ISO_8859_15: EncodingFactory;
export const ISO_8859_16: EncodingFactory;
export const CP037: EncodingFactory;
export const CP500: EncodingFactory;
export const CP875: EncodingFactory;
export const CP1026: EncodingFactory;
export const CP437: EncodingFactory;
export const CP737: EncodingFactory;
export const CP775: EncodingFactory;
export const CP850: EncodingFactory;
export const CP852: EncodingFactory;
export const CP855: EncodingFactory;
export const CP857: EncodingFactory;
export const CP860: EncodingFactory;
export const CP861: EncodingFactory;
export const CP862: EncodingFactory;
export const CP863: EncodingFactory;
export const CP864: EncodingFactory;
export const CP865: EncodingFactory;
export const CP866: EncodingFactory;
export const CP869: EncodingFactory;
export const CP874: EncodingFactory;
export const CP1250: EncodingFactory;
export const CP1251: EncodingFactory;
export const CP1252: EncodingFactory;
export const CP1253: EncodingFactory;
export const CP1254: EncodingFactory;
export const CP1255: EncodingFactory;
export const CP1256: EncodingFactory;
export const CP1257: EncodingFactory;
export const CP1258: EncodingFactory;
export const MAC_CYRILLIC: EncodingFactory;
export const MAC_GREEK: EncodingFactory;
export const MAC_ICELAND: EncodingFactory;
export const MAC_LATIN2: EncodingFactory;
export const MAC_ROMAN: EncodingFactory;
export const MAC_TURKISH: EncodingFactory;
export const ATARIST: EncodingFactory;
export const CP424: EncodingFactory;
export const CP856: EncodingFactory;
export const CP1006: EncodingFactory;
export const KOI8_R: EncodingFactory;
export const KOI8_U: EncodingFactory;
export const KZ1048: EncodingFactory;
export const NEXTSTEP: EncodingFactory;
export const US_ASCII: EncodingFactory;
export const UTF8: EncodingFactory;
export const UTF16LE: EncodingFactory;
export const UTF16BE: EncodingFactory;
export const UTF32LE: EncodingFactory;
export const UTF32BE: EncodingFactory;

export const encodings: { [key: string]: EncodingFactory };
export const aliases: string;

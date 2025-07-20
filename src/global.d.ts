/**
 * @see {@link file://./externs.mjs}
 */
declare namespace ns {
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
}

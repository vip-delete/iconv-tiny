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

  type Overrides = Array<number | string>;

  /**
   * @param {number} c - input character code (0-65536)
   * @param {number} index - index of the character
   * @returns {number} default byte (0-255)
   */
  type DefaultCharByteFunction = (c: number, index: number) => number | null | undefined;

  /**
   * @param {number} b - input byte (0-255)
   * @param {number} index - index of the byte
   * @returns {number} default character code (0-65536)
   */
  type DefaultCharUnicodeFunction = (b: number, index: number) => number | null | undefined;

  type DecoderOptions = {
    /**
     * Sets the replacement character used by the "decode" method for unmapped bytes (default: "�").
     */
    defaultCharUnicode?: string | DefaultCharUnicodeFunction;
    /**
     * Specifies the behavior of "decode" method (default: false)
     *
     * - true: use native TextDecoder whenever possible
     * - false: use "software" decoding according to the mapping rules.
     */
    native?: boolean;
    /**
     * UTF-16LE, UTF-16BE, UTF-32LE, UTF-32BE: BOM is stripped by default, unless overridden by stripBOM: false
     * UTF-16, UTF-32: Use BOM, fallback to LE, unless overriden by defaultEncoding: 'UTF-16BE' or 'UTF-32BE';
     */
    stripBOM?: boolean;
  };

  type EncoderOptions = {
    /**
     * Sets the replacement byte used by the "encode" method for unmapped Unicode symbols (default: "?").
     */
    defaultCharByte?: string | DefaultCharByteFunction;
    /**
     * UTF-16LE, UTF-16BE, UTF-32LE, UTF-32BE: No BOM added by default, unless overridden by addBOM: true
     * UTF-16, UTF-32: Use LE and add BOM by default, unless overridden by addBOM: false
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

  type OptionsAndDecoderOptions = Options & DecoderOptions;
  type OptionsAndEncoderOptions = Options & EncoderOptions;
}

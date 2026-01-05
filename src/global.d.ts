/**
 * @see {@link file://./externs.mjs}
 */
declare namespace ns {
  /**
   * Converts an encoding name to a normalized, unique name.
   * Removes non-alphanumeric characters and leading zeros.
   * For more details, refer to: https://www.unicode.org/reports/tr22/tr22-8.html#Charset_Alias_Matching
   * @param {string} encoding
   * @returns {string}
   */
  export function canonicalize(encoding: string): string;

  /**
   * @param encodings - A map of encodings to support.
   * @param aliases - Comma-separated groups, each containing space-separated aliases for the same encoding.
   */
  export function createIconv(encodings?: { [key: string]: EncodingFactory }, aliases?: string): Iconv;

  interface EncodingFactory {
    create(options?: Options): Encoding;
  }

  interface Iconv {
    /** get/create an encoding, create a decoder, decode and flush */
    decode(buf: Uint8Array, encoding: string, options?: OptionsAndDecoderOptions): string;
    /** get/create an encoding, create a encoder, encode and flush */
    encode(str: string, encoding: string, options?: OptionsAndEncoderOptions): Uint8Array;
    /** get/create an encoding */
    getEncoding(encoding: string, options?: Options): Encoding;
  }

  /** Encoding that doesn't keep any state */
  interface Encoding {
    getName(): string;

    /** get/create a decoder, decode and flush */
    decode(buf: Uint8Array, options?: DecodeOptions): string;
    /** get/create a encoder, encode and flush */
    encode(str: string, options?: EncodeOptions): Uint8Array;

    /**
     * Similar to Buffer.byteLength.
     *
     * @param str - input to calculate the length of
     * @returns The number of bytes of the specified string
     */
    byteLength(str: string): number;

    // --- Low-level Stream APIs ---

    /** create a decoder to keep the decoding state. */
    getDecoder(options?: DecodeOptions): DecoderStream;
    /** create an encoder to keep the encoding state. */
    getEncoder(options?: EncodeOptions): EncoderStream;
  }

  /** Decoder to keep the decoding state */
  interface DecoderStream {
    /** decode, keep the leftover in the state */
    write(buf: Uint8Array): string;
    /** flush the leftover */
    end(): string;
  }

  /** Encoder to keep the encoding state */
  interface EncoderStream {
    /** encode into a new array, keep the leftover in the state */
    write(str: string): Uint8Array;
    /** flush the leftover into a new array */
    end(): Uint8Array;

    // --- Low-Level Encoding APIs ---

    /** encode into the given array, keep the leftover in the state */
    encodeInto(str: string, buf: Uint8Array): TextEncoderEncodeIntoResult;
    /** flush the leftover into the given array */
    flushInto(buf: Uint8Array): TextEncoderEncodeIntoResult;
  }

  type TextEncoderEncodeIntoResult = {
    read: number;
    written: number;
  }

  type DecodeOptions = {
    /**
     * Sets the replacement character used by the "decode" method for unmapped bytes (default: "�").
     */
    defaultCharUnicode?: string | DefaultFunction;
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

  type EncodeOptions = {
    /**
     * Sets the replacement byte used by the "encode" method for unmapped symbols (default: "?").
     */
    defaultCharByte?: string | DefaultFunction;
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
   * @param {number} input - input character code (0-65535) if encoding; or an input byte (0-255) if decoding
   * @param {number} index - index of the character if encoding; or an index of the byte if decoding
   * @returns {number} default byte (0-255) if encoding; or a default character code (0-65535) if decoding
   */
  type DefaultFunction = (input: number, index: number) => number | null | undefined;

  type OptionsAndDecoderOptions = Options & DecodeOptions;
  type OptionsAndEncoderOptions = Options & EncodeOptions;
}

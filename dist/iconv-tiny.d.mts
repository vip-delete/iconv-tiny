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

export const US_ASCII: EncodingFactory;
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
export const CP424: EncodingFactory;
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
export const CP856: EncodingFactory;
export const CP1006: EncodingFactory;
export const KOI8_R: EncodingFactory;
export const KOI8_U: EncodingFactory;
export const KZ1048: EncodingFactory;
export const NEXTSTEP: EncodingFactory;
export const JIS_0201: EncodingFactory;
export const SHIFT_JIS: EncodingFactory;
export const CP932: EncodingFactory;
export const UTF8: EncodingFactory;
export const UTF16LE: EncodingFactory;
export const UTF16BE: EncodingFactory;
export const UTF32LE: EncodingFactory;
export const UTF32BE: EncodingFactory;

export const encodings: { [key: string]: EncodingFactory };
export const aliases: string;

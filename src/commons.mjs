/**
 * @type {number}
 */
export const REPLACEMENT_CHARACTER_CODE = 0xfffd; // �

/**
 * @type {number}
 */
export const DEFAULT_CHAR_BYTE = 63; // "?"

/**
 * @type {boolean}
 */
export const DEFAULT_NATIVE_DECODE = false;

const STRING_SMALLSIZE = 192;
const STRING_CHUNKSIZE = 1024;
const UTF16 = new TextDecoder("UTF-16LE", { fatal: true });

/**
 * @param {!Uint16Array} u16
 * @return {string}
 */
const getStringFallback = (u16) => {
  const len = u16.length;
  const result = [];
  for (let i = 0; i < len; i += STRING_CHUNKSIZE) {
    result.push(String.fromCharCode(...u16.subarray(i, i + STRING_CHUNKSIZE)));
  }
  return result.join("");
};

/**
 * @param {!Uint16Array} u16
 * @return {string}
 */
export const getString = (u16) => {
  const len = u16.length;
  if (len <= STRING_SMALLSIZE) {
    return String.fromCharCode(...u16);
  }
  try {
    return UTF16.decode(u16);
  } catch {
    return getStringFallback(u16);
  }
};

/**
 * @abstract
 * @implements {ns.Encoding}
 */
// @ts-expect-error
export class Charset {
  /**
   * @param {string} charsetName
   */
  constructor(charsetName) {
    this.charsetName = charsetName;
  }

  /**
   * @override
   * @return {string}
   */
  // @ts-expect-error
  getName() {
    return this.charsetName;
  }

  /**
   * @override
   * @param {!Uint8Array} array
   * @param {!ns.DecoderOptions} [options]
   * @return {string}
   */
  // @ts-expect-error
  decode(array, options) {
    /**
     * @type {!ns.CharsetDecoder}
     */
    // @ts-expect-error
    const decoder = this.newDecoder(options);
    return decoder.decode(array) + decoder.decode();
  }

  /**
   * @override
   * @param {string} text
   * @param {!ns.EncoderOptions} [options]
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  encode(text, options) {
    /**
     * @type {!ns.CharsetEncoder}
     */
    // @ts-expect-error
    const encoder = this.newEncoder(options);
    return encoder.encode(text);
  }
}

/**
 * @implements {ns.CharsetDecoder}
 */
export class NativeCharsetDecoder {
  /**
   * @param {!TextDecoder} decoder
   */
  constructor(decoder) {
    this.decoder = decoder;
  }

  /**
   * @override
   * @param {!Uint8Array} [array]
   * @return {string}
   */
  // @ts-expect-error
  decode(array) {
    return this.decoder.decode(array, { stream: Boolean(array) });
  }
}

/**
 * @abstract
 * @implements {ns.CharsetEncoder}
 */
// @ts-expect-error
export class CharsetEncoderBase {
  /**
   * @override
   * @param {string} [text]
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  encode(text) {
    this.reset();
    if (!text) {
      return new Uint8Array(0);
    }
    const buf = new Uint8Array(this.byteLengthMax(text));
    // @ts-expect-error
    const { written } = this.encodeInto(text, buf);
    return buf.subarray(0, written);
  }

  // @ts-expect-error
  // eslint-disable-next-line jsdoc/empty-tags
  /** @abstract @param {string} text @return {number} */
  // eslint-disable-next-line no-unused-vars, no-empty-function, class-methods-use-this
  byteLengthMax(text) {}

  /**
   * @override
   * @param {string} text
   * @return {number}
   */
  // @ts-expect-error
  byteLength(text) {
    this.reset();
    let total = 0;
    const buf = new Uint8Array(4096);
    do {
      // @ts-expect-error
      const { read, written } = this.encodeInto(text, buf);
      text = text.slice(read);
      total += written;
    } while (text.length);
    return total;
  }

  /** @abstract */
  // eslint-disable-next-line no-empty-function, class-methods-use-this
  reset() {}
}

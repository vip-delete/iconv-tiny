import { Charset, CharsetEncoderBase, DEFAULT_CHAR_BYTE, DEFAULT_NATIVE_DECODE, getString, NativeCharsetDecoder, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";

/**
 * @implements {ns.CharsetDecoder}
 */
class SBCSDecoder {
  /**
   * @param {!Uint16Array} b2c
   * @param {!ns.DefaultCharUnicodeFunction|string} [defaultCharUnicode]
   */
  constructor(b2c, defaultCharUnicode) {
    this.b2c = b2c;
    if (typeof defaultCharUnicode !== "function") {
      const defaultCharUnicodeCode = defaultCharUnicode?.length ? defaultCharUnicode.charCodeAt(0) : REPLACEMENT_CHARACTER_CODE;
      defaultCharUnicode = () => defaultCharUnicodeCode;
    }
    /**
     * @type {!ns.DefaultCharUnicodeFunction}
     */
    this.handler = defaultCharUnicode;
  }

  /**
   * @override
   * @param {!Uint8Array} [array]
   * @return {string}
   */
  // @ts-expect-error
  decode(array) {
    if (!array) {
      return "";
    }
    const { b2c, handler } = this;
    const len = array.length;
    const u16 = new Uint16Array(len);
    for (let i = 0; i < len; i++) {
      const byte = array[i];
      const ch = b2c[byte];
      u16[i] = ch === REPLACEMENT_CHARACTER_CODE ? (handler(byte, i) ?? ch) : ch;
    }
    return getString(u16);
  }
}

/**
 * @implements {ns.CharsetEncoder}
 */
class SBCSEncoder extends CharsetEncoderBase {
  /**
   * @param {!Uint16Array} c2b
   * @param {!ns.DefaultCharByteFunction|string} [defaultCharByte]
   */
  constructor(c2b, defaultCharByte) {
    super();
    this.c2b = c2b;
    if (typeof defaultCharByte !== "function") {
      const defaultCharByteCode = defaultCharByte?.length ? defaultCharByte.charCodeAt(0) : DEFAULT_CHAR_BYTE;
      defaultCharByte = () => defaultCharByteCode;
    }
    /**
     * @type {!ns.DefaultCharByteFunction}
     */
    this.handler = defaultCharByte;
  }

  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @return {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(src, dst) {
    const { c2b, handler } = this;
    const len = Math.min(src.length, dst.length);
    for (let i = 0; i < len; i++) {
      const ch = src.charCodeAt(i);
      const byte = c2b[ch];
      dst[i] = byte === REPLACEMENT_CHARACTER_CODE ? (handler(ch, i) ?? DEFAULT_CHAR_BYTE) : byte;
    }
    return { read: len, written: len };
  }

  /**
   * @override
   * @param {string} text
   * @return {number}
   */
  // eslint-disable-next-line class-methods-use-this
  byteLengthMax(text) {
    return text.length;
  }

  /**
   * @override
   * @param {string} text
   * @return {number}
   */
  byteLength(text) {
    return this.byteLengthMax(text);
  }

  /**
   * @override
   */
  // eslint-disable-next-line class-methods-use-this
  reset() {
    // no-op: no state to reset
  }
}

/**
 * @implements {ns.Encoding}
 */
class SBCSCharset extends Charset {
  /**
   * @param {string} charsetName
   * @param {!Uint16Array} b2c
   */
  constructor(charsetName, b2c) {
    super(charsetName);
    this.b2c = b2c;
    /**
     * @type {?Uint16Array}
     */
    this.c2b = null;
    try {
      this.newNativeDecoder();
      this.nativeSupported = true;
    } catch {
      this.nativeSupported = false;
    }
  }

  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @return {!ns.CharsetDecoder}
   */
  // @ts-expect-error
  newDecoder(options) {
    if (this.nativeSupported && (options?.native ?? DEFAULT_NATIVE_DECODE)) {
      return this.newNativeDecoder();
    }
    return new SBCSDecoder(this.b2c, options?.defaultCharUnicode);
  }

  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @return {!ns.CharsetEncoder}
   */
  // @ts-expect-error
  newEncoder(options) {
    if (!this.c2b) {
      this.c2b = new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);
      for (let i = 0; i < 256; i++) {
        const ch = this.b2c[i];
        if (ch !== REPLACEMENT_CHARACTER_CODE) {
          this.c2b[ch] = i;
        }
      }
    }
    return new SBCSEncoder(this.c2b, options?.defaultCharByte);
  }

  /**
   * @private
   * @return {!ns.CharsetDecoder}
   */
  newNativeDecoder() {
    return new NativeCharsetDecoder(new TextDecoder(this.charsetName));
  }
}

/**
 * @param {string} symbols
 * @param {string} diff
 * @return {!Uint16Array}
 */
const getMappings = (symbols, diff) => {
  const mappings = new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);
  let i = 0;
  while (i < 256 - symbols.length) {
    mappings[i] = i++;
  }
  let j = 0;
  while (i < 256) {
    mappings[i++] = symbols.charCodeAt(j++);
  }
  let k = 0;
  while (k < diff.length) {
    mappings[diff.charCodeAt(k)] = diff.charCodeAt(k + 1);
    k += 2;
  }
  return mappings;
};

/**
 * @implements {ns.EncodingFactory}
 */
export class SBCS {
  /**
   * @param {string} charsetName
   * @param {string} symbols
   * @param {string} [diff]
   */
  constructor(charsetName, symbols, diff) {
    this.charsetName = charsetName;
    this.symbols = symbols;
    this.diff = diff;
  }

  /**
   * @override
   * @param {!ns.Options} [options]
   * @return {!ns.Encoding}
   */
  // @ts-expect-error
  create(options) {
    const b2c = getMappings(this.symbols, this.diff ?? "");
    const overrides = options?.overrides ?? [];
    let k = 0;
    while (k < overrides.length - 1) {
      const i = overrides[k++];
      const ch = overrides[k++];
      b2c[Number(i)] = typeof ch === "number" ? ch : ch.charCodeAt(0);
    }
    return new SBCSCharset(this.charsetName, b2c);
  }
}

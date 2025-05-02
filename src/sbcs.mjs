import { DEFAULT_CHAR_BYTE, DEFAULT_NATIVE_DECODE, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { NativeCharset } from "./cs.mjs";

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
   * @returns {!ns.Encoding}
   */
  // @ts-ignore
  create(options) {
    const b2c = getMappings(this.symbols, this.diff ?? "");
    const overrides = options?.overrides ?? [];
    let k = 0;
    while (k < overrides.length - 1) {
      const i = overrides[k++];
      const c = overrides[k++];
      b2c[Number(i)] = typeof c === "number" ? c : c.charCodeAt(0);
    }
    return new SBCSCharset(this.charsetName, b2c);
  }
}

/**
 * @param {string} symbols
 * @param {string} diff
 * @returns {!Uint16Array}
 */
function getMappings(symbols, diff) {
  const s = new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);
  let i = 0;
  while (i < 256 - symbols.length) {
    s[i] = i++;
  }
  let j = 0;
  while (i < 256) {
    s[i++] = symbols.charCodeAt(j++);
  }
  let k = 0;
  while (k < diff.length) {
    s[diff.charCodeAt(k)] = diff.charCodeAt(k + 1);
    k += 2;
  }
  return s;
}

/**
 * @implements {ns.Encoding}
 */
class SBCSCharset extends NativeCharset {
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
      super.newDecoder();
      this.nativeSupported = true;
    } catch {
      this.nativeSupported = false;
    }
  }

  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @returns {!ns.CharsetDecoder}
   */
  // @ts-ignore
  newDecoder(options) {
    const defaultCharUnicode = options?.defaultCharUnicode;
    if (this.nativeSupported && (options?.native ?? DEFAULT_NATIVE_DECODE)) {
      return super.newDecoder();
    }
    return new SBCSDecoder(this.b2c, defaultCharUnicode);
  }

  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @returns {!ns.CharsetEncoder}
   */
  // @ts-ignore
  newEncoder(options) {
    if (!this.c2b) {
      this.c2b = new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);
      for (let i = 0; i < 256; i++) {
        const c = this.b2c[i];
        if (c !== REPLACEMENT_CHARACTER_CODE) {
          this.c2b[c] = i;
        }
      }
    }
    return new SBCSEncoder(this.c2b, options?.defaultCharByte);
  }
}

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
   * @returns {string}
   */
  // @ts-ignore
  decode(array) {
    if (!array) {
      return "";
    }
    const { b2c, handler } = this;
    const len = array.length;
    const u16 = new Uint16Array(len);
    for (let i = 0; i < len; i++) {
      const b = array[i];
      const c = b2c[b];
      u16[i] = c === REPLACEMENT_CHARACTER_CODE ? (handler(b, i) ?? c) : c;
    }

    // TextDecoder is super fast but doesn't allow invalid surrogate pairs in the output:
    // >> new TextDecoder("UTF-16").decode(new Uint16Array([0xD7FF, 0xD800, 0xD801, 0xD802]))
    // >> \ud7ff\ufffd\ufffd\ufffd
    return new TextDecoder("UTF-16LE").decode(u16);

    // String.fromCharCode is 10x slower than TextDecoder but decodes "as-is":
    // >> String.fromCharCode(0xD7FF, 0xD800, 0xD801, 0xD802)
    // >> \ud7ff\ud800\ud801\ud802

    // const result = [];
    // for (let i = 0; i < codes.length; i += 1024) {
    //   result.push(String.fromCharCode(...codes.subarray(i, i + 1024)));
    // }
    // return result.join("");
  }
}

/**
 * @implements {ns.CharsetEncoder}
 */
class SBCSEncoder {
  /**
   * @param {!Uint16Array} c2b
   * @param {!ns.DefaultCharByteFunction|string} [defaultCharByte]
   */
  constructor(c2b, defaultCharByte) {
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
   * @param {string} [text]
   * @returns {!Uint8Array}
   */
  // @ts-ignore
  encode(text) {
    if (!text) {
      return new Uint8Array(0);
    }
    const dst = new Uint8Array(text.length);
    this.encodeInto(text, dst);
    return dst;
  }

  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @returns {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-ignore
  encodeInto(src, dst) {
    const { c2b, handler } = this;
    const len = Math.min(src.length, dst.length);
    for (let i = 0; i < len; i++) {
      const c = src.charCodeAt(i);
      const b = c2b[c];
      dst[i] = b === REPLACEMENT_CHARACTER_CODE ? (handler(c, i) ?? DEFAULT_CHAR_BYTE) : b;
    }
    return { read: len, written: len };
  }
}

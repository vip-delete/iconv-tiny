import { REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { Charset, NativeDecoder } from "./cs.mjs";

const STRIP_BOM_DEFAULT = 1;
const ADD_BOM_DEFAULT = 0;

/**
 * @implements {ns.EncodingFactory}
 */
export class Unicode {
  /**
   * @param {number} i
   * @param {number} bo
   */
  constructor(i, bo) {
    this.i = i;
    this.bo = bo;
  }

  /**
   * @override
   * @returns {!ns.Encoding}
   */
  // @ts-ignore
  create() {
    return new UnicodeCharset(this.i, this.bo);
  }
}

/**
 * @implements {ns.Encoding}
 */
class UnicodeCharset extends Charset {
  /**
   * @param {number} i - 0 for UTF-16, 1 for UTF-32, 2 for UTF-8
   * @param {number} bo - 0 for LE, 1 for BE, 2 for none
   */
  constructor(i, bo) {
    super(NAMES[i] + POSTFIX[bo]);
    this.i = i;
    this.bo = bo;
  }

  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @returns {!ns.CharsetDecoder}
   */
  // @ts-ignore
  newDecoder(options) {
    return new DECODERS[this.i](!(options?.stripBOM ?? STRIP_BOM_DEFAULT), this.bo);
  }

  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @returns {!ns.CharsetEncoder}
   */
  // @ts-ignore
  newEncoder(options) {
    return new ENCODERS[this.i](options?.addBOM ?? ADD_BOM_DEFAULT, this.i, this.bo);
  }
}

// UTF-8

/**
 * @implements {ns.CharsetDecoder}
 */
class UTF8Decoder extends NativeDecoder {
  /**
   * @param {boolean} noBOM - stripBOM
   */
  constructor(noBOM) {
    super(new TextDecoder(UTF8, { ignoreBOM: noBOM }));
  }
}

/**
 * @implements {ns.CharsetEncoder}
 */
class UTF8Encoder {
  /**
   * @param {number} addBOM
   */
  constructor(addBOM) {
    this.addBOM = addBOM;
    this.encoder = new TextEncoder();
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
    const buf = new Uint8Array((this.addBOM ? 4 : 0) + text.length * 4);
    const { written } = this.encodeInto(text, buf);
    return buf.subarray(0, written);
  }

  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @returns {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-ignore
  encodeInto(src, dst) {
    const { addBOM } = this;
    let j = 0;
    if (addBOM) {
      if (dst.length < 3) {
        return { read: 0, written: 0 };
      }
      dst[0] = 0xef;
      dst[1] = 0xbb;
      dst[2] = 0xbf;
      j += 3;
      this.addBOM = 0;
    }
    const { read, written } = this.encoder.encodeInto(src, dst.subarray(j));
    return { read, written: written + j };
  }
}

/**
 * UTF16/32 Encoder
 * @implements {ns.CharsetEncoder}
 */
class UnicodeEncoder {
  /**
   * @param {number} addBOM
   * @param {number} i - 0 for UTF-16, 1 for UTF-32
   * @param {number} bo - 0 for LE, 1 for BE
   */
  constructor(addBOM, i, bo) {
    this.addBOM = addBOM;
    this.sz = SZ[i];
    this.put = PUTS[i][bo];
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
    const sz = this.sz;
    // UTF-16: each code unit is encoded by sz=2 bytes
    // UTF-32: each code unit is encoded either by sz=4 bytes or, 2 code units are encoded by sz=4 bytes (it may be less)
    const buf = new Uint8Array((this.addBOM ? sz : 0) + text.length * sz);
    const { written } = this.encodeInto(text, buf);
    return buf.subarray(0, written);
  }

  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @returns {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-ignore
  encodeInto(src, dst) {
    const { addBOM, sz, put } = this;
    let j = 0;
    if (addBOM) {
      if (dst.length < sz) {
        return { read: 0, written: 0 };
      }
      put("\ufeff", 0, dst, j);
      j += sz;
      this.addBOM = 0;
    }
    const len = Math.min(src.length, (dst.length - j) & ~(sz - 1));
    for (let i = 0; i < len; i++, j += sz) {
      i = this.put(src, i, dst, j);
    }
    return { read: len, written: j };
  }
}

// UTF-16

/**
 * @implements {ns.CharsetDecoder}
 */
export class UTF16Decoder extends NativeDecoder {
  /**
   * @param {boolean} noBOM
   * @param {number} bo
   */
  constructor(noBOM, bo) {
    super(new TextDecoder(UTF16 + POSTFIX[bo], { ignoreBOM: noBOM }));
  }
}

// UTF-32

/**
 * @implements {ns.CharsetDecoder}
 */
class UTF32Decoder {
  /**
   * @param {boolean} noBOM
   * @param {number} bo
   */
  constructor(noBOM, bo) {
    this.noBOM = noBOM;
    this.leftover = new Uint8Array(4);
    this.leftoverSize = 0;
    this.get = GETS[bo];
  }

  /**
   * @override
   * @param {!Uint8Array} [src]
   * @returns {string}
   */
  // @ts-ignore
  decode(src) {
    if (!src) {
      return this.leftoverSize ? String.fromCharCode(REPLACEMENT_CHARACTER_CODE) : "";
    }

    // each 4 bytes is a symbol, which can be written as 2 UTF-16 code units (4 bytes also) plus 4 bytes for leftover
    const dst = new Uint8Array(src.length + 4);

    // "src" index
    let i = 0;

    // "dst" index
    let j = 0;

    if (this.leftoverSize) {
      while (this.leftoverSize < 4 && i < src.length) {
        this.leftover[this.leftoverSize++] = src[i++];
      }

      if (this.leftoverSize < 4) {
        // not enough bytes still
        return "";
      }

      j = appendCodePoint(dst, j, this.get(this.leftover, 0));
    }

    const max = src.length - 3;
    for (; i < max; i += 4) {
      j = appendCodePoint(dst, j, this.get(src, i));
    }

    // save leftover if needed
    this.leftoverSize = src.length - i;
    if (this.leftoverSize) {
      this.leftover.set(src.subarray(i));
    }

    // "dst" always contains correct UTF-16LE code units
    return new TextDecoder(UTF16, { ignoreBOM: this.noBOM }).decode(dst.subarray(0, j));
  }
}

/**
 * Append Code Point [0-0x10ffff] to Uint8Array as one or two UTF-16LE code units
 * @param {!Uint8Array} dst
 * @param {number} j
 * @param {number} c
 * @returns {number}
 */
function appendCodePoint(dst, j, c) {
  if (c > 0x10ffff) {
    c = REPLACEMENT_CHARACTER_CODE;
  }

  if (c > 0xffff) {
    c -= 0x10000;
    const high = 0xd800 | (c >> 10);
    const low = 0xdc00 | (c & 0x3ff);
    dst[j++] = high;
    dst[j++] = high >> 8;
    c = low;
  }

  dst[j++] = c;
  dst[j++] = c >> 8;

  return j;
}

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @returns {number}
 */
function put16LE(src, i, dst, j) {
  const c = src.charCodeAt(i);
  dst[j] = c;
  dst[j + 1] = c >> 8;
  return i;
}

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @returns {number}
 */
function put16BE(src, i, dst, j) {
  const c = src.charCodeAt(i);
  dst[j] = c >> 8;
  dst[j + 1] = c;
  return i;
}

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @returns {number}
 */
function put32LE(src, i, dst, j) {
  const c = /** @type {number} */ (src.codePointAt(i));
  dst[j] = c;
  dst[j + 1] = c >> 8;
  dst[j + 2] = c >> 16;
  dst[j + 3] = c >> 24;
  return c > 0xffff ? i + 1 : i;
}

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @returns {number}
 */
function put32BE(src, i, dst, j) {
  const c = /** @type {number} */ (src.codePointAt(i));
  dst[j] = c >> 24;
  dst[j + 1] = c >> 16;
  dst[j + 2] = c >> 8;
  dst[j + 3] = c;
  return c > 0xffff ? i + 1 : i;
}

/**
 * @param {!Uint8Array} src
 * @param {number} i
 * @returns {number}
 */
function get32LE(src, i) {
  return (src[i] | (src[i + 1] << 8) | (src[i + 2] << 16) | (src[i + 3] << 24)) >>> 0;
}

/**
 * @param {!Uint8Array} src
 * @param {number} i
 * @returns {number}
 */
function get32BE(src, i) {
  return ((src[i] << 24) | (src[i + 1] << 16) | (src[i + 2] << 8) | src[i + 3]) >>> 0;
}

/**
 * @type {!Array<string>}
 */
const POSTFIX = ["LE", "BE", ""];
const UTF16 = "UTF-16";
const UTF32 = "UTF-32";
const UTF8 = "UTF-8";
const NAMES = [UTF16, UTF32, UTF8];

/**
 * @type {!Array<!Array<function(string, number, !Uint8Array, number):number>>}
 */
const PUTS = [
  [put16LE, put16BE],
  [put32LE, put32BE],
];

/**
 * @type {!Array<function(!Uint8Array, number):number>}
 */
const GETS = [get32LE, get32BE];

/**
 * @type {!Array<number>}
 */
const SZ = [2, 4];

/* eslint-disable jsdoc/valid-types */

/**
 * @type {!Array<function(new: ns.CharsetDecoder, ...*)>}
 */
const DECODERS = [UTF16Decoder, UTF32Decoder, UTF8Decoder];

/**
 * @type {!Array<function(new: ns.CharsetEncoder, ...*)>}
 */
const ENCODERS = [UnicodeEncoder, UnicodeEncoder, UTF8Encoder];

/* eslint-enable jsdoc/valid-types */

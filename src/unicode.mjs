import { Charset, CharsetEncoderBase, NativeCharsetDecoder, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";

const BOM_CHAR = "\ufeff";
const STRIP_BOM_DEFAULT = true;
const ADD_BOM_DEFAULT = false;

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @return {number}
 */
const put16LE = (src, i, dst, j) => {
  const cp = src.charCodeAt(i);
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  return 0;
};

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @return {number}
 */
const put16BE = (src, i, dst, j) => {
  const cp = src.charCodeAt(i);
  dst[j] = cp >> 8;
  dst[j + 1] = cp;
  return 0;
};

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @return {number}
 */
const put32LE = (src, i, dst, j) => {
  const cp = /** @type {number} */ (src.codePointAt(i));
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  dst[j + 2] = cp >> 16;
  dst[j + 3] = cp >> 24;
  return cp > 0xffff ? 1 : 0;
};

/**
 * @param {string} src
 * @param {number} i
 * @param {!Uint8Array} dst
 * @param {number} j
 * @return {number}
 */
const put32BE = (src, i, dst, j) => {
  const cp = /** @type {number} */ (src.codePointAt(i));
  dst[j] = cp >> 24;
  dst[j + 1] = cp >> 16;
  dst[j + 2] = cp >> 8;
  dst[j + 3] = cp;
  return cp > 0xffff ? 1 : 0;
};

/**
 * @param {!Uint8Array} src
 * @param {number} i
 * @return {number}
 */
const get32LE = (src, i) => (src[i] | (src[i + 1] << 8) | (src[i + 2] << 16) | (src[i + 3] << 24)) >>> 0;

/**
 * @param {!Uint8Array} src
 * @param {number} i
 * @return {number}
 */
const get32BE = (src, i) => ((src[i] << 24) | (src[i + 1] << 16) | (src[i + 2] << 8) | src[i + 3]) >>> 0;

/**
 * Append Code Point [0-0x10ffff] to Uint8Array as one or two UTF-16LE code units
 * @param {!Uint8Array} dst
 * @param {number} j
 * @param {number} cp
 * @return {number}
 */
const appendCodePoint = (dst, j, cp) => {
  if (cp > 0x10ffff) {
    cp = REPLACEMENT_CHARACTER_CODE;
  }
  if (cp > 0xffff) {
    cp -= 0x10000;
    const high = 0xd800 | (cp >> 10);
    const low = 0xdc00 | (cp & 0x3ff);
    dst[j] = high;
    dst[j + 1] = high >> 8;
    dst[j + 2] = low;
    dst[j + 3] = low >> 8;
    return 4;
  }
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  return 2;
};

// UTF-8

/**
 * @implements {ns.CharsetDecoder}
 */
class UTF8Decoder extends NativeCharsetDecoder {
  /**
   * @param {boolean} noBOM - stripBOM
   */
  constructor(noBOM) {
    super(new TextDecoder("UTF-8", { ignoreBOM: noBOM }));
  }
}

/**
 * @implements {ns.CharsetEncoder}
 */
class UTF8Encoder extends CharsetEncoderBase {
  /**
   * @param {boolean} doBOM
   */
  constructor(doBOM) {
    super();
    this.doBOM = doBOM;
    this.appendBOM = doBOM;
    this.encoder = new TextEncoder();
  }

  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @return {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(src, dst) {
    const { appendBOM } = this;
    let j = 0;
    if (appendBOM) {
      if (dst.length < 3) {
        return { read: 0, written: 0 };
      }
      dst[0] = 0xef;
      dst[1] = 0xbb;
      dst[2] = 0xbf;
      j += 3;
      this.appendBOM = false;
    }
    const { read, written } = this.encoder.encodeInto(src, dst.subarray(j));
    return { read, written: written + j };
  }

  /**
   * @override
   * @param {string} src
   * @return {number}
   */
  byteLengthMax(src) {
    return (this.doBOM ? 4 : 0) + src.length * 4;
  }

  /**
   * @override
   */
  reset() {
    this.appendBOM = this.doBOM;
  }
}

/**
 * UTF16/32 Encoder
 * @implements {ns.CharsetEncoder}
 */
class UnicodeEncoder extends CharsetEncoderBase {
  /**
   * @param {boolean} doBOM
   * @param {number} i - 0 for UTF-16, 1 for UTF-32
   * @param {number} bo - 0 for LE, 1 for BE
   */
  constructor(doBOM, i, bo) {
    super();
    this.doBOM = doBOM;
    this.appendBOM = doBOM;
    this.sz = 1 << (i + 1);
    // eslint-disable-next-line no-nested-ternary
    this.put = i ? (bo ? put32BE : put32LE) : bo ? put16BE : put16LE;
  }

  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @return {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(src, dst) {
    const { appendBOM, sz, put } = this;
    let j = 0;
    if (appendBOM) {
      if (dst.length < sz) {
        return { read: 0, written: 0 };
      }
      put(BOM_CHAR, 0, dst, j);
      j += sz;
      this.appendBOM = false;
    }
    const max = Math.min(src.length, (dst.length - j) & ~(sz - 1));
    for (let i = 0; i < max; i++, j += sz) {
      i += put(src, i, dst, j);
    }
    return { read: max, written: j };
  }

  /**
   * @override
   * @param {string} text
   * @return {number}
   */
  byteLengthMax(text) {
    return (this.doBOM ? this.sz : 0) + text.length * this.sz;
  }

  /**
   * @override
   * @param {string} text
   * @return {number}
   */
  byteLength(text) {
    if (this.sz === 4) {
      // UTF-32: a surrogate pair (two UTF-16 code units) is one UTF-32 code unit (4 bytes)
      return super.byteLength(text);
    }
    // UTF-16
    return this.byteLengthMax(text);
  }

  /**
   * @override
   */
  reset() {
    this.appendBOM = this.doBOM;
  }
}

/**
 * @type {!Array<string>}
 */
const POSTFIX = ["LE", "BE", ""];
const NAMES = [16, 32, 8];

// UTF-16

/**
 * @implements {ns.CharsetDecoder}
 */
export class UTF16Decoder extends NativeCharsetDecoder {
  /**
   * @param {boolean} noBOM
   * @param {number} bo
   */
  constructor(noBOM, bo) {
    super(new TextDecoder("UTF-16" + POSTFIX[bo], { ignoreBOM: noBOM }));
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
    /**
     * @private
     * @constant
     */
    this.get32 = bo ? get32BE : get32LE;
  }

  /**
   * @override
   * @param {!Uint8Array} [src]
   * @return {string}
   */
  // @ts-expect-error
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

      j += appendCodePoint(dst, j, this.get32(this.leftover, 0));
    }

    const max = src.length - 3;
    for (; i < max; i += 4) {
      j += appendCodePoint(dst, j, this.get32(src, i));
    }

    // save leftover if needed
    this.leftoverSize = src.length - i;
    if (this.leftoverSize) {
      this.leftover.set(src.subarray(i));
    }

    // "dst" always contains correct UTF-16LE code units
    return new TextDecoder("UTF-16", { ignoreBOM: this.noBOM }).decode(dst.subarray(0, j));
  }
}

/**
 * @type {!Array<function(new: ns.CharsetDecoder, ...*)>}
 */
const DECODERS = [UTF16Decoder, UTF32Decoder, UTF8Decoder];

/**
 * @type {!Array<function(new: ns.CharsetEncoder, ...*)>}
 */
const ENCODERS = [UnicodeEncoder, UnicodeEncoder, UTF8Encoder];

/**
 * @implements {ns.Encoding}
 */
class UnicodeCharset extends Charset {
  /**
   * @param {number} i - 0 for UTF-16, 1 for UTF-32, 2 for UTF-8
   * @param {number} bo - 0 for LE, 1 for BE, 2 for none
   */
  constructor(i, bo) {
    super("UTF-" + NAMES[i] + POSTFIX[bo]);
    this.i = i;
    this.bo = bo;
  }

  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @return {!ns.CharsetDecoder}
   */
  // @ts-expect-error
  newDecoder(options) {
    return new DECODERS[this.i](!(options?.stripBOM ?? STRIP_BOM_DEFAULT), this.bo);
  }

  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @return {!ns.CharsetEncoder}
   */
  // @ts-expect-error
  newEncoder(options) {
    return new ENCODERS[this.i](options?.addBOM ?? ADD_BOM_DEFAULT, this.i, this.bo);
  }
}

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
   * @return {!ns.Encoding}
   */
  // @ts-expect-error
  create() {
    return new UnicodeCharset(this.i, this.bo);
  }
}

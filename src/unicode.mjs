import { byteLengthDefault, createEncoding, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { ByteLengthFn, CreateDecodeStateFn, CreateEncodeStateFn, DecodeFn, DecoderOperations, EncodeIntoFn, EncoderOperations } from "./types.mjs";

const MAX_BPM = 0xffff;
const MAX_CODE_POINT = 0x10ffff;
const BOM_CHAR = "\ufeff";
const STRIP_BOM_DEFAULT = true;
const ADD_BOM_DEFAULT = false;

const HIGH_SURROGATE_FROM = 0xd800; // 0xD800 <= high <= 0xDBFF
const LOW_SURROGATE_FROM = 0xdc00; // 0xDC00 <= low <= 0xDFFF

/**
 * @typedef {function(string,number,!Uint8Array,number):number}
 */
const PutFn = {};

/**
 * @typedef {function(!Uint8Array,number):number}
 */
const Get32Fn = {};

/**
 * @type {!PutFn}
 */
const put16LE = (src, i, dst, j) => {
  const cp = src.charCodeAt(i);
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  return 0;
};

/**
 * @type {!PutFn}
 */
const put16BE = (src, i, dst, j) => {
  const cp = src.charCodeAt(i);
  dst[j] = cp >> 8;
  dst[j + 1] = cp;
  return 0;
};

/**
 * @type {!PutFn}
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
 * @type {!PutFn}
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
 * @type {!Get32Fn}
 */
const get32LE = (src, i) => (src[i] | (src[i + 1] << 8) | (src[i + 2] << 16) | (src[i + 3] << 24)) >>> 0;

/**
 * @type {!Get32Fn}
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
  if (cp <= MAX_BPM) {
    // hot path: 99%
    dst[j] = cp;
    dst[j + 1] = cp >> 8;
    return 2;
  }
  if (cp > MAX_CODE_POINT) {
    dst[j] = REPLACEMENT_CHARACTER_CODE;
    dst[j + 1] = REPLACEMENT_CHARACTER_CODE >> 8;
    return 2;
  }
  // write surrogate pair
  cp -= 0x10000;
  const high = HIGH_SURROGATE_FROM | (cp >> 10);
  const low = LOW_SURROGATE_FROM | (cp & 0x3ff);
  dst[j] = high;
  dst[j + 1] = high >> 8;
  dst[j + 2] = low;
  dst[j + 3] = low >> 8;
  return 4;
};

// UTF-8 DECODE

/**
 * @typedef {{
 *  decoder: !TextDecoder,
 * }}
 */
const DecodeStateUTF8 = {};

/**
 * @type {!CreateDecodeStateFn}
 */
const createDecodeStateUTF8 = (charsetCtx, options) => {
  const noBOM = !(options.stripBOM ?? STRIP_BOM_DEFAULT);
  /**
   * @type {!DecodeStateUTF8}
   */
  const state = {
    decoder: new TextDecoder("UTF-8", { ignoreBOM: noBOM }),
  };
  return state;
};

/**
 * @type {!DecodeFn}
 */
const decodeUTF8 = (decodeState, input) => {
  const state = /** @type {!DecodeStateUTF8} */ (decodeState);
  return state.decoder.decode(input, { stream: Boolean(input) });
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpUTF8 = {
  createDecodeStateFn: createDecodeStateUTF8,
  decodeFn: decodeUTF8,
};

// UTF-8 ENCODE

/**
 * @typedef {{
 *  doBOM: boolean,
 *  appendBOM: boolean,
 *  encoder: !TextEncoder,
 *  highSurrogate: string,
 * }}
 */
const EncodeStateUTF8 = {};

/**
 * @type {!CreateEncodeStateFn}
 */
const createEncodeStateUTF8 = (charsetCtx, options) => {
  const doBOM = options.addBOM ?? ADD_BOM_DEFAULT;
  /**
   * @type {!EncodeStateUTF8}
   */
  const state = {
    doBOM,
    appendBOM: doBOM,
    encoder: new TextEncoder(),
    highSurrogate: "",
  };
  return state;
};

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoUTF8 = (encodeState, src, dst) => {
  const state = /** @type {!EncodeStateUTF8} */ (encodeState);
  const { appendBOM } = state;
  let j = 0;
  if (appendBOM) {
    if (dst.length < 3) {
      return { read: 0, written: 0 };
    }
    dst[0] = 0xef;
    dst[1] = 0xbb;
    dst[2] = 0xbf;
    j += 3;
    state.appendBOM = false;
  }

  if (state.highSurrogate) {
    src = state.highSurrogate + src;
    state.highSurrogate = "";
  }

  const len1 = src.length - 1;
  if (src.length > 0) {
    const code = src.charCodeAt(len1);
    if (code >= HIGH_SURROGATE_FROM && code < LOW_SURROGATE_FROM) {
      state.highSurrogate = src.charAt(len1);
      src = src.slice(0, len1);
    }
  }

  const { read, written } = state.encoder.encodeInto(src, dst.subarray(j));
  return { read: read + (state.highSurrogate ? 1 : 0), written: written + j };
};

/**
 * @type {!ByteLengthFn}
 */
const byteLengthMaxUTF8 = (encodeState, op, text) => {
  const state = /** @type {!EncodeStateUTF8} */ (encodeState);
  return (state.doBOM ? 4 : 0) + text.length * 4;
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpUTF8 = {
  createEncodeStateFn: createEncodeStateUTF8,
  encodeIntoFn: encodeIntoUTF8,
  byteLengthMaxFn: byteLengthMaxUTF8,
  byteLengthFn: byteLengthDefault,
};

// UTF-16 DECODE

/**
 * @typedef {{
 *  decoder: !TextDecoder,
 * }}
 */
const DecodeStateUTF16 = {};

/**
 * @type {!CreateDecodeStateFn}
 */
const createDecodeStateUTF16 = (charsetCtx, options) => {
  const ctx = /** @type {!UnicodeCharsetContext} */ (charsetCtx);
  const noBOM = !(options.stripBOM ?? STRIP_BOM_DEFAULT);
  const { bo } = ctx;
  /**
   * @type {!DecodeStateUTF16}
   */
  const state = {
    decoder: new TextDecoder("UTF-16" + ["LE", "BE"][bo], { ignoreBOM: noBOM }),
  };
  return state;
};

/**
 * @type {!DecodeFn}
 */
const decodeUTF16 = (decodeState, input) => {
  const state = /** @type {!DecodeStateUTF16} */ (decodeState);
  return state.decoder.decode(input, { stream: Boolean(input) });
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpUTF16 = {
  createDecodeStateFn: createDecodeStateUTF16,
  decodeFn: decodeUTF16,
};

// UTF-32 DECODE

/**
 * @typedef {{
 *  leftover: !Uint8Array,
 *  leftoverSize: number,
 *  get32: !Get32Fn,
 *  noBOM: boolean,
 * }}
 */
const DecodeStateUTF32 = {};

/**
 * @type {!CreateDecodeStateFn}
 */
const createDecodeStateUTF32 = (charsetCtx, options) => {
  const ctx = /** @type {!UnicodeCharsetContext} */ (charsetCtx);
  /**
   * @type {!DecodeStateUTF32}
   */
  const state = {
    leftover: new Uint8Array(4),
    leftoverSize: 0,
    get32: ctx.bo ? get32BE : get32LE,
    noBOM: !(options.stripBOM ?? STRIP_BOM_DEFAULT),
  };
  return state;
};

/**
 * @type {!DecodeFn}
 */
const decodeUTF32 = (decodeState, input) => {
  const state = /** @type {!DecodeStateUTF32} */ (decodeState);
  const { leftover, get32, noBOM } = state;
  if (!input) {
    if (state.leftoverSize) {
      state.leftoverSize = 0;
      return String.fromCharCode(REPLACEMENT_CHARACTER_CODE);
    }
    return "";
  }

  // each 4 bytes is a symbol, which can be written as 2 UTF-16 code units (4 bytes also) plus 4 bytes for leftover
  const dst = new Uint8Array(input.length + 4);

  // "src" index
  let i = 0;

  // "dst" index
  let j = 0;

  // process leftover
  if (state.leftoverSize) {
    while (state.leftoverSize < 4 && i < input.length) {
      leftover[state.leftoverSize++] = input[i++];
    }

    if (state.leftoverSize < 4) {
      // not enough bytes still
      return "";
    }

    j += appendCodePoint(dst, j, get32(leftover, 0));
  }

  const max = input.length - 3;
  for (; i < max; i += 4) {
    j += appendCodePoint(dst, j, get32(input, i));
  }

  // save leftover if needed
  state.leftoverSize = input.length - i;
  if (state.leftoverSize) {
    leftover.set(input.subarray(i));
  }

  // "dst" always contains correct UTF-16LE code units
  return new TextDecoder("UTF-16", { ignoreBOM: noBOM }).decode(dst.subarray(0, j));
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpUTF32 = {
  createDecodeStateFn: createDecodeStateUTF32,
  decodeFn: decodeUTF32,
};

// UTF-16/32 ENCODE

/**
 * @typedef {{
 *  doBOM: boolean,
 *  appendBOM: boolean,
 *  sz: number,
 *  put: !PutFn,
 * }}
 */
const EncodeStateUTF = {};

/**
 * @type {!CreateEncodeStateFn}
 */
const createEncodeStateUTF = (charsetCtx, options) => {
  const { i, bo } = /** @type {!UnicodeCharsetContext} */ (charsetCtx);
  const doBOM = options.addBOM ?? ADD_BOM_DEFAULT;
  /**
   * @type {!EncodeStateUTF}
   */
  const state = {
    doBOM,
    appendBOM: doBOM,
    sz: 1 << (i + 1),
    put: i ? (bo ? put32BE : put32LE) : bo ? put16BE : put16LE,
  };
  return state;
};

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoUTF = (encodeState, src, dst) => {
  const state = /** @type {!EncodeStateUTF} */ (encodeState);
  const { appendBOM, sz, put } = state;
  let j = 0;
  if (appendBOM) {
    if (dst.length < sz) {
      return { read: 0, written: 0 };
    }
    put(BOM_CHAR, 0, dst, j);
    j += sz;
    state.appendBOM = false;
  }
  const max = Math.min(src.length, (dst.length - j) & ~(sz - 1));
  for (let i = 0; i < max; i++, j += sz) {
    i += put(src, i, dst, j);
  }
  return { read: max, written: j };
};

/**
 * @type {!ByteLengthFn}
 */
const byteLengthMaxUTF = (encodeState, op, text) => {
  const state = /** @type {!EncodeStateUTF} */ (encodeState);
  return (state.doBOM ? state.sz : 0) + text.length * state.sz;
};

/**
 * @type {!ByteLengthFn}
 */
const byteLengthUTF = (encodeState, op, text) => {
  const state = /** @type {!EncodeStateUTF} */ (encodeState);
  if (state.sz === 4) {
    // UTF-32: a surrogate pair (two UTF-16 code units) is one UTF-32 code unit (4 bytes)
    return byteLengthDefault(state, op, text);
  }
  // UTF-16
  return byteLengthMaxUTF(state, op, text);
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpUTF = {
  createEncodeStateFn: createEncodeStateUTF,
  encodeIntoFn: encodeIntoUTF,
  byteLengthMaxFn: byteLengthMaxUTF,
  byteLengthFn: byteLengthUTF,
};

/**
 * @typedef {{
 *  i: number,
 *  decoderOp: !DecoderOperations,
 *  encoderOp: !EncoderOperations,
 * }}
 */
const CharsetConfig = {};

/**
 * @type {!Array<!CharsetConfig>}
 */
const CHARSET_CONFIG = [
  {
    i: 16,
    decoderOp: decoderOpUTF16,
    encoderOp: encoderOpUTF,
  },
  {
    i: 32,
    decoderOp: decoderOpUTF32,
    encoderOp: encoderOpUTF,
  },
  {
    i: 8,
    decoderOp: decoderOpUTF8,
    encoderOp: encoderOpUTF8,
  },
];

/**
 * @typedef {{
 *   charsetName: string,
 *   i: number,
 *   bo: number,
 * }}
 */
const UnicodeCharsetContext = {};

/**
 * @implements {ns.EncodingFactory}
 */
export class Unicode {
  /**
   * @param {number} i
   * @param {number} bo
   */
  constructor(i, bo) {
    const cfg = CHARSET_CONFIG[i];
    /**
     * @type {!UnicodeCharsetContext}
     */
    const ctx = { charsetName: "UTF-" + cfg.i + ["LE", "BE", ""][bo], i, bo };
    this.encoding = createEncoding(ctx, cfg.decoderOp, cfg.encoderOp);
  }

  /**
   * @override
   * @return {!ns.Encoding}
   */
  // @ts-expect-error
  create() {
    return this.encoding;
  }
}

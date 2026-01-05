import { isNativeDecoderSupported, nativeDecoderOp } from "./native.mjs";
import { ByteLengthFn, ByteLengthMaxFn, CharsetContext, DecodeEndFn, DecoderOperations, DecodeState, EncoderOperations, EncodeState, FlushIntoFn } from "./types.mjs";

export const TEXT_ENCODER = new TextEncoder();

/**
 * @type {number}
 */
export const REPLACEMENT_CHARACTER_CODE = 0xfffd; // �

/**
 * @type {number}
 */
export const DEFAULT_CHAR_BYTE = 63; // "?"

export const MAX_BPM = 0xffff;
export const MAX_CODE_POINT = 0x10ffff;
export const BOM_CHAR_CODE = 0xfeff;
export const STRIP_BOM_DEFAULT = true;
export const ADD_BOM_DEFAULT = false;

export const HIGH_SURROGATE_FROM = 0xd800; // 0xD800 <= high <= 0xDBFF
export const LOW_SURROGATE_FROM = 0xdc00; // 0xDC00 <= low <= 0xDFFF

const STRING_SMALLSIZE = 192;
const STRING_CHUNKSIZE = 1024;
const UTF16LE = new TextDecoder("utf-16le", { fatal: true, ignoreBOM: true });
const MAX_PREPEND_BYTES = 4;
const MAX_LEFTOVER_BYTES = 4;

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
    return UTF16LE.decode(u16);
  } catch {
    return getStringFallback(u16);
  }
};

/**
 * @param {number} num
 * @return {boolean}
 */
export const isMapped = (num) => num !== REPLACEMENT_CHARACTER_CODE;

/**
 * @type {!DecodeEndFn}
 */
export const decodeEndDummy = () => "";

/**
 * @type {!FlushIntoFn}
 */
export const flushIntoDummy = () => {
  // no-op
};

/**
 * @type {!ByteLengthMaxFn}
 */
export const byteLengthMax1X = (str) => str.length;

/**
 * @type {!ByteLengthMaxFn}
 */
export const byteLengthMax2X = (str) => 2 * str.length;

/**
 * @type {!ByteLengthMaxFn}
 */
export const byteLengthMax4X = (str) => 4 * str.length;

/**
 * @typedef {function(number,!Uint8Array,number):void}
 */
export const PutFn = {};

/**
 * @typedef {function(!Uint8Array,number):number}
 */
export const Get32Fn = {};

/**
 * @type {!PutFn}
 */
export const put16LE = (cp, buf, i) => {
  buf[i] = cp;
  buf[i + 1] = cp >> 8;
};

/**
 * @type {!PutFn}
 */
export const put16BE = (cp, buf, i) => {
  buf[i] = cp >> 8;
  buf[i + 1] = cp;
};

/**
 * @type {!PutFn}
 */
export const put32LE = (cp, buf, i) => {
  buf[i] = cp;
  buf[i + 1] = cp >> 8;
  buf[i + 2] = cp >> 16;
  buf[i + 3] = cp >> 24;
};

/**
 * @type {!PutFn}
 */
export const put32BE = (cp, buf, i) => {
  buf[i] = cp >> 24;
  buf[i + 1] = cp >> 16;
  buf[i + 2] = cp >> 8;
  buf[i + 3] = cp;
};

/**
 * @type {!Get32Fn}
 */
export const get32LE = (buf, i) => (buf[i] | (buf[i + 1] << 8) | (buf[i + 2] << 16) | (buf[i + 3] << 24)) >>> 0;

/**
 * @type {!Get32Fn}
 */
export const get32BE = (buf, i) => ((buf[i] << 24) | (buf[i + 1] << 16) | (buf[i + 2] << 8) | buf[i + 3]) >>> 0;

/**
 * Append Code Point [0-0x10ffff] to Uint8Array as one or two UTF-16LE code units
 * @param {number} cp
 * @param {!Uint16Array} buf
 * @param {number} i
 * @return {number}
 */
export const appendCodePoint = (cp, buf, i) => {
  if (cp <= MAX_BPM) {
    // hot path: 99%
    buf[i] = cp;
    return 1;
  }
  if (cp > MAX_CODE_POINT) {
    buf[i] = REPLACEMENT_CHARACTER_CODE;
    return 1;
  }
  // write surrogate pair
  cp -= 0x10000;
  buf[i] = HIGH_SURROGATE_FROM | (cp >> 10);
  buf[i + 1] = LOW_SURROGATE_FROM | (cp & 0x3ff);
  return 2;
};

const TEMP_BUFFER = new Uint8Array(4096);

/**
 * @type {!ByteLengthFn}
 */
export const byteLengthDefault = (str, ctx, op) => {
  const state = op.createEncodeStateFn(ctx, {});
  do {
    const read = state.r;
    op.encodeIntoFn(state, str, TEMP_BUFFER);
    str = str.slice(state.r - read);
  } while (str.length);
  op.flushIntoFn(state, TEMP_BUFFER);
  return state.w;
};

/**
 * @implements {ns.DecoderStream}
 */
class DecoderStream {
  /**
   * @param {!DecodeState} state
   * @param {!DecoderOperations} op
   */
  constructor(state, op) {
    this.state = state;
    this.op = op;
  }

  /**
   * @override
   * @param {!Uint8Array} buf
   * @return {string}
   */
  // @ts-expect-error
  write(buf) {
    return this.op.decodeFn(this.state, buf);
  }

  /**
   * @override
   * @return {string}
   */
  // @ts-expect-error
  end() {
    return this.op.decodeEndFn(this.state);
  }
}

/**
 * @implements {ns.EncoderStream}
 */
class EncoderStream {
  /**
   * @param {!EncodeState} state
   * @param {!EncoderOperations} op
   */
  constructor(state, op) {
    /**
     * @private
     * @constant
     */
    this.state = state;
    /**
     * @private
     * @constant
     */
    this.op = op;
  }

  /**
   * @override
   * @param {string} str
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  write(str) {
    const { state, op } = this;
    const buf = new Uint8Array(op.byteLengthMaxFn(str) + MAX_PREPEND_BYTES);
    const writtenBefore = state.w;
    op.encodeIntoFn(state, str, buf);
    // assert state.r === str.length;
    return buf.subarray(0, state.w - writtenBefore);
  }

  /**
   * @override
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  end() {
    const { state, op } = this;
    const buf = new Uint8Array(MAX_LEFTOVER_BYTES);
    const writtenBefore = state.w;
    op.flushIntoFn(state, buf);
    return buf.subarray(0, state.w - writtenBefore);
  }

  // --- Low-Level Encoding APIs ---

  /**
   * @override
   * @param {string} str
   * @param {!Uint8Array} buf
   * @return {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(str, buf) {
    const { state, op } = this;
    const readBefore = state.r;
    const writtenBefore = state.w;
    op.encodeIntoFn(state, str, buf);
    return { read: state.r - readBefore, written: state.w - writtenBefore };
  }

  /**
   * @override
   * @param {!Uint8Array} buf
   * @return {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  flushInto(buf) {
    const { state, op } = this;
    const readBefore = state.r;
    const writtenBefore = state.w;
    op.flushIntoFn(state, buf);
    return { read: state.r - readBefore, written: state.w - writtenBefore };
  }
}

/**
 * @implements {ns.Encoding}
 */
class Encoding {
  /**
   * @param {!CharsetContext} ctx
   * @param {!DecoderOperations} decoderOp
   * @param {?DecoderOperations} decoderOpFast
   * @param {!EncoderOperations} encoderOp
   * @param {?EncoderOperations} encoderOpFast
   */
  constructor(
    //
    ctx,
    decoderOp,
    decoderOpFast,
    encoderOp,
    encoderOpFast,
  ) {
    /**
     * @private
     * @constant
     */
    this.ctx = ctx;
    /**
     * @private
     * @constant
     */
    this.decoderOp = decoderOp;
    /**
     * @private
     * @constant
     */
    this.decoderOpFast = decoderOpFast;
    /**
     * @private
     * @constant
     */
    this.encoderOp = encoderOp;
    /**
     * @private
     * @constant
     */
    this.encoderOpFast = encoderOpFast;
    /**
     * @private
     * @constant
     */
    this.nativeDecoderSupported = isNativeDecoderSupported(ctx.charsetName);
  }

  /**
   * @override
   * @return {string}
   */
  // @ts-expect-error
  getName() {
    return this.ctx.charsetName;
  }

  /**
   * @override
   * @param {!Uint8Array} buf
   * @param {!ns.DecodeOptions} [options]
   * @return {string}
   */
  // @ts-expect-error
  decode(buf, options) {
    const decoder = this.getDecoder(options);
    const body = decoder.write(buf);
    const tail = decoder.end();
    return tail ? body + tail : body;
  }

  /**
   * @override
   * @param {string} str
   * @param {!ns.EncodeOptions} [options]
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  encode(str, options) {
    options ??= {};
    const op = this.getEncoderOp(options);
    const state = op.createEncodeStateFn(this.ctx, options);
    const buf = new Uint8Array(op.byteLengthMaxFn(str) + MAX_PREPEND_BYTES);
    op.encodeIntoFn(state, str, buf);
    op.flushIntoFn(state, buf);
    return buf.subarray(0, state.w);
  }

  /**
   * @override
   * @param {string} str
   * @return {number}
   */
  // @ts-expect-error
  byteLength(str) {
    const { ctx, encoderOp } = this;
    return encoderOp.byteLengthFn(str, ctx, encoderOp);
  }

  // --- Low-level Stream APIs ---

  /**
   * @override
   * @param {!ns.DecodeOptions} [options]
   * @return {!DecoderStream}
   */
  // @ts-expect-error
  getDecoder(options) {
    options ??= {};
    const op = this.getDecoderOp(options);
    const state = op.createDecodeStateFn(this.ctx, options);
    return new DecoderStream(state, op);
  }

  /**
   * @override
   * @param {!ns.EncodeOptions} [options]
   * @return {!EncoderStream}
   */
  // @ts-expect-error
  getEncoder(options) {
    options ??= {};
    const op = this.getEncoderOp(options);
    const state = op.createEncodeStateFn(this.ctx, options);
    return new EncoderStream(state, op);
  }

  // Private

  /**
   * @private
   * @param {!ns.DecodeOptions} options
   * @return {!DecoderOperations}
   */
  getDecoderOp(options) {
    if (this.nativeDecoderSupported && options.native) {
      return nativeDecoderOp;
    }
    return this.decoderOpFast && typeof options.defaultCharUnicode !== "function"
      ? this.decoderOpFast //
      : this.decoderOp;
  }

  /**
   * @private
   * @param {!ns.EncodeOptions} options
   * @return {!EncoderOperations}
   */
  getEncoderOp(options) {
    return this.encoderOpFast && typeof options.defaultCharByte !== "function"
      ? this.encoderOpFast //
      : this.encoderOp;
  }
}

/**
 * @param {!CharsetContext} ctx
 * @param {!DecoderOperations} decoderOp
 * @param {!DecoderOperations} decoderOpFast
 * @param {!EncoderOperations} encoderOp
 * @param {!EncoderOperations} encoderOpFast
 * @return {!ns.Encoding}
 */
export const createEncodingFast = (
  //
  ctx,
  decoderOp,
  decoderOpFast,
  encoderOp,
  encoderOpFast,
) =>
  new Encoding(
    //
    ctx,
    decoderOp,
    decoderOpFast,
    encoderOp,
    encoderOpFast,
  );

/**
 * @param {!CharsetContext} ctx
 * @param {!DecoderOperations} decoderOp
 * @param {!EncoderOperations} encoderOp
 * @return {!ns.Encoding}
 */
export const createEncoding = (
  //
  ctx,
  decoderOp,
  encoderOp,
) =>
  createEncodingFast(
    //
    ctx,
    decoderOp,
    decoderOp,
    encoderOp,
    encoderOp,
  );

/**
 * @implements {ns.EncodingFactory}
 */
export class Singleton {
  /**
   * @param {!ns.Encoding} encoding
   */
  constructor(encoding) {
    /**
     * @private
     * @constant
     */
    this.encoding = encoding;
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

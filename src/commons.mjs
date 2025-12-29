import { ByteLengthFn, CharsetContext, DecoderOperations, EncoderOperations } from "./types.mjs";

/**
 * @type {number}
 */
export const REPLACEMENT_CHARACTER_CODE = 0xfffd; // �

/**
 * @type {number}
 */
export const DEFAULT_CHAR_BYTE = 63; // "?"

const STRING_SMALLSIZE = 192;
const STRING_CHUNKSIZE = 1024;
const UTF16LE = new TextDecoder("utf-16le", { fatal: true });

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
 * @type {!ByteLengthFn}
 */
export const byteLengthDefault = (state, op, text) => {
  let total = 0;
  const buf = new Uint8Array(4096);
  do {
    const { read, written } = op.encodeIntoFn(state, text, buf);
    text = text.slice(read);
    total += written;
  } while (text.length);
  return total;
};

/**
 * @implements {ns.CharsetDecoder}
 */
class CharsetDecoder {
  /**
   * @param {!CharsetContext} ctx
   * @param {!DecoderOperations} op
   * @param {!ns.DecoderOptions} [options]
   */
  constructor(ctx, op, options) {
    this.state = op.createDecodeStateFn(ctx, options ?? {});
    this.op = op;
  }

  /**
   * @override
   * @param {!Uint8Array} [src]
   * @return {string}
   */
  // @ts-expect-error
  decode(src) {
    return this.op.decodeFn(this.state, src);
  }
}

/**
 * @implements {ns.CharsetEncoder}
 */
class CharsetEncoder {
  /**
   * @param {!CharsetContext} ctx
   * @param {!EncoderOperations} op
   * @param {!ns.EncoderOptions} [options]
   */
  constructor(ctx, op, options) {
    /**
     * @private
     * @constant
     */
    this.ctx = ctx;
    /**
     * @private
     * @constant
     */
    this.op = op;
    /**
     * @private
     * @constant
     */
    this.options = options ?? {};
    /**
     * @private
     * @constant
     */
    this.state = op.createEncodeStateFn(ctx, this.options);
  }

  /**
   * @override
   * @param {string} [text]
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  encode(text) {
    if (!text) {
      return new Uint8Array(0);
    }
    const { ctx, op, options } = this;
    const maxLen = op.byteLengthMaxFn(op.createEncodeStateFn(ctx, options), op, text);
    const buf = new Uint8Array(maxLen);
    const { written } = op.encodeIntoFn(this.state, text, buf);
    return buf.subarray(0, written);
  }

  /**
   * @override
   * @param {string} text
   * @param {!Uint8Array} dst
   * @return {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(text, dst) {
    return this.op.encodeIntoFn(this.state, text, dst);
  }

  /**
   * @override
   * @param {string} text
   * @return {number}
   */
  // @ts-expect-error
  byteLength(text) {
    const { ctx, op, options } = this;
    return op.byteLengthFn(op.createEncodeStateFn(ctx, options), op, text);
  }
}

/**
 * @implements {ns.Encoding}
 */
class Encoding {
  /**
   * @param {!CharsetContext} ctx
   * @param {!DecoderOperations} decoderOp
   * @param {!EncoderOperations} encoderOp
   */
  constructor(ctx, decoderOp, encoderOp) {
    /**
     * @public
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
    this.encoderOp = encoderOp;
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
   * @param {!Uint8Array} array
   * @param {!ns.DecoderOptions} [options]
   * @return {string}
   */
  // @ts-expect-error
  decode(array, options) {
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
    const encoder = this.newEncoder(options);
    return encoder.encode(text);
  }

  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @return {!ns.CharsetDecoder}
   */
  // @ts-expect-error
  newDecoder(options) {
    return new CharsetDecoder(this.ctx, this.decoderOp, options);
  }

  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @return {!ns.CharsetEncoder}
   */
  // @ts-expect-error
  newEncoder(options) {
    return new CharsetEncoder(this.ctx, this.encoderOp, options);
  }
}

/**
 * @param {!CharsetContext} ctx
 * @param {!DecoderOperations} decoderOp
 * @param {!EncoderOperations} encoderOp
 * @return {!ns.Encoding}
 */
export const createEncoding = (ctx, decoderOp, encoderOp) => new Encoding(ctx, decoderOp, encoderOp);

import { bufferExists, byteLengthMax1X, decodeEndDummy, flushIntoDummy, getString, isMapped, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { createCharsetMapped, createDecodeStateMappedFast, createDecodeStateMapped, createEncodeStateMapped, createEncodeStateMappedFast } from "./mapped.mjs";
import {
  createDecoderOperations,
  createEncoderOperations,
  DecodeFn,
  DecoderOperations,
  DecodeStateMappedFast,
  DecodeStateMapped,
  EncodeIntoFn,
  EncoderOperations,
  EncodeStateMapped,
  MappedEncodingFactory,
  EncodeStateMappedFast,
} from "./types.mjs";

// SBCS DECODE

/**
 * @suppress {undefinedVars|reportUnknownTypes}
 * @type {!DecodeFn}
 */
const decodeSBCS = (decodeState, buf) => {
  const state = /** @type {!DecodeStateMapped} */ (decodeState);
  const b2c = state.b2c;
  const defaultChar = state.defaultChar;
  const handler = /** @type {!ns.DefaultFunction} */ (state.handler);
  const u16 = new Uint16Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const bt = buf[i];
    const ch = b2c[bt];
    u16[i] = isMapped(ch) ? ch : (handler(bt, i) ?? defaultChar);
  }
  // help V8 to inline
  // eslint-disable-next-line no-undef
  return bufferExists ? Buffer.from(u16.buffer, u16.byteOffset, u16.byteLength).toString("ucs2") : getString(u16);
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpSBCS = createDecoderOperations(
  //
  createDecodeStateMapped,
  decodeSBCS,
  decodeEndDummy,
);

// SBCS DECODE FAST (2x times faster)

/**
 * @suppress {undefinedVars|reportUnknownTypes}
 * @type {!DecodeFn}
 */
const decodeSBCSFast = (decodeState, buf) => {
  const state = /** @type {!DecodeStateMappedFast} */ (decodeState);
  const b2c = state.b2c;
  const u16 = new Uint16Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const bt = buf[i];
    const ch = b2c[bt];
    u16[i] = ch;
  }
  // help V8 to inline
  // eslint-disable-next-line no-undef
  return bufferExists ? Buffer.from(u16.buffer, u16.byteOffset, u16.byteLength).toString("ucs2") : getString(u16);
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpSBCSFast = createDecoderOperations(
  //
  createDecodeStateMappedFast,
  decodeSBCSFast,
  decodeEndDummy,
);

// SBCS ENCODE

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoSBCS = (encodeState, str, buf) => {
  const state = /** @type {!EncodeStateMapped} */ (encodeState);
  const c2b = state.c2b;
  const defaultChar = state.defaultChar;
  const handler = /** @type {!ns.DefaultFunction} */ (state.handler);
  const len = Math.min(str.length, buf.length);
  for (let i = 0; i < len; i++) {
    const ch = str.charCodeAt(i);
    const bt = c2b[ch];
    buf[i] = isMapped(bt) ? bt : (handler(ch, i) ?? defaultChar);
  }
  state.r += len;
  state.w += len;
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpSBCS = createEncoderOperations(
  //
  createEncodeStateMapped,
  encodeIntoSBCS,
  flushIntoDummy,
  byteLengthMax1X,
  byteLengthMax1X,
);

// SBCS ENCODE FAST (2x times faster)

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoSBCSFast = (encodeState, str, buf) => {
  const state = /** @type {!EncodeStateMappedFast} */ (encodeState);
  const { c2b } = state;
  const len = Math.min(str.length, buf.length);
  for (let i = 0; i < len; i++) {
    const ch = str.charCodeAt(i);
    const bt = c2b[ch];
    buf[i] = bt;
  }
  state.r += len;
  state.w += len;
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpSBCSFast = createEncoderOperations(
  //
  createEncodeStateMappedFast,
  encodeIntoSBCSFast,
  flushIntoDummy,
  byteLengthMax1X,
  byteLengthMax1X,
);

// MAPPING TABLE

/**
 * @typedef {{
 *            symbols: string,
 *            diff: string,
 *          }}
 */
const CtxSBCS = {};

/**
 * @override
 * @param {!CtxSBCS} ctx
 * @param {!ns.Options} [options]
 * @return {!Uint16Array}
 */
const createTableSBCS = (ctx, options) => {
  const { symbols, diff } = ctx;
  const b2c = new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);
  // applySymbols
  {
    let i = 0;
    while (i < 256 - symbols.length) {
      b2c[i] = i++;
    }
    let j = 0;
    while (i < 256) {
      b2c[i++] = symbols.charCodeAt(j++);
    }
  }
  // applyDiff
  {
    let i = 0;
    while (i < diff.length) {
      b2c[diff.charCodeAt(i)] = diff.charCodeAt(i + 1);
      i += 2;
    }
  }
  // replaceSpecials
  {
    let i = 128;
    while (i < 256) {
      const ch = b2c[i];
      // SPACE means the same character as an index for index >= 128
      if (ch === " ".charCodeAt(0)) {
        b2c[i] = i;
      }
      // QUESTION MARK means replacement character for index >= 128
      if (ch === "?".charCodeAt(0)) {
        b2c[i] = REPLACEMENT_CHARACTER_CODE;
      }
      i++;
    }
  }
  // applyOverrides
  {
    const overrides = options?.overrides ?? [];
    let k = 0;
    while (k < overrides.length - 1) {
      const code = overrides[k++];
      const ch = overrides[k++];
      b2c[Number(code)] = typeof ch === "number" ? ch : ch.charCodeAt(0);
    }
  }
  return b2c;
};

// FACTORY

/**
 * @implements {ns.EncodingFactory}
 * @implements {MappedEncodingFactory}
 */
export class SBCS {
  /**
   * @param {string} charsetName
   * @param {string} symbols
   * @param {string} [diff]
   */
  constructor(charsetName, symbols, diff) {
    /**
     * @private
     * @constant
     */
    this.charsetName = charsetName;
    /**
     * @private
     * @constant
     * @type {!CtxSBCS}
     */
    this.ctx = { symbols, diff: diff ?? "" };
  }

  /**
   * @override
   * @param {!ns.Options} [options]
   * @return {!ns.Encoding}
   */
  // @ts-expect-error
  create(options) {
    return createCharsetMapped(
      //
      this.charsetName,
      this.createTable(options),
      decoderOpSBCS,
      decoderOpSBCSFast,
      encoderOpSBCS,
      encoderOpSBCSFast,
    );
  }

  /**
   * @override
   * @param {!ns.Options} [options]
   * @return {!Uint16Array}
   */
  // @ts-expect-error
  createTable(options) {
    return createTableSBCS(this.ctx, options);
  }
}

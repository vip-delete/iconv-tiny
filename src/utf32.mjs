import {
  ADD_BOM_DEFAULT,
  appendCodePoint,
  BOM_CHAR_CODE,
  byteLengthDefault,
  byteLengthMax4X,
  get32BE,
  Get32Fn,
  get32LE,
  getString,
  HIGH_SURROGATE_FROM,
  put32BE,
  put32LE,
  PutFn,
  REPLACEMENT_CHARACTER_CODE,
  STRIP_BOM_DEFAULT,
} from "./commons.mjs";
import {
  createDecoderOperations,
  CreateDecodeStateFn,
  createEncoderOperations,
  CreateEncodeStateFn,
  DecodeEndFn,
  DecodeFn,
  DecoderOperations,
  EncodeIntoFn,
  EncoderOperations,
  FlushIntoFn,
} from "./types.mjs";
import { CharsetContextUnicode, createUnicodeEncoding } from "./unicode.mjs";

// UTF-32 DECODE

/**
 * @typedef {{
 *            leftover: !Uint8Array,
 *            leftoverSize: number,
 *            get32: !Get32Fn,
 *            removeBOM: boolean,
 *          }}
 */
const DecodeStateUTF32 = {};

/**
 * @type {!CreateDecodeStateFn}
 */
const createDecodeStateUTF32 = (charsetCtx, options) => {
  const { littleEndian } = /** @type {!CharsetContextUnicode} */ (charsetCtx);

  /**
   * @type {!DecodeStateUTF32}
   */
  const state = {
    leftover: new Uint8Array(4),
    leftoverSize: 0,
    get32: littleEndian ? get32LE : get32BE,
    removeBOM: options.stripBOM ?? STRIP_BOM_DEFAULT,
  };

  return state;
};

/**
 * @type {!DecodeFn}
 */
const decodeUTF32 = (decodeState, buf) => {
  const state = /** @type {!DecodeStateUTF32} */ (decodeState);
  const { leftover, get32 } = state;

  // each 4 bytes is a symbol, which can be written as 2 UTF-16 code units (4 bytes also) plus 4 bytes for leftover
  const u16 = new Uint16Array((buf.length >> 1) + 2);

  // "buf" index
  let i = 0;

  // "dst" index
  let j = 0;

  // process leftover
  if (state.leftoverSize) {
    while (state.leftoverSize < 4 && i < buf.length) {
      leftover[state.leftoverSize++] = buf[i++];
    }

    if (state.leftoverSize < 4) {
      // not enough bytes still
      return "";
    }

    j += appendCodePoint(get32(leftover, 0), u16, j);
  }

  for (; i < buf.length - 3; i += 4) {
    j += appendCodePoint(get32(buf, i), u16, j);
  }

  state.leftoverSize = buf.length - i;
  if (state.leftoverSize) {
    leftover.set(buf.subarray(i));
  }

  let str = getString(u16.subarray(0, j));
  if (state.removeBOM && str.charCodeAt(0) === BOM_CHAR_CODE) {
    str = str.slice(1);
    state.removeBOM = false;
  }
  return str;
};

/**
 * @type {!DecodeEndFn}
 */
const decodeEndUTF32 = (decodeState) => {
  const state = /** @type {!DecodeStateUTF32} */ (decodeState);
  if (state.leftoverSize) {
    state.leftoverSize = 0;
    return String.fromCharCode(REPLACEMENT_CHARACTER_CODE);
  }
  return "";
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpUTF32 = createDecoderOperations(
  //
  createDecodeStateUTF32,
  decodeUTF32,
  decodeEndUTF32,
);

// UTF-32LE ENCODE

/**
 * @typedef {{
 *            r: number,
 *            w: number,
 *            appendBOM: boolean,
 *            put: !PutFn,
 *            highSurrogate: number,
 *          }}
 */
const EncodeStateUTF32 = {};

/**
 * @type {!CreateEncodeStateFn}
 */
export const createEncodeStateUTF32 = (charsetCtx, options) => {
  const { littleEndian } = /** @type {!CharsetContextUnicode} */ (charsetCtx);

  /**
   * @type {!EncodeStateUTF32}
   */
  const state = {
    r: 0,
    w: 0,
    appendBOM: options.addBOM ?? ADD_BOM_DEFAULT,
    put: littleEndian ? put32LE : put32BE,
    highSurrogate: 0,
  };

  return state;
};

/**
 * @type {!EncodeIntoFn}
 */
export const encodeIntoUTF32 = (encodeState, str, buf) => {
  const state = /** @type {!EncodeStateUTF32} */ (encodeState);
  const { appendBOM, put } = state;
  let j = 0;
  if (appendBOM) {
    if (buf.length < 4) {
      // not enough space
      return;
    }
    put(BOM_CHAR_CODE, buf, 0);
    j += 4;
    state.appendBOM = false;
  }

  let i = 0;
  let k = 0;
  if (state.highSurrogate) {
    str = String.fromCharCode(state.highSurrogate) + str;
    state.highSurrogate = 0;
    k = 1;
  }

  while (i < str.length) {
    const ch = /** @type {number} */ (str.codePointAt(i));
    if (i === str.length - 1 && ch > HIGH_SURROGATE_FROM) {
      // last symbol is not completed
      state.highSurrogate = ch;
      break;
    }
    if (buf.length - j < 4) {
      // not enough space
      break;
    }
    put(ch, buf, j);
    i += ch > 0xffff ? 2 : 1;
    j += 4;
  }

  state.r += i - k;
  state.w += j;
};

/**
 * @type {!FlushIntoFn}
 */
export const flushIntoUTF32 = (encodeState, buf) => {
  const state = /** @type {!EncodeStateUTF32} */ (encodeState);
  const { put, highSurrogate } = state;

  if (!highSurrogate) {
    // no leftover
    return;
  }

  if (buf.length < 4) {
    // not enough space
    return;
  }

  put(highSurrogate, buf, 0);
  state.highSurrogate = 0;

  state.r += 0;
  state.w += 4;
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpUTF32 = createEncoderOperations(
  //
  createEncodeStateUTF32,
  encodeIntoUTF32,
  flushIntoUTF32,
  byteLengthMax4X,
  byteLengthDefault,
);

export const UTF_32LE = createUnicodeEncoding(32, true, decoderOpUTF32, encoderOpUTF32);
export const UTF_32BE = createUnicodeEncoding(32, false, decoderOpUTF32, encoderOpUTF32);

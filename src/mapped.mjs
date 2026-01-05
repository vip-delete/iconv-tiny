import { createEncodingFast, DEFAULT_CHAR_BYTE, isMapped, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import {
  CreateDecodeStateFn,
  CreateEncodeStateFn,
  DecoderOperations,
  DecodeStateMapped,
  DecodeStateMappedFast,
  EncoderOperations,
  EncodeStateMapped,
  EncodeStateMappedFast,
  MappedCharsetContext,
} from "./types.mjs";

/**
 * @type {number}
 */
export const NO_LEFTOVER = -1;

/**
 * @param {string|!ns.DefaultFunction|undefined} defaultChar
 * @param {number} defaultNumber
 * @return {number}
 */
const getDefaultChar = (defaultChar, defaultNumber) => (typeof defaultChar === "string" && defaultChar.length > 0 ? defaultChar.charCodeAt(0) : defaultNumber);

// DECODE

/**
 * @type {!CreateDecodeStateFn}
 */
export const createDecodeStateMapped = (charsetCtx, options) => {
  const ctx = /** @type {!MappedCharsetContext} */ (charsetCtx);

  const defaultCharUnicode = options.defaultCharUnicode;

  /**
   * @type {number}
   */
  const defaultChar = getDefaultChar(defaultCharUnicode, REPLACEMENT_CHARACTER_CODE);

  /**
   * @type {?ns.DefaultFunction}
   */
  const handler = typeof defaultCharUnicode === "function" ? defaultCharUnicode : null;

  /**
   * @type {!DecodeStateMapped}
   */
  const state = {
    b2c: ctx.b2c,
    leftover: NO_LEFTOVER,
    defaultChar,
    handler,
  };

  return state;
};

// DECODE FAST

/**
 * @param {!Uint16Array} arr
 * @param {number} defaultChar
 * @return {!Uint16Array}
 */
const createCachedForDefaultChar = (arr, defaultChar) => {
  const cached = arr.slice();
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (!isMapped(val)) {
      cached[i] = defaultChar;
    }
  }
  return cached;
};

/**
 * @type {!CreateDecodeStateFn}
 */
export const createDecodeStateMappedFast = (charsetCtx, options) => {
  const ctx = /** @type {!MappedCharsetContext} */ (charsetCtx);

  const defaultCharUnicode = options.defaultCharUnicode;

  /**
   * @type {number}
   */
  const defaultChar = getDefaultChar(defaultCharUnicode, REPLACEMENT_CHARACTER_CODE);

  // precalculate b2c for the given defaultChar
  if (!ctx.b2cCached || ctx.b2cCachedForDefaultChar !== defaultChar) {
    ctx.b2cCached = createCachedForDefaultChar(ctx.b2c, defaultChar);
    ctx.b2cCachedForDefaultChar = defaultChar;
  }

  /**
   * @type {!DecodeStateMappedFast}
   */
  const state = {
    b2c: ctx.b2cCached,
  };

  return state;
};

// ENCODE

/**
 * @type {!CreateEncodeStateFn}
 */
export const createEncodeStateMapped = (charsetCtx, options) => {
  const ctx = /** @type {!MappedCharsetContext} */ (charsetCtx);

  const defaultCharByte = options.defaultCharByte;

  /**
   * @type {number}
   */
  const defaultChar = getDefaultChar(defaultCharByte, DEFAULT_CHAR_BYTE);

  /**
   * @type {?ns.DefaultFunction}
   */
  const handler = typeof defaultCharByte === "function" ? defaultCharByte : null;

  /**
   * @type {!EncodeStateMapped}
   */
  const state = {
    r: 0,
    w: 0,
    c2b: ctx.c2b,
    defaultChar,
    handler,
  };

  return state;
};

// ENCODE FAST

/**
 * @type {!CreateEncodeStateFn}
 */
export const createEncodeStateMappedFast = (charsetCtx, options) => {
  const ctx = /** @type {!MappedCharsetContext} */ (charsetCtx);

  const defaultCharByte = options.defaultCharByte;

  /**
   * @type {number}
   */
  const defaultChar = getDefaultChar(defaultCharByte, DEFAULT_CHAR_BYTE);

  // precalculate c2b for the given defaultChar
  if (!ctx.c2bCached || ctx.c2bCachedForDefaultChar !== defaultChar) {
    ctx.c2bCached = createCachedForDefaultChar(ctx.c2b, defaultChar);
    ctx.c2bCachedForDefaultChar = defaultChar;
  }

  /**
   * @type {!EncodeStateMappedFast}
   */
  const state = {
    r: 0,
    w: 0,
    c2b: ctx.c2bCached,
  };

  return state;
};

// CHARSET

/**
 * @param {!Uint16Array} b2c
 * @return {!Uint16Array}
 */
const createC2B = (b2c) => {
  const c2b = new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);
  for (let i = 0; i < b2c.length; i++) {
    const ch = b2c[i];
    if (isMapped(ch)) {
      c2b[ch] = i;
    }
  }
  return c2b;
};

/**
 * @param {string} charsetName
 * @param {!Uint16Array} b2c
 * @param {!DecoderOperations} decoderOp
 * @param {!DecoderOperations} decoderOpFast
 * @param {!EncoderOperations} encoderOp
 * @param {!EncoderOperations} encoderOpFast
 * @return {!ns.Encoding}
 */
export const createCharsetMapped = (
  //
  charsetName,
  b2c,
  decoderOp,
  decoderOpFast,
  encoderOp,
  encoderOpFast,
) => {
  /**
   * @type {!MappedCharsetContext}
   */
  const ctx = {
    //
    charsetName,
    b2c,
    b2cCached: null,
    b2cCachedForDefaultChar: 0,
    c2b: createC2B(b2c),
    c2bCached: null,
    c2bCachedForDefaultChar: 0,
  };
  return createEncodingFast(
    //
    ctx,
    decoderOp,
    decoderOpFast,
    encoderOp,
    encoderOpFast,
  );
};

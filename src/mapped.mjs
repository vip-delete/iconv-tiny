import { createEncoding, DEFAULT_CHAR_BYTE, isMapped, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { CreateDecodeStateFn, CreateEncodeStateFn, DecodeFn, DecoderOperations, DecodeStateMapped, EncoderOperations, EncodeStateMapped, MappedCharsetContext } from "./types.mjs";

/**
 * @type {number}
 */
export const NO_LEFTOVER = -1;

/**
 * @type {boolean}
 */
export const DEFAULT_NATIVE_DECODE = false;

/**
 * @param {string} charsetName
 * @return {boolean}
 */
const isNativeDecoderSupported = (charsetName) => {
  try {
    // eslint-disable-next-line no-new
    new TextDecoder(charsetName);
    return true;
  } catch {
    return false;
  }
};

/**
 * @type {!DecodeFn}
 */
const nativeDecodeMapped = (decodeState, input) => {
  const state = /** @type {!DecodeStateMapped} */ (decodeState);
  const decoder = /** @type {!TextDecoder} */ (state.decoder);
  return decoder.decode(input, { stream: Boolean(input) });
};

/**
 * @type {!CreateDecodeStateFn}
 */
const createDecodeStateMapped = (charsetCtx, options) => {
  const { charsetName, b2c, nativeDecoderSupported, softwareDecodeMapped } = /** @type {!MappedCharsetContext} */ (charsetCtx);
  const defaultCharUnicode = options.defaultCharUnicode;

  /**
   * @type {number}
   */
  let defaultChar = REPLACEMENT_CHARACTER_CODE;

  /**
   * @type {?ns.DefaultFunction}
   */
  let handler = null;

  /**
   * @type {?TextDecoder}
   */
  let decoder = null;

  const useNativeDecode = nativeDecoderSupported && (options?.native ?? DEFAULT_NATIVE_DECODE);

  if (useNativeDecode) {
    decoder = new TextDecoder(charsetName);
  } else if (typeof defaultCharUnicode === "string") {
    if (defaultCharUnicode.length) {
      defaultChar = defaultCharUnicode.charCodeAt(0);
    }
  } else if (typeof defaultCharUnicode === "function") {
    handler = defaultCharUnicode;
  }

  /**
   * @type {!DecodeStateMapped}
   */
  const state = {
    b2c,
    defaultChar,
    handler,
    decodeFunction: useNativeDecode ? nativeDecodeMapped : softwareDecodeMapped,
    decoder,
    leftover: NO_LEFTOVER,
  };

  return state;
};

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
 * @type {!CreateEncodeStateFn}
 */
export const createEncodeStateMapped = (charsetCtx, options) => {
  const ctx = /** @type {!MappedCharsetContext} */ (charsetCtx);
  const b2c = ctx.b2c;
  if (!ctx.c2b) {
    ctx.c2b = createC2B(b2c);
  }
  const c2b = ctx.c2b;

  const defaultCharByte = options.defaultCharByte;

  /**
   * @type {number}
   */
  let defaultChar = DEFAULT_CHAR_BYTE;

  /**
   * @type {?ns.DefaultFunction}
   */
  let handler = null;

  if (typeof defaultCharByte === "string") {
    if (defaultCharByte.length) {
      defaultChar = defaultCharByte.charCodeAt(0);
    }
  } else if (typeof defaultCharByte === "function") {
    handler = defaultCharByte;
  }

  /**
   * @type {!EncodeStateMapped}
   */
  const state = {
    c2b,
    defaultChar,
    handler,
  };

  return state;
};

/**
 * @type {!DecodeFn}
 */
const decodeMapped = (decodeState, input) => {
  const { decodeFunction } = /** @type {!DecodeStateMapped} */ (decodeState);
  return decodeFunction(decodeState, input);
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpMapped = {
  createDecodeStateFn: createDecodeStateMapped,
  decodeFn: decodeMapped,
};

/**
 * @param {string} charsetName
 * @param {!Uint16Array} b2c
 * @param {!DecodeFn} softwareDecode
 * @param {!EncoderOperations} encoderOp
 * @return {!ns.Encoding}
 */
export const createCharsetMapped = (charsetName, b2c, softwareDecode, encoderOp) => {
  const nativeDecoderSupported = isNativeDecoderSupported(charsetName);
  /**
   * @type {!MappedCharsetContext}
   */
  const ctx = { charsetName, nativeDecoderSupported, b2c, c2b: null, softwareDecodeMapped: softwareDecode };
  return createEncoding(ctx, decoderOpMapped, encoderOp);
};

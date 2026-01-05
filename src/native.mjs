import { STRIP_BOM_DEFAULT } from "./commons.mjs";
import { createDecoderOperations, CreateDecodeStateFn, DecodeEndFn, DecodeFn, DecoderOperations, DecodeStateNative } from "./types.mjs";

// NATIVE DECODE

/**
 * @type {!CreateDecodeStateFn}
 */
const createDecodeStateNative = (charsetCtx, options) => {
  const ignoreBOM = !(options?.stripBOM ?? STRIP_BOM_DEFAULT);

  /**
   * @type {!DecodeStateNative}
   */
  const state = {
    decoder: new TextDecoder(charsetCtx.charsetName, { ignoreBOM }),
  };

  return state;
};

/**
 * @type {!DecodeFn}
 */
const nativeDecode = (decodeState, input) => /** @type {!DecodeStateNative} */ (decodeState).decoder.decode(input, { stream: true });

/**
 * @type {!DecodeEndFn}
 */
const nativeDecodeEnd = (decodeState) => /** @type {!DecodeStateNative} */ (decodeState).decoder.decode();

/**
 * @type {!DecoderOperations}
 */
export const nativeDecoderOp = createDecoderOperations(
  //
  createDecodeStateNative,
  nativeDecode,
  nativeDecodeEnd,
);

/**
 * @param {string} charsetName
 * @return {boolean}
 */
export const isNativeDecoderSupported = (charsetName) => {
  try {
    // eslint-disable-next-line no-new
    new TextDecoder(charsetName);
    return true;
  } catch {
    return false;
  }
};

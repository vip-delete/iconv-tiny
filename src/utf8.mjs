import { ADD_BOM_DEFAULT, byteLengthDefault, byteLengthMax4X, createEncoding, HIGH_SURROGATE_FROM, LOW_SURROGATE_FROM, TEXT_ENCODER } from "./commons.mjs";
import { nativeDecoderOp } from "./native.mjs";
import { CharsetContext, createEncoderOperations, CreateEncodeStateFn, EncodeIntoFn, EncoderOperations, FlushIntoFn } from "./types.mjs";

// UTF-8 DECODE (always native)

const decoderOpUTF8 = nativeDecoderOp;

// UTF-8 ENCODE (TextEncoder doesn't keep the encoding state)

/**
 * @typedef {{
 *            r: number,
 *            w: number,
 *            appendBOM: boolean,
 *            highSurrogate: string,
 *          }}
 */
const EncodeStateUTF8 = {};

/**
 * @type {!CreateEncodeStateFn}
 */
const createEncodeStateUTF8 = (charsetCtx, options) => {
  const appendBOM = options.addBOM ?? ADD_BOM_DEFAULT;

  /**
   * @type {!EncodeStateUTF8}
   */
  const state = {
    r: 0,
    w: 0,
    appendBOM,
    highSurrogate: "",
  };

  return state;
};

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoUTF8 = (encodeState, str, buf) => {
  const state = /** @type {!EncodeStateUTF8} */ (encodeState);
  let j = 0;
  if (state.appendBOM) {
    if (buf.length < 3) {
      return;
    }
    // this is how BOMChar is encoded in UTF8
    buf[0] = 0xef;
    buf[1] = 0xbb;
    buf[2] = 0xbf;
    j = 3;
    state.appendBOM = false;
  }

  if (state.highSurrogate) {
    str = state.highSurrogate + str;
    state.highSurrogate = "";
  }

  let i = 0;
  if (str.length > 0) {
    const code = str.charCodeAt(str.length - 1);
    if (code >= HIGH_SURROGATE_FROM && code < LOW_SURROGATE_FROM) {
      state.highSurrogate = str.charAt(str.length - 1);
      str = str.slice(0, str.length - 1);
      i = 1;
    }
  }

  const { read, written } = TEXT_ENCODER.encodeInto(str, buf.subarray(j));
  state.r += read + i;
  state.w += written + j;
};

/**
 * @type {!FlushIntoFn}
 */
const flushIntoUTF8 = (encodeState, buf) => {
  const state = /** @type {!EncodeStateUTF8} */ (encodeState);
  if (state.highSurrogate) {
    const { read, written } = TEXT_ENCODER.encodeInto(state.highSurrogate, buf);
    state.highSurrogate = "";
    state.r += 1 + read;
    state.w += written;
  }
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpUTF8 = createEncoderOperations(
  //
  createEncodeStateUTF8,
  encodeIntoUTF8,
  flushIntoUTF8,
  byteLengthMax4X,
  byteLengthDefault,
);

/**
 * @type {!CharsetContext}
 */
const ctx = { charsetName: "UTF-8" };

export const UTF_8 = createEncoding(
  //
  ctx,
  decoderOpUTF8,
  encoderOpUTF8,
);

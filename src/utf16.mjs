import { ADD_BOM_DEFAULT, BOM_CHAR_CODE, byteLengthMax2X, flushIntoDummy, put16BE, put16LE, PutFn } from "./commons.mjs";
import { nativeDecoderOp } from "./native.mjs";
import { createEncoderOperations, CreateEncodeStateFn, EncodeIntoFn, EncoderOperations } from "./types.mjs";
import { CharsetContextUnicode, createUnicodeEncoding } from "./unicode.mjs";

// UTF-16 DECODE (always native)

const decoderOpUTF16 = nativeDecoderOp;

// UTF-16 ENCODE

/**
 * @typedef {{
 *            r: number,
 *            w: number,
 *            appendBOM: boolean,
 *            put: !PutFn,
 *          }}
 */
const EncodeStateUTF16 = {};

/**
 * @type {!CreateEncodeStateFn}
 */
const createEncodeStateUTF16 = (charsetCtx, options) => {
  const { littleEndian } = /** @type {!CharsetContextUnicode} */ (charsetCtx);
  const appendBOM = options.addBOM ?? ADD_BOM_DEFAULT;

  /**
   * @type {!EncodeStateUTF16}
   */
  const state = {
    r: 0,
    w: 0,
    appendBOM,
    put: littleEndian ? put16LE : put16BE,
  };

  return state;
};

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoUTF16 = (encodeState, str, buf) => {
  const state = /** @type {!EncodeStateUTF16} */ (encodeState);
  const { appendBOM, put } = state;
  let j = 0;
  if (appendBOM) {
    if (buf.length < 2) {
      // not enough space
      return;
    }
    put(BOM_CHAR_CODE, buf, 0);
    j += 2;
    state.appendBOM = false;
  }
  let i = 0;
  while (i < str.length) {
    if (buf.length - j < 2) {
      // not enough space
      break;
    }
    const ch = str.charCodeAt(i);
    put(ch, buf, j);
    j += 2;
    i++;
  }
  state.r += i;
  state.w += j;
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpUTF16 = createEncoderOperations(
  //
  createEncodeStateUTF16,
  encodeIntoUTF16,
  flushIntoDummy,
  byteLengthMax2X,
  byteLengthMax2X,
);

export const UTF_16LE = createUnicodeEncoding(16, true, decoderOpUTF16, encoderOpUTF16);
export const UTF_16BE = createUnicodeEncoding(16, false, decoderOpUTF16, encoderOpUTF16);

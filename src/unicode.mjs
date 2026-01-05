import { createEncoding } from "./commons.mjs";
import { DecoderOperations, EncoderOperations } from "./types.mjs";

/**
 * @typedef {{
 *            charsetName: string,
 *            littleEndian: boolean,
 *          }}
 */
export const CharsetContextUnicode = {};

/**
 * @param {number} name
 * @param {boolean} littleEndian
 * @param {!DecoderOperations} decoderOp
 * @param {!EncoderOperations} encoderOp
 * @return {!ns.Encoding}
 */
export const createUnicodeEncoding = (name, littleEndian, decoderOp, encoderOp) => {
  const charsetName = "UTF-" + name + (littleEndian ? "LE" : "BE");
  /**
   * @type {!CharsetContextUnicode}
   */
  const ctx = {
    charsetName,
    littleEndian,
  };
  return createEncoding(
    //
    ctx,
    decoderOp,
    encoderOp,
  );
};

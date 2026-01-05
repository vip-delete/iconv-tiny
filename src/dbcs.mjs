import { byteLengthDefault, byteLengthMax2X, flushIntoDummy, getString, isMapped, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { createCharsetMapped, createDecodeStateMapped, createEncodeStateMapped, NO_LEFTOVER } from "./mapped.mjs";
import {
  createDecoderOperations,
  createEncoderOperations,
  DecodeEndFn,
  DecodeFn,
  DecoderOperations,
  DecodeStateMapped,
  EncodeIntoFn,
  EncoderOperations,
  EncodeStateMapped,
  MappedEncodingFactory,
} from "./types.mjs";

// DBCS DECODE

/**
 * @type {!DecodeFn}
 */
const decodeDBCS = (decodeState, buf) => {
  const state = /** @type {!DecodeStateMapped} */ (decodeState);
  const { b2c, defaultChar, handler, leftover } = state;

  const len = buf.length;
  if (len === 0) {
    return "";
  }

  const u16 = new Uint16Array(len + 1);
  let i = 0;
  let j = 0;

  /**
   * @type {number}
   */
  // eslint-disable-next-line init-declarations
  let lead;

  // process leftover
  if (leftover === NO_LEFTOVER) {
    lead = buf[0];
  } else {
    state.leftover = NO_LEFTOVER;
    lead = leftover;
    i = -1;
  }

  for (;;) {
    let ch = b2c[lead];

    if (isMapped(ch)) {
      // single byte
      u16[j++] = ch;
    } else if (i + 1 < len) {
      // double-byte
      const trail = buf[i + 1];

      const code = (lead << 8) | trail;
      ch = b2c[code];

      if (isMapped(ch)) {
        // trail byte was taken
        i++;
      } else {
        // invalid pair
        ch = handler?.(ch, i) ?? defaultChar;
        // return trail byte back to the stream
      }

      u16[j++] = ch;
    } else {
      // not enough space for double-byte
      state.leftover = lead;
      break;
    }
    i++;
    if (i < len) {
      lead = buf[i];
    } else {
      break;
    }
  }

  return getString(u16.subarray(0, j));
};

/**
 * @type {!DecodeEndFn}
 */
const decodeEndDBCS = (decodeState) => {
  const state = /** @type {!DecodeStateMapped} */ (decodeState);
  const leftover = state.leftover;

  // end of stream
  state.leftover = NO_LEFTOVER;

  // leftover is always unmapped
  return leftover === NO_LEFTOVER ? "" : String.fromCharCode(state.handler?.(leftover, -1) ?? state.defaultChar);
};

/**
 * @type {!DecoderOperations}
 */
const decoderOpDBCS = createDecoderOperations(
  //
  createDecodeStateMapped,
  decodeDBCS,
  decodeEndDBCS,
);

// DBCS ENCODE

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoDBCS = (encodeState, str, buf) => {
  const state = /** @type {!EncodeStateMapped} */ (encodeState);
  const { c2b, defaultChar, handler } = state;

  let i = 0;
  let j = 0;
  const srcLen = str.length;
  const dstLen = buf.length;
  const dstLen1 = dstLen - 1;
  for (; i < srcLen; i++) {
    const ch = str.charCodeAt(i);
    const val = c2b[ch];
    const value = isMapped(val) ? val : (handler?.(ch, i) ?? defaultChar);
    if (value > 255) {
      // two bytes sequence
      if (j >= dstLen1) {
        // not enought space in dst array
        break;
      }
      buf[j] = value >> 8;
      buf[j + 1] = value;
      j += 2;
    } else {
      // one bytes sequence
      if (j >= dstLen) {
        // not enought space in dst array
        break;
      }
      buf[j] = value;
      j += 1;
    }
  }
  state.r += i;
  state.w += j;
};

/**
 * @type {!EncoderOperations}
 */
const encoderOpDBCS = createEncoderOperations(
  //
  createEncodeStateMapped,
  encodeIntoDBCS,
  flushIntoDummy,
  byteLengthMax2X,
  byteLengthDefault,
);

// MAPPING TABLE

/**
 * @typedef {{
 *            parent: ?MappedEncodingFactory,
 *            mappingTable: !Array<!Array<string|number>>,
 *          }}
 */
const CtxDBCS = {};

/**
 * @override
 * @param {!CtxDBCS} ctx
 * @param {!ns.Options} [options]
 * @return {!Uint16Array}
 */
// eslint-disable-next-line no-unused-vars
const createTableDBCS = (ctx, options) => {
  const { parent, mappingTable } = ctx;
  const b2c = new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);

  // applyMappingTable
  for (let rangeIdx = 0; rangeIdx < mappingTable.length; rangeIdx++) {
    const range = mappingTable[rangeIdx];
    const start = Number.parseInt(/** @type {string} */ (range[0]), 16);
    let j = start;
    let lastCharCode = -1;
    for (let i = 1; i < range.length; i++) {
      const value = range[i];
      if (typeof value === "string") {
        for (let k = 0; k < value.length; k++) {
          b2c[j++] = value.charCodeAt(k);
        }
        lastCharCode = value.charCodeAt(value.length - 1);
      }
      if (typeof value === "number") {
        for (let k = 0; k < value; k++) {
          b2c[j++] = lastCharCode + 1;
          lastCharCode++;
        }
      }
    }
  }

  if (parent) {
    const parentB2C = parent.createTable();
    for (let i = 0; i < parentB2C.length; i++) {
      const parentCH = parentB2C[i];
      if (isMapped(parentCH)) {
        const ch = b2c[i];
        if (!isMapped(ch)) {
          b2c[i] = parentCH;
        }
      }
    }
  }

  return b2c;
};

// FACTORY

/**
 * @implements {ns.EncodingFactory}
 * @implements {MappedEncodingFactory}
 */
export class DBCS {
  /**
   * @param {string} charsetName
   * @param {?MappedEncodingFactory} parent
   * @param {!Array<!Array<string|number>>} mappingTable
   */
  constructor(charsetName, parent, mappingTable) {
    /**
     * @private
     * @constant
     */
    this.charsetName = charsetName;
    /**
     * @private
     * @constant
     * @type {!CtxDBCS}
     */
    this.ctx = { parent, mappingTable };
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
      decoderOpDBCS,
      decoderOpDBCS,
      encoderOpDBCS,
      encoderOpDBCS,
    );
  }

  /**
   * @override
   * @param {!ns.Options} [options]
   * @return {!Uint16Array}
   */
  // @ts-expect-error
  createTable(options) {
    return createTableDBCS(this.ctx, options);
  }
}

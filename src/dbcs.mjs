import { byteLengthDefault, getString, isMapped, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { createCharsetMapped, createEncodeStateMapped, NO_LEFTOVER } from "./mapped.mjs";
import { ByteLengthFn, DecodeFn, DecodeStateMapped, EncodeIntoFn, EncoderOperations, EncodeStateMapped, MappedEncodingFactory } from "./types.mjs";

// SBCS DECODE

/**
 * @type {!DecodeFn}
 */
const decodeDBCS = (decodeState, array) => {
  const state = /** @type {!DecodeStateMapped} */ (decodeState);
  const { b2c, defaultChar, handler, leftover } = state;

  if (!array) {
    // end of stream
    state.leftover = NO_LEFTOVER;
    // leftover is always unmapped
    return leftover === NO_LEFTOVER ? "" : String.fromCharCode(handler?.(leftover, -1) ?? defaultChar);
  }

  const len = array.length;
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
    lead = array[0];
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
      const trail = array[i + 1];

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
      lead = array[i];
    } else {
      break;
    }
  }

  return getString(u16.subarray(0, j));
};

// SBCS ENCODE

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoDBCS = (encodeState, src, dst) => {
  const { c2b, defaultChar, handler } = /** @type {!EncodeStateMapped} */ (encodeState);

  let i = 0;
  let j = 0;
  const srcLen = src.length;
  const dstLen = dst.length;
  const dstLen1 = dstLen - 1;
  for (; i < srcLen; i++) {
    const ch = src.charCodeAt(i);
    const val = c2b[ch];
    const value = isMapped(val) ? val : (handler?.(ch, i) ?? defaultChar);
    if (value > 255) {
      // two bytes sequence
      if (j >= dstLen1) {
        // not enought space in dst array
        break;
      }
      dst[j] = value >> 8;
      dst[j + 1] = value;
      j += 2;
    } else {
      // one bytes sequence
      if (j >= dstLen) {
        // not enought space in dst array
        break;
      }
      dst[j] = value;
      j += 1;
    }
  }
  return { read: i, written: j };
};

/**
 * @type {!ByteLengthFn}
 */
const byteLengthMaxDBCS = (encodeState, op, text) => text.length * 2;

/**
 * @type {!EncoderOperations}
 */
const encoderOp = {
  createEncodeStateFn: createEncodeStateMapped,
  encodeIntoFn: encodeIntoDBCS,
  byteLengthMaxFn: byteLengthMaxDBCS,
  byteLengthFn: byteLengthDefault,
};

/**
 * @return {!Uint16Array}
 */
const createB2C = () => new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);

/**
 * @param {!Uint16Array} b2c
 * @param {?MappedEncodingFactory} parent
 * @param {!Array<!Array<string|number>>} mappingTable
 */
const applyMappingTable = (b2c, parent, mappingTable) => {
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
    const parentB2C = parent.createB2C();
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
};

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
    this.charsetName = charsetName;
    this.parent = parent;
    this.mappingTable = mappingTable;
  }

  /**
   * @override
   * @return {!ns.Encoding}
   */
  // @ts-expect-error
  create() {
    return createCharsetMapped(this.charsetName, this.createB2C(), decodeDBCS, encoderOp);
  }

  /**
   * @override
   * @return {!Uint16Array}
   */
  // @ts-expect-error
  createB2C() {
    const b2c = createB2C();
    applyMappingTable(b2c, this.parent, this.mappingTable);
    return b2c;
  }
}

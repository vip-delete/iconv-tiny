import { getString, isMapped, REPLACEMENT_CHARACTER_CODE } from "./commons.mjs";
import { createCharsetMapped, createEncodeStateMapped } from "./mapped.mjs";
import { ByteLengthFn, DecodeFn, DecodeStateMapped, EncodeIntoFn, EncoderOperations, EncodeStateMapped, MappedEncodingFactory } from "./types.mjs";

// SBCS DECODE

/**
 * @type {!DecodeFn}
 */
const softwareDecodeSBCS = (decodeState, input) => {
  if (!input) {
    return "";
  }
  const { b2c, defaultChar, handler } = /** @type {!DecodeStateMapped} */ (decodeState);
  const len = input.length;
  const u16 = new Uint16Array(len);
  for (let i = 0; i < len; i++) {
    const byte = input[i];
    const ch = b2c[byte];
    u16[i] = isMapped(ch) ? ch : (handler?.(byte, i) ?? defaultChar);
  }
  return getString(u16);
};

// SBCS ENCODE

/**
 * @type {!EncodeIntoFn}
 */
const encodeIntoSBCS = (encodeState, src, dst) => {
  const { c2b, defaultChar, handler } = /** @type {!EncodeStateMapped} */ (encodeState);
  const len = Math.min(src.length, dst.length);
  for (let i = 0; i < len; i++) {
    const ch = src.charCodeAt(i);
    const byte = c2b[ch];
    dst[i] = isMapped(byte) ? byte : (handler?.(ch, i) ?? defaultChar);
  }
  return { read: len, written: len };
};

/**
 * @type {!ByteLengthFn}
 */
const byteLengthSBCS = (encodeState, op, text) => text.length;

/**
 * @type {!EncoderOperations}
 */
const encoderOp = {
  createEncodeStateFn: createEncodeStateMapped,
  encodeIntoFn: encodeIntoSBCS,
  byteLengthMaxFn: byteLengthSBCS,
  byteLengthFn: byteLengthSBCS,
};

/**
 * @return {!Uint16Array}
 */
const createB2C = () => new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);

/**
 * @param {!Uint16Array} b2c
 * @param {string} symbols
 */
const applySymbols = (b2c, symbols) => {
  let i = 0;
  while (i < 256 - symbols.length) {
    b2c[i] = i++;
  }
  let j = 0;
  while (i < 256) {
    b2c[i++] = symbols.charCodeAt(j++);
  }
};

/**
 * @param {!Uint16Array} b2c
 * @param {string} diff
 */
const applyDiff = (b2c, diff) => {
  let i = 0;
  while (i < diff.length) {
    b2c[diff.charCodeAt(i)] = diff.charCodeAt(i + 1);
    i += 2;
  }
};

/**
 * @param {!Uint16Array} b2c
 */
const replaceSpecials = (b2c) => {
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
};

/**
 * @param {!Uint16Array} b2c
 * @param {!ns.Overrides} overrides
 */
const applyOverrides = (b2c, overrides) => {
  let k = 0;
  while (k < overrides.length - 1) {
    const code = overrides[k++];
    const ch = overrides[k++];
    b2c[Number(code)] = typeof ch === "number" ? ch : ch.charCodeAt(0);
  }
};

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
    this.charsetName = charsetName;
    this.symbols = symbols;
    this.diff = diff ?? "";
  }

  /**
   * @override
   * @param {!ns.Options} [options]
   * @return {!ns.Encoding}
   */
  // @ts-expect-error
  create(options) {
    return createCharsetMapped(this.charsetName, this.createB2C(options), softwareDecodeSBCS, encoderOp);
  }

  /**
   * @override
   * @param {!ns.Options} [options]
   * @return {!Uint16Array}
   */
  // @ts-expect-error
  createB2C(options) {
    const { symbols, diff } = this;
    const b2c = createB2C();
    applySymbols(b2c, symbols);
    applyDiff(b2c, diff);
    replaceSpecials(b2c);
    applyOverrides(b2c, options?.overrides ?? []);
    return b2c;
  }
}

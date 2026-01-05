// @ts-nocheck

// ENGINE API

// eslint-disable-next-line jsdoc/check-types
/** @typedef {!Object} */
export const DecodeState = {};

/**
 * @typedef {{
 *            r: number,
 *            w: number,
 *          }}
 */
export const EncodeState = {};

/**
 * @typedef {function(!CharsetContext,!ns.DecodeOptions):!DecodeState}
 */
export const CreateDecodeStateFn = {};

/**
 * @typedef {function(!CharsetContext,!ns.EncodeOptions):!EncodeState}
 */
export const CreateEncodeStateFn = {};

/**
 * @typedef {function(!DecodeState,!Uint8Array):string}
 */
export const DecodeFn = {};

/**
 * @typedef {function(!DecodeState):string}
 */
export const DecodeEndFn = {};

/**
 * @typedef {function(!EncodeState,string,!Uint8Array):void}
 */
export const EncodeIntoFn = {};

/**
 * @typedef {function(!EncodeState,!Uint8Array):void}
 */
export const FlushIntoFn = {};

/**
 * @typedef {function(string):number}
 */
export const ByteLengthMaxFn = {};

/**
 * @typedef {function(string,!CharsetContext,!EncoderOperations):number}
 */
export const ByteLengthFn = {};

/**
 * @typedef {{
 *            createDecodeStateFn: !CreateDecodeStateFn,
 *            decodeFn: !DecodeFn,
 *            decodeEndFn: !DecodeEndFn,
 *          }}
 */
export const DecoderOperations = {};

/**
 * @param {!CreateDecodeStateFn} createDecodeStateFn
 * @param {!DecodeFn} decodeFn
 * @param {!DecodeEndFn} decodeEndFn
 * @return {!DecoderOperations}
 */
export const createDecoderOperations = (
  //
  createDecodeStateFn,
  decodeFn,
  decodeEndFn,
) => ({
  createDecodeStateFn,
  decodeFn,
  decodeEndFn,
});

/**
 * @typedef {{
 *            createEncodeStateFn: !CreateEncodeStateFn,
 *            encodeIntoFn: !EncodeIntoFn,
 *            flushIntoFn: !FlushIntoFn,
 *            byteLengthMaxFn: !ByteLengthMaxFn,
 *            byteLengthFn: !ByteLengthFn,
 *          }}
 */
export const EncoderOperations = {};

/**
 * @param {!CreateEncodeStateFn} createEncodeStateFn
 * @param {!EncodeIntoFn} encodeIntoFn
 * @param {!FlushIntoFn} flushIntoFn
 * @param {!ByteLengthMaxFn} byteLengthMaxFn
 * @param {!ByteLengthFn} byteLengthFn
 * @return {!EncoderOperations}
 */
export const createEncoderOperations = (
  //
  createEncodeStateFn,
  encodeIntoFn,
  flushIntoFn,
  byteLengthMaxFn,
  byteLengthFn,
) => ({
  createEncodeStateFn,
  encodeIntoFn,
  flushIntoFn,
  byteLengthMaxFn,
  byteLengthFn,
});

/**
 * @typedef {{
 *            charsetName: string,
 *          }}
 */
export const CharsetContext = {};

// MAPPED DECODE

/**
 * @typedef {{
 *            decoder: !TextDecoder,
 *          }}
 */
export const DecodeStateNative = {};

/**
 * @typedef {{
 *            b2c: !Uint16Array,
 *            leftover: number,
 *            defaultChar: number,
 *            handler: ?ns.DefaultFunction,
 *          }}
 */
export const DecodeStateMapped = {};

/**
 * @typedef {{
 *            b2c: !Uint16Array,
 *          }}
 */
export const DecodeStateMappedFast = {};

// MAPPED ENCODE

/**
 * @typedef {{
 *            r: number,
 *            w: number,
 *            c2b: !Uint16Array,
 *            defaultChar: number,
 *            handler: ?ns.DefaultFunction,
 *          }}
 */
export const EncodeStateMapped = {};

/**
 * @typedef {{
 *            r: number,
 *            w: number,
 *            c2b: !Uint16Array,
 *          }}
 */
export const EncodeStateMappedFast = {};

// MAPPED CONTEXT

/**
 * @typedef {{
 *            charsetName: string,
 *            b2c: !Uint16Array,
 *            b2cCached: ?Uint16Array,
 *            b2cCachedForDefaultChar: number,
 *            c2b: !Uint16Array,
 *            c2bCached: ?Uint16Array,
 *            c2bCachedForDefaultChar: number,
 *          }}
 */
export const MappedCharsetContext = {};

// CLASSES

/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

/**
 * @interface
 */
export class MappedEncodingFactory {
  /**
   * @param {!ns.Options} [options]
   * @return {!Uint16Array}
   */
  createTable(options) {}
}

/**
 * @interface
 */
export class Logger {
  /**
   * @param {string} msg
   * @param {!Error} [e]
   */
  warn(msg, e) {}
}

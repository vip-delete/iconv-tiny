// @ts-nocheck

// ENGINE API

// eslint-disable-next-line jsdoc/check-types
/** @typedef {!Object} */
const DecodeState = {};

// eslint-disable-next-line jsdoc/check-types
/** @typedef {!Object} */
const EncodeState = {};

/**
 * @typedef {function(!CharsetContext,!ns.DecoderOptions):!DecodeState}
 */
export const CreateDecodeStateFn = {};

/**
 * @typedef {function(!CharsetContext,!ns.EncoderOptions):!EncodeState}
 */
export const CreateEncodeStateFn = {};

/**
 * @typedef {function(!DecodeState,!Uint8Array=):string}
 */
export const DecodeFn = {};

/**
 * @typedef {function(!EncodeState,string,!Uint8Array):!ns.TextEncoderEncodeIntoResult}
 */
export const EncodeIntoFn = {};

/**
 * @typedef {function(!EncodeState,!EncoderOperations,string):number}
 */
export const ByteLengthFn = {};

/**
 * @typedef {{
 *            createDecodeStateFn: !CreateDecodeStateFn,
 *            decodeFn: !DecodeFn,
 *          }}
 */
export const DecoderOperations = {};

/**
 * @typedef {{
 *            createEncodeStateFn: !CreateEncodeStateFn,
 *            encodeIntoFn: !EncodeIntoFn,
 *            byteLengthMaxFn: !ByteLengthFn,
 *            byteLengthFn: !ByteLengthFn,
 *          }}
 */
export const EncoderOperations = {};

/**
 * @typedef {{
 *            charsetName: string,
 *          }}
 */
export const CharsetContext = {};

// MAPPED

/**
 * @typedef {{
 *            b2c: !Uint16Array,
 *            defaultChar: number,
 *            handler: ?ns.DefaultFunction,
 *            decodeFunction: !DecodeFn,
 *            decoder: ?TextDecoder,
 *            leftover: number,
 *          }}
 */
export const DecodeStateMapped = {};

/**
 * @typedef {{
 *            c2b: !Uint16Array,
 *            defaultChar: number,
 *            handler: ?ns.DefaultFunction,
 *          }}
 */
export const EncodeStateMapped = {};

/**
 * @typedef {{
 *            charsetName: string,
 *            nativeDecoderSupported: boolean,
 *            b2c: !Uint16Array,
 *            c2b: ?Uint16Array,
 *            softwareDecodeMapped: !DecodeFn,
 *          }}
 */
export const MappedCharsetContext = {};

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
  createB2C(options) {}
}

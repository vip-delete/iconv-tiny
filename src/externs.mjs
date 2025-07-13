/**
 * @file Encoding API for Closure Compiler.
 * @externs
 */
let ns = {
  /**
   * @interface
   */
  IconvTiny: class {
    /**
     * @param {!Uint8Array} array
     * @param {string} encoding
     * @param {!ns.OptionsAndDecoderOptions} [options]
     * @return {string}
     */
    decode(array, encoding, options) {}

    /**
     * @param {string} content
     * @param {string} encoding
     * @param {!ns.OptionsAndEncoderOptions} [options]
     * @return {!Uint8Array}
     */
    encode(content, encoding, options) {}

    /**
     * @param {string} name
     * @param {!ns.Options} [options]
     * @return {!ns.Encoding}
     */
    getEncoding(name, options) {}
  },

  /**
   * @param {string} encoding
   * @return {string}
   */
  canonicalize(encoding) {},

  /**
   * @interface
   */
  Encoding: class {
    /**
     * @return {string}
     */
    getName() {}

    /**
     * @param {!Uint8Array} array
     * @param {ns.DecoderOptions} [options]
     * @return {string}
     */
    decode(array, options) {}

    /**
     * @param {string} text
     * @param {ns.EncoderOptions} [options]
     * @return {!Uint8Array}
     */
    encode(text, options) {}

    /**
     * @param {ns.DecoderOptions} [options]
     * @return {!ns.CharsetDecoder}
     */
    newDecoder(options) {}

    /**
     * @param {ns.EncoderOptions} [options]
     * @return {!ns.CharsetEncoder}
     */
    newEncoder(options) {}
  },

  /**
   * @interface
   */
  EncodingFactory: class {
    /**
     * @param {!ns.Options} [options]
     * @return {!ns.Encoding}
     */
    create(options) {}
  },

  /**
   * @interface
   */
  CharsetDecoder: class {
    /**
     * @param {!Uint8Array} [array]
     * @return {string}
     */
    decode(array) {}
  },

  /**
   * @interface
   */
  CharsetEncoder: class {
    /**
     * @param {string} [text]
     * @return {!Uint8Array}
     */
    encode(text) {}

    /**
     * @param {string} src
     * @param {!Uint8Array} dst
     * @return {!ns.TextEncoderEncodeIntoResult}
     */
    encodeInto(src, dst) {}

    /**
     * @param {string} src
     * @return {number}
     */
    byteLength(src) {}
  },
};

/**
 * @typedef {{
 *            read: number,
 *            written: number,
 *          }}
 */
ns.TextEncoderEncodeIntoResult;

/**
 * @typedef {{
 *            defaultCharUnicode: (string|ns.DefaultCharUnicodeFunction),
 *            native: boolean,
 *            stripBOM: boolean,
 *          }}
 */
ns.DecoderOptions;

/**
 * @typedef {{
 *            defaultCharByte: (string|ns.DefaultCharByteFunction),
 *            addBOM: boolean,
 *          }}
 */
ns.EncoderOptions;

/**
 * @typedef {{
 *            overrides: !ns.Overrides,
 *          }}
 */
ns.Options;

/**
 * @typedef {!Array<number|string>}
 */
ns.Overrides;

/**
 * @typedef {function(number,number):?number}
 */
ns.DefaultCharByteFunction;

/**
 * @typedef {function(number,number):?number}
 */
ns.DefaultCharUnicodeFunction;

/**
 * ns.Options & ns.DecoderOptions
 *
 * @typedef {{
 *            overrides: !ns.Overrides,
 *            defaultCharUnicode: (string|ns.DefaultCharUnicodeFunction),
 *            native: boolean,
 *            stripBOM: boolean,
 *          }}
 */
ns.OptionsAndDecoderOptions;

/**
 * ns.Options & ns.EncoderOptions
 *
 * @typedef {{
 *            overrides: !ns.Overrides,
 *            defaultCharByte: (string|ns.DefaultCharByteFunction),
 *            addBOM: boolean,
 *          }}
 */
ns.OptionsAndEncoderOptions;

/**
 * @type {typeof ns.EncodingFactory}
 */
ns.SBCS;

/**
 * @type {typeof ns.EncodingFactory}
 */
ns.Unicode;

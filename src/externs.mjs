/**
 * @file Encoding API for Closure Compiler.
 * @externs
 */
const ns = {
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
   * @param {!Object<string, !ns.EncodingFactory>} [encodings]
   * @param {string} [aliases]
   * @return {!ns.IconvTiny}
   */
  createIconv(encodings, aliases) {},

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
     * @param {!ns.DecoderOptions} [options]
     * @return {string}
     */
    decode(array, options) {}

    /**
     * @param {string} text
     * @param {!ns.EncoderOptions} [options]
     * @return {!Uint8Array}
     */
    encode(text, options) {}

    /**
     * @param {!ns.DecoderOptions} [options]
     * @return {!ns.CharsetDecoder}
     */
    newDecoder(options) {}

    /**
     * @param {!ns.EncoderOptions} [options]
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
     * @param {string} text
     * @param {!Uint8Array} dst
     * @return {!ns.TextEncoderEncodeIntoResult}
     */
    encodeInto(text, dst) {}

    /**
     * @param {string} text
     * @return {number}
     */
    byteLength(text) {}
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
 *            defaultCharUnicode: (!ns.DefaultFunction|string|undefined),
 *            native: (boolean|undefined),
 *            stripBOM: (boolean|undefined),
 *          }}
 */
ns.DecoderOptions;

/**
 * @typedef {{
 *            defaultCharByte: (!ns.DefaultFunction|string|undefined),
 *            addBOM: (boolean|undefined),
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
ns.DefaultFunction;

/**
 * ns.Options & ns.DecoderOptions
 *
 * @typedef {{
 *            overrides: !ns.Overrides,
 *            defaultCharUnicode: (!ns.DefaultFunction|string),
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
 *            defaultCharByte: (!ns.DefaultFunction|string),
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

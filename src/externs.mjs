/**
 * @file Encoding API for Closure Compiler.
 * @externs
 */
const iconvtiny = {
  /**
   * @param {string} encoding
   * @return {string}
   */
  canonicalize(encoding) {},

  /**
   * @param {!Object<string, !iconvtiny.EncodingFactory>} [encodings]
   * @param {string} [aliases]
   * @return {!iconvtiny.Iconv}
   */
  createIconv(encodings, aliases) {},

  /**
   * @interface
   */
  Iconv: class {
    /**
     * @param {!Uint8Array} buf
     * @param {string} encoding
     * @param {!iconvtiny.OptionsAndDecoderOptions} [options]
     * @return {string}
     */
    decode(buf, encoding, options) {}

    /**
     * @param {string} str
     * @param {string} encoding
     * @param {!iconvtiny.OptionsAndEncoderOptions} [options]
     * @return {!Uint8Array}
     */
    encode(str, encoding, options) {}

    /**
     * @param {string} name
     * @param {!iconvtiny.Options} [options]
     * @return {!iconvtiny.Encoding}
     */
    getEncoding(name, options) {}
  },

  /**
   * @interface
   */
  EncodingFactory: class {
    /**
     * @param {!iconvtiny.Options} [options]
     * @return {!iconvtiny.Encoding}
     */
    create(options) {}
  },

  /**
   * @interface
   */
  Encoding: class {
    /**
     * @return {string}
     */
    getName() {}

    /**
     * @param {!Uint8Array} buf
     * @param {!iconvtiny.DecodeOptions} [options]
     * @return {string}
     */
    decode(buf, options) {}

    /**
     * @param {string} str
     * @param {!iconvtiny.EncodeOptions} [options]
     * @return {!Uint8Array}
     */
    encode(str, options) {}

    /**
     * @param {string} str
     * @return {number}
     */
    byteLength(str) {}

    // --- Low-level Stream APIs ---

    /**
     * @param {!iconvtiny.DecodeOptions} [options]
     * @return {!iconvtiny.DecoderStream}
     */
    getDecoder(options) {}

    /**
     * @param {!iconvtiny.EncodeOptions} [options]
     * @return {!iconvtiny.EncoderStream}
     */
    getEncoder(options) {}
  },

  /**
   * @interface
   */
  DecoderStream: class {
    /**
     * @param {!Uint8Array} buf
     * @return {string}
     */
    write(buf) {}

    /**
     * @return {string}
     */
    end() {}
  },

  /**
   * @interface
   */
  EncoderStream: class {
    /**
     * @param {string} str
     * @return {!Uint8Array}
     */
    write(str) {}

    /**
     * @return {!Uint8Array}
     */
    end() {}

    // Low Level Encode API

    /**
     * @param {string} str
     * @param {!Uint8Array} buf
     * @return {!iconvtiny.TextEncoderEncodeIntoResult}
     */
    encodeInto(str, buf) {}

    /**
     * @param {!Uint8Array} buf
     * @return {!iconvtiny.TextEncoderEncodeIntoResult}
     */
    flushInto(buf) {}
  },
};

/**
 * @typedef {{
 *            read: number,
 *            written: number,
 *          }}
 */
iconvtiny.TextEncoderEncodeIntoResult;

/**
 * @typedef {{
 *            defaultCharUnicode: (!iconvtiny.DefaultFunction|string|undefined),
 *            native: (boolean|undefined),
 *            stripBOM: (boolean|undefined),
 *          }}
 */
iconvtiny.DecodeOptions;

/**
 * @typedef {{
 *            defaultCharByte: (!iconvtiny.DefaultFunction|string|undefined),
 *            addBOM: (boolean|undefined),
 *          }}
 */
iconvtiny.EncodeOptions;

/**
 * @typedef {{
 *            overrides: !iconvtiny.Overrides,
 *          }}
 */
iconvtiny.Options;

/**
 * @typedef {!Array<number|string>}
 */
iconvtiny.Overrides;

/**
 * @typedef {function(number,number):?number}
 */
iconvtiny.DefaultFunction;

/**
 * ns.Options & ns.DecodeOptions
 *
 * @typedef {{
 *            overrides: !iconvtiny.Overrides,
 *            defaultCharUnicode: (!iconvtiny.DefaultFunction|string),
 *            native: boolean,
 *            stripBOM: boolean,
 *          }}
 */
iconvtiny.OptionsAndDecoderOptions;

/**
 * ns.Options & ns.EncodeOptions
 *
 * @typedef {{
 *            overrides: !iconvtiny.Overrides,
 *            defaultCharByte: (!iconvtiny.DefaultFunction|string),
 *            addBOM: boolean,
 *          }}
 */
iconvtiny.OptionsAndEncoderOptions;

/** @type {typeof iconvtiny.EncodingFactory} */ iconvtiny.SBCS;
/** @type {typeof iconvtiny.EncodingFactory} */ iconvtiny.DBCS;
/** @type {typeof iconvtiny.EncodingFactory} */ iconvtiny.Singleton;
/** @type {!iconvtiny.Encoding} */ iconvtiny.UTF_8;
/** @type {!iconvtiny.Encoding} */ iconvtiny.UTF_16LE;
/** @type {!iconvtiny.Encoding} */ iconvtiny.UTF_16BE;
/** @type {!iconvtiny.Encoding} */ iconvtiny.UTF_32LE;
/** @type {!iconvtiny.Encoding} */ iconvtiny.UTF_32BE;

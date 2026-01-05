/**
 * @file Encoding API for Closure Compiler.
 * @externs
 */
const ns = {
  /**
   * @param {string} encoding
   * @return {string}
   */
  canonicalize(encoding) {},

  /**
   * @param {!Object<string, !ns.EncodingFactory>} [encodings]
   * @param {string} [aliases]
   * @return {!ns.Iconv}
   */
  createIconv(encodings, aliases) {},

  /**
   * @interface
   */
  Iconv: class {
    /**
     * @param {!Uint8Array} buf
     * @param {string} encoding
     * @param {!ns.OptionsAndDecoderOptions} [options]
     * @return {string}
     */
    decode(buf, encoding, options) {}

    /**
     * @param {string} str
     * @param {string} encoding
     * @param {!ns.OptionsAndEncoderOptions} [options]
     * @return {!Uint8Array}
     */
    encode(str, encoding, options) {}

    /**
     * @param {string} name
     * @param {!ns.Options} [options]
     * @return {!ns.Encoding}
     */
    getEncoding(name, options) {}
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
  Encoding: class {
    /**
     * @return {string}
     */
    getName() {}

    /**
     * @param {!Uint8Array} buf
     * @param {!ns.DecodeOptions} [options]
     * @return {string}
     */
    decode(buf, options) {}

    /**
     * @param {string} str
     * @param {!ns.EncodeOptions} [options]
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
     * @param {!ns.DecodeOptions} [options]
     * @return {!ns.DecoderStream}
     */
    getDecoder(options) {}

    /**
     * @param {!ns.EncodeOptions} [options]
     * @return {!ns.EncoderStream}
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
     * @return {!ns.TextEncoderEncodeIntoResult}
     */
    encodeInto(str, buf) {}

    /**
     * @param {!Uint8Array} buf
     * @return {!ns.TextEncoderEncodeIntoResult}
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
ns.TextEncoderEncodeIntoResult;

/**
 * @typedef {{
 *            defaultCharUnicode: (!ns.DefaultFunction|string|undefined),
 *            native: (boolean|undefined),
 *            stripBOM: (boolean|undefined),
 *          }}
 */
ns.DecodeOptions;

/**
 * @typedef {{
 *            defaultCharByte: (!ns.DefaultFunction|string|undefined),
 *            addBOM: (boolean|undefined),
 *          }}
 */
ns.EncodeOptions;

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
 * ns.Options & ns.DecodeOptions
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
 * ns.Options & ns.EncodeOptions
 *
 * @typedef {{
 *            overrides: !ns.Overrides,
 *            defaultCharByte: (!ns.DefaultFunction|string),
 *            addBOM: boolean,
 *          }}
 */
ns.OptionsAndEncoderOptions;

/** @type {typeof ns.EncodingFactory} */ ns.SBCS;
/** @type {typeof ns.EncodingFactory} */ ns.DBCS;
/** @type {typeof ns.EncodingFactory} */ ns.Singleton;
/** @type {!ns.Encoding} */ ns.UTF_8;
/** @type {!ns.Encoding} */ ns.UTF_16LE;
/** @type {!ns.Encoding} */ ns.UTF_16BE;
/** @type {!ns.Encoding} */ ns.UTF_32LE;
/** @type {!ns.Encoding} */ ns.UTF_32BE;

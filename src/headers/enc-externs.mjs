/**
 * @file Encoding API for Closure Compiler.
 * @externs
 */
const encNS = {
  /**
   * @interface
   */
  Encoding: class {
    /**
     * @param {!Uint8Array} array
     * @returns {string}
     */
    decode(array) {}

    /**
     * @param {string} text
     * @returns {!Uint8Array}
     */
    encode(text) {}
  },

  /**
   * @interface
   */
  EncodingFactory: class {
    /**
     * @param {!encNS.Options} [options]
     * @returns {!encNS.Encoding}
     */
    create(options) {}
  },
};

/**
 * @typedef {{
 *            defaultCharByte: (string|encNS.DefaultCharFunction),
 *            defaultCharUnicode: (string|encNS.DefaultCharFunction),
 *            overrides: !encNS.Overrides,
 *            graphics: string,
 *            graphicMode: boolean,
 *            nativeDecode: boolean,
 *            strictDecode: boolean,
 *          }}
 */
encNS.Options;

/**
 * @typedef {!Array<number|string>}
 */
encNS.Overrides;

/**
 * @typedef {function(number,number):?number}
 */
encNS.DefaultCharFunction;

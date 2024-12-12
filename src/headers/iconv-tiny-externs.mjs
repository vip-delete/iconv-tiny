/**
 * @file IconvTiny API for Closure Compiler.
 * @externs
 */
const iconvTinyNS = {
  /**
   * @interface
   */
  IconvTiny: class {
    /**
     * @param {!Uint8Array} buffer
     * @param {string} encoding
     * @param {!encNS.Options} [options]
     * @returns {string}
     */
    decode(buffer, encoding, options) {}

    /**
     * @param {string} content
     * @param {string} encoding
     * @param {!encNS.Options} [options]
     * @returns {!Uint8Array}
     */
    encode(content, encoding, options) {}
  },
};

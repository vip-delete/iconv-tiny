// @ts-nocheck

/**
 * @abstract
 * @implements {ns.Encoding}
 */
export class Charset {
  /**
   * @param {string} charsetName
   */
  constructor(charsetName) {
    this.charsetName = charsetName;
  }

  /**
   * @override
   * @returns {string}
   */
  getName() {
    return this.charsetName;
  }

  /**
   * @override
   * @param {!Uint8Array} array
   * @param {!ns.DecoderOptions} [options]
   * @returns {string}
   */
  decode(array, options) {
    /**
     * @type {!ns.CharsetDecoder}
     */
    const decoder = this.newDecoder(options);
    return decoder.decode(array) + decoder.decode();
  }

  /**
   * @override
   * @param {string} text
   * @param {!ns.EncoderOptions} [options]
   * @returns {!Uint8Array}
   */
  encode(text, options) {
    /**
     * @type {!ns.CharsetEncoder}
     */
    const encoder = this.newEncoder(options);
    return encoder.encode(text);
  }
}

/**
 * @abstract
 * @implements {ns.Encoding}
 */
export class NativeCharset extends Charset {
  /**
   * @override
   * @returns {!ns.CharsetDecoder}
   */
  // @ts-ignore
  newDecoder() {
    return new NativeDecoder(new TextDecoder(this.charsetName));
  }
}

/**
 * @implements {ns.CharsetDecoder}
 */
export class NativeDecoder {
  /**
   * @param {!TextDecoder} decoder
   */
  constructor(decoder) {
    this.decoder = decoder;
  }

  /**
   * @override
   * @param {!Uint8Array} [array]
   * @returns {string}
   */
  // @ts-ignore
  decode(array) {
    return array ? this.decoder.decode(array, { stream: true }) : this.decoder.decode();
  }
}

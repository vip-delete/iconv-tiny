/**
 * @param {string} encoding
 * @returns {string}
 */
export const canonicalize = (encoding) =>
  encoding
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "")
    .replace(/(?<!\d)0+/gu, "");

/**
 * @implements {ns.IconvTiny}
 */
export class IconvTiny {
  /**
   * @param {!Object<string, !ns.EncodingFactory>} [encodings]
   * @param {string} [aliases]
   */
  constructor(encodings, aliases) {
    encodings ??= {};
    /**
     * @type {!Map<string, !ns.EncodingFactory>}
     */
    this.encodingFactoryMap = new Map();
    /**
     * @type {!Map<string, !ns.Encoding>}
     */
    this.cache = new Map();
    /**
     * @type {!Array<!Array<string>>}
     */
    const config = (aliases ?? "").split(",").map((row) => row.split(" ").map(canonicalize));
    for (const key of Object.keys(encodings)) {
      /**
       * @type {!ns.EncodingFactory}
       */
      const encoding = encodings[key];
      // check that "encoding" is EncodingFactory
      // @ts-expect-error
      if (encoding?.create) {
        const name = canonicalize(key);
        this.encodingFactoryMap.set(name, encoding);
        config.filter((row) => row.includes(name)).forEach((row) => row.forEach((alias) => this.encodingFactoryMap.set(alias, encoding)));
      }
    }
  }

  /**
   * @override
   * @param {!Uint8Array} array
   * @param {string} encoding
   * @param {!ns.OptionsAndDecoderOptions} [options]
   * @returns {string}
   */
  // @ts-expect-error
  decode(array, encoding, options) {
    return this.getEncoding(encoding, options).decode(array, options);
  }

  /**
   * @override
   * @param {string} content
   * @param {string} encoding
   * @param {!ns.OptionsAndEncoderOptions} [options]
   * @returns {!Uint8Array}
   */
  // @ts-expect-error
  encode(content, encoding, options) {
    return this.getEncoding(encoding, options).encode(content, options);
  }

  /**
   * @override
   * @param {string} name
   * @param {!ns.Options} [options]
   * @returns {!ns.Encoding}
   */
  // @ts-expect-error
  getEncoding(name, options) {
    name = canonicalize(name);
    const key = name + (options?.overrides ?? "");
    let encoding = this.cache.get(key);
    if (!encoding) {
      const encodingFactory = this.encodingFactoryMap.get(name);
      if (!encodingFactory) {
        throw new Error(`Encoding "${name}" not supported`);
      }
      encoding = encodingFactory.create(options);
      this.cache.set(key, encoding);
    }
    return encoding;
  }
}

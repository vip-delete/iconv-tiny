/**
 * @param {string} encoding
 * @return {string}
 */
export const canonicalize = (encoding) =>
  encoding
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "")
    .replace(/(?<!\d)0+/gu, "");

/**
 * @implements {ns.Iconv}
 */
class Iconv {
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
   * @param {!Uint8Array} buf
   * @param {string} encoding
   * @param {!ns.OptionsAndDecoderOptions} [options]
   * @return {string}
   */
  // @ts-expect-error
  decode(buf, encoding, options) {
    const enc = this.getEncoding(encoding, options);
    const str = enc.decode(buf, options);
    return str;
  }

  /**
   * @override
   * @param {string} str
   * @param {string} encoding
   * @param {!ns.OptionsAndEncoderOptions} [options]
   * @return {!Uint8Array}
   */
  // @ts-expect-error
  encode(str, encoding, options) {
    return this.getEncoding(encoding, options).encode(str, options);
  }

  /**
   * @override
   * @param {string} name
   * @param {!ns.Options} [options]
   * @return {!ns.Encoding}
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

/**
 * @param {!Object<string, !ns.EncodingFactory>} [encodings]
 * @param {string} [aliases]
 * @return {!ns.Iconv}
 */
export const createIconv = (encodings, aliases) => new Iconv(encodings, aliases);

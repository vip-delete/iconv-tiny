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
    const encodingFactoryMap = new Map();
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
      // @ts-ignore
      if (encoding.create) {
        const name = canonicalize(key);
        encodingFactoryMap.set(name, encoding);
        config.filter((row) => row.includes(name)).forEach((row) => row.forEach((alias) => encodingFactoryMap.set(alias, encoding)));
      }
    }
    this.encodingFactoryMap = encodingFactoryMap;
  }

  /**
   * @override
   * @param {!Uint8Array} array
   * @param {string} encoding
   * @param {!ns.OptionsAndDecoderOptions} [options]
   * @returns {string}
   */
  // @ts-ignore
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
  // @ts-ignore
  encode(content, encoding, options) {
    return this.getEncoding(encoding, options).encode(content, options);
  }

  /**
   * @override
   * @param {string} name
   * @param {!ns.Options} [options]
   * @returns {!ns.Encoding}
   */
  // @ts-ignore
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
 * Converts an encoding name to a normalized, unique name.
 * Removes non-alphanumeric characters and leading zeros.
 * For more details, refer to: https://www.unicode.org/reports/tr22/tr22-8.html#Charset_Alias_Matching
 * @param {string} encoding
 * @returns {string}
 */
export function canonicalize(encoding) {
  return encoding
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "")
    .replace(/(?<!\d)0+/gu, "");
}

/**
 * @implements {iconvTinyNS.IconvTiny}
 */
export class IconvTiny {
  /**
   * @param {!Object<string, !encNS.EncodingFactory>} encodings
   * @param {string} [aliases]
   */
  constructor(encodings, aliases) {
    /**
     * @type {!Map<string, !encNS.EncodingFactory>}
     */
    this.encodingFactoryMap = new Map();
    /**
     * @type {!Array<!Array<string>>}
     */
    const config = (aliases || "").split(",").map((row) => row.split(" ").map(canonicalize));
    for (const key of Object.keys(encodings)) {
      const encoding = encodings[key];
      const name = canonicalize(key);
      this.encodingFactoryMap.set(name, encoding);
      for (const row of config) {
        if (row.includes(name)) {
          for (const alias of row) {
            this.encodingFactoryMap.set(alias, encoding);
          }
        }
      }
    }
    /**
     * @type {!Map<string, !encNS.Encoding>}
     */
    this.cache = new Map();
  }

  /**
   * @override
   * @param {!Uint8Array} buffer
   * @param {string} encoding
   * @param {!encNS.Options} [options]
   * @returns {string}
   */
  // @ts-ignore
  decode(buffer, encoding, options) {
    return this.getEncoding(encoding, options).decode(buffer);
  }

  /**
   * @override
   * @param {string} content
   * @param {string} encoding
   * @param {!encNS.Options} [options]
   * @returns {!Uint8Array}
   */
  // @ts-ignore
  encode(content, encoding, options) {
    return this.getEncoding(encoding, options).encode(content);
  }

  /**
   * @param {string} name
   * @param {!encNS.Options} [options]
   * @returns {!encNS.Encoding}
   */
  getEncoding(name, options) {
    name = canonicalize(name);
    const key = `${name}-${JSON.stringify(options)}`;
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

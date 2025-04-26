import { DEFAULT_CHAR_BYTE, DEFAULT_CHAR_UNICODE, DEFAULT_GRAPHICS, DEFAULT_NATIVE_DECODE, DEFAULT_STRICT_DECODE } from "./commons.mjs";

/**
 * TextDecoder is super fast but doesn't allow invalid surrogate pairs in the output:
 *
 * >> new TextDecoder("UTF-16").decode(new Uint16Array([0xD7FF, 0xD800, 0xD801, 0xD802]))
 * >> \ud7ff\ufffd\ufffd\ufffd
 * @param {!Uint16Array} array
 * @returns {string}
 */
function convertFast(array) {
  return new TextDecoder("UTF-16").decode(array);
}

const DEFAULT_CHUNK_SIZE = 1024;

/**
 * String.fromCharCode is extremely slow but decodes "as-is":
 *
 * >> String.fromCharCode(0xD7FF, 0xD800, 0xD801, 0xD802)
 * >> \ud7ff\ud800\ud801\ud802
 * @param {!Uint16Array} array
 * @returns {string}
 */
function convertStrict(array) {
  const result = [];
  for (let i = 0; i < array.length; i += DEFAULT_CHUNK_SIZE) {
    result.push(String.fromCharCode(...array.subarray(i, i + DEFAULT_CHUNK_SIZE)));
  }
  return result.join("");
}

/**
 * @implements {encNS.EncodingFactory}
 */
export class SBEF {
  /**
   * @param {string} canonicalName
   * @param {string} symbols
   * @param {string} [diff]
   */
  constructor(canonicalName, symbols, diff) {
    this.canonicalName = canonicalName;
    this.mappings = getMappings(symbols, diff ?? "");
  }

  /**
   * @override
   * @param {!encNS.Options} [options]
   * @returns {!encNS.Encoding}
   */
  // @ts-ignore
  create(options) {
    const { c2b, b2c, mappedB, mappedC } = this.prepareEncodingData(options);
    const canonicalName = this.canonicalName;
    const sbe = new SBE();

    // create "decode"
    if (this.canUseNativeDecode(options)) {
      sbe.decode = (bytes) => new TextDecoder(canonicalName).decode(bytes);
    } else {
      const decodeFunc = (options?.strictDecode ?? DEFAULT_STRICT_DECODE) ? convertStrict : convertFast;
      if (typeof options?.defaultCharUnicode === "function") {
        const handler = /** @type {!encNS.DefaultCharFunction} */ (options.defaultCharUnicode);
        sbe.decode = (bytes) => decodeWithHandler(bytes, b2c, decodeFunc, mappedB, handler);
      } else {
        sbe.decode = (bytes) => decodeSimple(bytes, b2c, decodeFunc);
      }
    }

    // create "encode"
    if (typeof options?.defaultCharByte === "function") {
      const handler = /** @type {!encNS.DefaultCharFunction} */ (options.defaultCharByte);
      sbe.encode = (bytes) => encodeWithHandler(bytes, c2b, mappedC, handler);
    } else {
      sbe.encode = (bytes) => encodeSimple(bytes, c2b);
    }
    return sbe;
  }

  /**
   * @param {!encNS.Options} [options]
   * @returns {boolean}
   */
  canUseNativeDecode(options) {
    if (!(options?.nativeDecode ?? DEFAULT_NATIVE_DECODE)) {
      return false;
    }
    if (options?.defaultCharUnicode) {
      return false;
    }
    if (options?.overrides?.length) {
      return false;
    }
    if (options?.graphicMode) {
      return false;
    }
    // use native TextDecoder.decode if supported
    return isNativeSupported(this.canonicalName);
  }

  /**
   * @param {!encNS.Options} [options]
   * @returns {!EncodingData}
   */
  prepareEncodingData(options) {
    const data = new EncodingData(this.mappings);
    data.applyGraphics(options?.graphics, options?.graphicMode);
    data.applyOverrides(options?.overrides ?? []);
    data.setDefaults(options);
    return data;
  }
}

/**
 * @param {string} symbols
 * @param {string} diff
 * @returns {!Array<number>}
 */
function getMappings(symbols, diff) {
  const s = [];
  let i = 0;
  while (i < 256 - symbols.length) {
    s[i] = i++;
  }
  let j = 0;
  while (i < 256) {
    s[i++] = symbols.charCodeAt(j++);
  }
  let k = 0;
  while (k < diff.length) {
    s[diff.charCodeAt(k)] = diff.charCodeAt(k + 1);
    k += 2;
  }
  return s;
}

/**
 * @param {string} canonicalName
 * @returns {boolean}
 */
function isNativeSupported(canonicalName) {
  try {
    new TextDecoder(canonicalName).decode(new Uint8Array([0]));
    return true;
  } catch {
    return false;
  }
}

/**
 * @implements {encNS.Encoding}
 */
class SBE {
  /**
   * @override
   * @param {!Uint8Array} bytes
   * @returns {string}
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  decode(bytes) {
    return "";
  }

  /**
   * @override
   * @param {string} text
   * @returns {!Uint8Array}
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  encode(text) {
    return new Uint8Array([0]);
  }
}

class EncodingData {
  /**
   * @param {!Array<number>} mappings
   */
  constructor(mappings) {
    /** @type {!Uint16Array} */ this.b2c = new Uint16Array(256);
    /** @type {!Uint8Array} */ this.c2b = new Uint8Array(65536);
    /** @type {!Uint8Array} */ this.mappedB = new Uint8Array(256);
    /** @type {!Uint8Array} */ this.mappedC = new Uint8Array(65536);
    for (let i = 0; i < 256; i++) {
      this.addMapping(i, mappings[i]);
    }
  }

  /**
   * @param {number} b
   * @param {number} c
   */
  addMapping(b, c) {
    if (c === DEFAULT_CHAR_UNICODE) {
      // b is unmapped
      this.mappedB[b] = 0;
    } else {
      // b points to c
      this.b2c[b] = c;
      // c points to b
      this.c2b[c] = b;
      // b is "mapped"
      this.mappedB[b] = 1;
      // c is "mapped"
      this.mappedC[c] = 1;
    }
  }

  /**
   * @param {!encNS.Overrides} overrides
   */
  applyOverrides(overrides) {
    let k = 0;
    while (k < overrides.length - 1) {
      let b = overrides[k++];
      let c = overrides[k++];
      b = Number(b) & 0xff;
      c = typeof c === "number" ? c : c.charCodeAt(0);
      this.addMapping(b, c);
    }
  }

  /**
   * @param {string} [graphics]
   * @param {boolean} [graphicMode]
   */
  applyGraphics(graphics, graphicMode) {
    if (graphicMode) {
      // map graphic symbols to the first 32 codes
      const symbols = graphics?.slice(0, 32) ?? DEFAULT_GRAPHICS;
      for (let i = 0; i < symbols.length; i++) {
        const c = symbols.charAt(i).charCodeAt(0);
        this.addMapping(i, c);
      }
    }
  }

  /**
   * @param {!encNS.Options} [options]
   */
  setDefaults(options) {
    const defaultCharByte = getDefaultCharNumber(DEFAULT_CHAR_BYTE, options?.defaultCharByte);
    const defaultCharUnicode = getDefaultCharNumber(DEFAULT_CHAR_UNICODE, options?.defaultCharUnicode);
    for (let i = 0; i < 256; i++) {
      if (!this.mappedB[i]) {
        this.b2c[i] = defaultCharUnicode;
      }
    }
    for (let i = 0; i < 65536; i++) {
      if (!this.mappedC[i]) {
        this.c2b[i] = defaultCharByte;
      }
    }
  }
}

/**
 * @param {number} defaultValue
 * @param {string|!encNS.DefaultCharFunction} [c]
 * @returns {number}
 */
function getDefaultCharNumber(defaultValue, c) {
  return typeof c === "string" && c.length > 0 ? c.charCodeAt(0) : defaultValue;
}

// Decode Functions

/**
 * @param {!Uint8Array} bytes
 * @param {!Uint16Array} b2c
 * @param {function(!Uint16Array):string} convertFunc
 * @returns {string}
 */
function decodeSimple(bytes, b2c, convertFunc) {
  const len = bytes.length;
  const codes = new Uint16Array(len);
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    codes[i] = b2c[b];
  }
  return convertFunc(codes);
}

/**
 * @param {!Uint8Array} bytes
 * @param {!Uint16Array} b2c
 * @param {function(!Uint16Array):string} convertFunc
 * @param {!Uint8Array} mapped
 * @param {function(number,number):?number} handler
 * @returns {string}
 */
function decodeWithHandler(bytes, b2c, convertFunc, mapped, handler) {
  const len = bytes.length;
  const codes = new Uint16Array(len);
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    const c = b2c[b];
    codes[i] = mapped[b] ? c : (handler(b, i) ?? c);
  }
  return convertFunc(codes);
}

// Encode Functions

/**
 * @param {string} text
 * @param {!Uint8Array} c2b
 * @returns {!Uint8Array}
 */
function encodeSimple(text, c2b) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    bytes[i] = c2b[c];
  }
  return bytes;
}

/**
 * @param {string} text
 * @param {!Uint8Array} c2b
 * @param {!Uint8Array} mapped
 * @param {function(number,number):?number} handler
 * @returns {!Uint8Array}
 */
function encodeWithHandler(text, c2b, mapped, handler) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const b = c2b[c];
    bytes[i] = mapped[c] ? b : (handler(c, i) ?? b);
  }
  return bytes;
}

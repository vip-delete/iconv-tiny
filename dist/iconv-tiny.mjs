/**
 * iconv-tiny v1.2.1
 * (c) 2025-present vip.delete
 * @license MIT
 **/


// src/iconv-tiny.mjs
var canonicalize = (encoding) => encoding.toLowerCase().replace(/[^a-z0-9]/gu, "").replace(/(?<!\d)0+/gu, "");
var IconvTiny = class {
  /**
   * @param {!Object<string, !ns.EncodingFactory>} [encodings]
   * @param {string} [aliases]
   */
  constructor(encodings2, aliases2) {
    encodings2 ??= {};
    this.encodingFactoryMap = /* @__PURE__ */ new Map();
    this.cache = /* @__PURE__ */ new Map();
    const config = (aliases2 ?? "").split(",").map((row) => row.split(" ").map(canonicalize));
    for (const key of Object.keys(encodings2)) {
      const encoding = encodings2[key];
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
};

// src/commons.mjs
var REPLACEMENT_CHARACTER_CODE = 65533;
var DEFAULT_CHAR_BYTE = 63;
var DEFAULT_NATIVE_DECODE = false;
var STRING_SMALLSIZE = 192;
var STRING_CHUNKSIZE = 1024;
var UTF16 = new TextDecoder("UTF-16LE", { fatal: true });
var getString = (u16) => {
  const len = u16.length;
  if (len <= STRING_SMALLSIZE) {
    return String.fromCharCode(...u16);
  }
  try {
    return UTF16.decode(u16);
  } catch {
  }
  const result = [];
  for (let i = 0; i < len; i += STRING_CHUNKSIZE) {
    result.push(String.fromCharCode(...u16.subarray(i, i + STRING_CHUNKSIZE)));
  }
  return result.join("");
};
var Charset = class {
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
  // @ts-expect-error
  getName() {
    return this.charsetName;
  }
  /**
   * @override
   * @param {!Uint8Array} array
   * @param {!ns.DecoderOptions} [options]
   * @returns {string}
   */
  // @ts-expect-error
  decode(array, options) {
    const decoder = this.newDecoder(options);
    return decoder.decode(array) + decoder.decode();
  }
  /**
   * @override
   * @param {string} text
   * @param {!ns.EncoderOptions} [options]
   * @returns {!Uint8Array}
   */
  // @ts-expect-error
  encode(text, options) {
    const encoder = this.newEncoder(options);
    return encoder.encode(text);
  }
};
var NativeCharsetDecoder = class {
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
  // @ts-expect-error
  decode(array) {
    return this.decoder.decode(array, { stream: Boolean(array) });
  }
};
var CharsetEncoderBase = class {
  /**
   * @override
   * @param {string} [text]
   * @returns {!Uint8Array}
   */
  // @ts-expect-error
  encode(text) {
    if (!text) {
      return new Uint8Array(0);
    }
    const buf = new Uint8Array(this.byteLengthMax(text));
    const { written } = this.encodeInto(text, buf);
    return buf.subarray(0, written);
  }
  // @ts-expect-error
  // eslint-disable-next-line jsdoc/empty-tags
  /** @abstract @param {string} text @returns {number}  */
  // eslint-disable-next-line no-unused-vars, no-empty-function, class-methods-use-this
  byteLengthMax(text) {
  }
  /**
   * @override
   * @param {string} text
   * @returns {number}
   */
  // @ts-expect-error
  byteLength(text) {
    let total = 0;
    const buf = new Uint8Array(4096);
    do {
      const { read, written } = this.encodeInto(text, buf);
      text = text.slice(read);
      total += written;
    } while (text.length);
    return total;
  }
};

// src/sbcs.mjs
var SBCSDecoder = class {
  /**
   * @param {!Uint16Array} b2c
   * @param {!ns.DefaultCharUnicodeFunction|string} [defaultCharUnicode]
   */
  constructor(b2c, defaultCharUnicode) {
    this.b2c = b2c;
    if (typeof defaultCharUnicode !== "function") {
      const defaultCharUnicodeCode = defaultCharUnicode?.length ? defaultCharUnicode.charCodeAt(0) : REPLACEMENT_CHARACTER_CODE;
      defaultCharUnicode = () => defaultCharUnicodeCode;
    }
    this.handler = defaultCharUnicode;
  }
  /**
   * @override
   * @param {!Uint8Array} [array]
   * @returns {string}
   */
  // @ts-expect-error
  decode(array) {
    if (!array) {
      return "";
    }
    const { b2c, handler } = this;
    const len = array.length;
    const u16 = new Uint16Array(len);
    for (let i = 0; i < len; i++) {
      const byte = array[i];
      const ch = b2c[byte];
      u16[i] = ch === REPLACEMENT_CHARACTER_CODE ? handler(byte, i) ?? ch : ch;
    }
    return getString(u16);
  }
};
var SBCSEncoder = class extends CharsetEncoderBase {
  /**
   * @param {!Uint16Array} c2b
   * @param {!ns.DefaultCharByteFunction|string} [defaultCharByte]
   */
  constructor(c2b, defaultCharByte) {
    super();
    this.c2b = c2b;
    if (typeof defaultCharByte !== "function") {
      const defaultCharByteCode = defaultCharByte?.length ? defaultCharByte.charCodeAt(0) : DEFAULT_CHAR_BYTE;
      defaultCharByte = () => defaultCharByteCode;
    }
    this.handler = defaultCharByte;
  }
  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @returns {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(src, dst) {
    const { c2b, handler } = this;
    const len = Math.min(src.length, dst.length);
    for (let i = 0; i < len; i++) {
      const ch = src.charCodeAt(i);
      const byte = c2b[ch];
      dst[i] = byte === REPLACEMENT_CHARACTER_CODE ? handler(ch, i) ?? DEFAULT_CHAR_BYTE : byte;
    }
    return { read: len, written: len };
  }
  /**
   * @override
   * @param {string} text
   * @returns {number}
   */
  // eslint-disable-next-line class-methods-use-this
  byteLengthMax(text) {
    return text.length;
  }
  /**
   * @override
   * @param {string} text
   * @returns {number}
   */
  byteLength(text) {
    return this.byteLengthMax(text);
  }
};
var SBCSCharset = class extends Charset {
  /**
   * @param {string} charsetName
   * @param {!Uint16Array} b2c
   */
  constructor(charsetName, b2c) {
    super(charsetName);
    this.b2c = b2c;
    this.c2b = null;
    try {
      this.newNativeDecoder();
      this.nativeSupported = true;
    } catch {
      this.nativeSupported = false;
    }
  }
  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @returns {!ns.CharsetDecoder}
   */
  // @ts-expect-error
  newDecoder(options) {
    if (this.nativeSupported && (options?.native ?? DEFAULT_NATIVE_DECODE)) {
      return this.newNativeDecoder();
    }
    return new SBCSDecoder(this.b2c, options?.defaultCharUnicode);
  }
  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @returns {!ns.CharsetEncoder}
   */
  // @ts-expect-error
  newEncoder(options) {
    if (!this.c2b) {
      this.c2b = new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);
      for (let i = 0; i < 256; i++) {
        const ch = this.b2c[i];
        if (ch !== REPLACEMENT_CHARACTER_CODE) {
          this.c2b[ch] = i;
        }
      }
    }
    return new SBCSEncoder(this.c2b, options?.defaultCharByte);
  }
  /**
   * @private
   * @returns {!ns.CharsetDecoder}
   */
  newNativeDecoder() {
    return new NativeCharsetDecoder(new TextDecoder(this.charsetName));
  }
};
var getMappings = (symbols, diff) => {
  const mappings = new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);
  let i = 0;
  while (i < 256 - symbols.length) {
    mappings[i] = i++;
  }
  let j = 0;
  while (i < 256) {
    mappings[i++] = symbols.charCodeAt(j++);
  }
  let k = 0;
  while (k < diff.length) {
    mappings[diff.charCodeAt(k)] = diff.charCodeAt(k + 1);
    k += 2;
  }
  return mappings;
};
var SBCS = class {
  /**
   * @param {string} charsetName
   * @param {string} symbols
   * @param {string} [diff]
   */
  constructor(charsetName, symbols, diff) {
    this.charsetName = charsetName;
    this.symbols = symbols;
    this.diff = diff;
  }
  /**
   * @override
   * @param {!ns.Options} [options]
   * @returns {!ns.Encoding}
   */
  // @ts-expect-error
  create(options) {
    const b2c = getMappings(this.symbols, this.diff ?? "");
    const overrides = options?.overrides ?? [];
    let k = 0;
    while (k < overrides.length - 1) {
      const i = overrides[k++];
      const ch = overrides[k++];
      b2c[Number(i)] = typeof ch === "number" ? ch : ch.charCodeAt(0);
    }
    return new SBCSCharset(this.charsetName, b2c);
  }
};

// src/unicode.mjs
var BOM_CHAR = "\uFEFF";
var STRIP_BOM_DEFAULT = 1;
var ADD_BOM_DEFAULT = 0;
var put16LE = (src, i, dst, j) => {
  const cp = src.charCodeAt(i);
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  return 0;
};
var put16BE = (src, i, dst, j) => {
  const cp = src.charCodeAt(i);
  dst[j] = cp >> 8;
  dst[j + 1] = cp;
  return 0;
};
var put32LE = (src, i, dst, j) => {
  const cp = (
    /** @type {number} */
    src.codePointAt(i)
  );
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  dst[j + 2] = cp >> 16;
  dst[j + 3] = cp >> 24;
  return cp > 65535 ? 1 : 0;
};
var put32BE = (src, i, dst, j) => {
  const cp = (
    /** @type {number} */
    src.codePointAt(i)
  );
  dst[j] = cp >> 24;
  dst[j + 1] = cp >> 16;
  dst[j + 2] = cp >> 8;
  dst[j + 3] = cp;
  return cp > 65535 ? 1 : 0;
};
var get32LE = (src, i) => (src[i] | src[i + 1] << 8 | src[i + 2] << 16 | src[i + 3] << 24) >>> 0;
var get32BE = (src, i) => (src[i] << 24 | src[i + 1] << 16 | src[i + 2] << 8 | src[i + 3]) >>> 0;
var appendCodePoint = (dst, j, cp) => {
  if (cp > 1114111) {
    cp = REPLACEMENT_CHARACTER_CODE;
  }
  if (cp > 65535) {
    cp -= 65536;
    const high = 55296 | cp >> 10;
    const low = 56320 | cp & 1023;
    dst[j] = high;
    dst[j + 1] = high >> 8;
    dst[j + 2] = low;
    dst[j + 3] = low >> 8;
    return 4;
  }
  dst[j] = cp;
  dst[j + 1] = cp >> 8;
  return 2;
};
var UTF8Decoder = class extends NativeCharsetDecoder {
  /**
   * @param {boolean} noBOM - stripBOM
   */
  constructor(noBOM) {
    super(new TextDecoder("UTF-8", { ignoreBOM: noBOM }));
  }
};
var UTF8Encoder = class extends CharsetEncoderBase {
  /**
   * @param {number} doBOM
   */
  constructor(doBOM) {
    super();
    this.doBOM = doBOM;
    this.encoder = new TextEncoder();
  }
  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @returns {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(src, dst) {
    const { doBOM } = this;
    let j = 0;
    if (doBOM) {
      if (dst.length < 3) {
        return { read: 0, written: 0 };
      }
      dst[0] = 239;
      dst[1] = 187;
      dst[2] = 191;
      j += 3;
      this.doBOM = 0;
    }
    const { read, written } = this.encoder.encodeInto(src, dst.subarray(j));
    return { read, written: written + j };
  }
  /**
   * @override
   * @param {string} src
   * @returns {number}
   */
  byteLengthMax(src) {
    return (this.doBOM ? 4 : 0) + src.length * 4;
  }
};
var UnicodeEncoder = class extends CharsetEncoderBase {
  /**
   * @param {number} doBOM
   * @param {number} i - 0 for UTF-16, 1 for UTF-32
   * @param {number} bo - 0 for LE, 1 for BE
   */
  constructor(doBOM, i, bo) {
    super();
    this.doBOM = doBOM;
    this.sz = 1 << i + 1;
    this.put = i ? bo ? put32BE : put32LE : bo ? put16BE : put16LE;
  }
  /**
   * @override
   * @param {string} src
   * @param {!Uint8Array} dst
   * @returns {!ns.TextEncoderEncodeIntoResult}
   */
  // @ts-expect-error
  encodeInto(src, dst) {
    const { doBOM, sz, put } = this;
    let j = 0;
    if (doBOM) {
      if (dst.length < sz) {
        return { read: 0, written: 0 };
      }
      put(BOM_CHAR, 0, dst, j);
      j += sz;
      this.doBOM = 0;
    }
    const max = Math.min(src.length, dst.length - j & ~(sz - 1));
    for (let i = 0; i < max; i++, j += sz) {
      i += put(src, i, dst, j);
    }
    return { read: max, written: j };
  }
  /**
   * @override
   * @param {string} text
   * @returns {number}
   */
  byteLengthMax(text) {
    return (this.doBOM ? this.sz : 0) + text.length * this.sz;
  }
  /**
   * @override
   * @param {string} text
   * @returns {number}
   */
  byteLength(text) {
    if (this.sz === 4) {
      return super.byteLength(text);
    }
    return this.byteLengthMax(text);
  }
};
var POSTFIX = ["LE", "BE", ""];
var NAMES = [16, 32, 8];
var UTF16Decoder = class extends NativeCharsetDecoder {
  /**
   * @param {boolean} noBOM
   * @param {number} bo
   */
  constructor(noBOM, bo) {
    super(new TextDecoder("UTF-16" + POSTFIX[bo], { ignoreBOM: noBOM }));
  }
};
var UTF32Decoder = class {
  /**
   * @param {boolean} noBOM
   * @param {number} bo
   */
  constructor(noBOM, bo) {
    this.noBOM = noBOM;
    this.leftover = new Uint8Array(4);
    this.leftoverSize = 0;
    this.get32 = bo ? get32BE : get32LE;
  }
  /**
   * @override
   * @param {!Uint8Array} [src]
   * @returns {string}
   */
  // @ts-expect-error
  decode(src) {
    if (!src) {
      return this.leftoverSize ? String.fromCharCode(REPLACEMENT_CHARACTER_CODE) : "";
    }
    const dst = new Uint8Array(src.length + 4);
    let i = 0;
    let j = 0;
    if (this.leftoverSize) {
      while (this.leftoverSize < 4 && i < src.length) {
        this.leftover[this.leftoverSize++] = src[i++];
      }
      if (this.leftoverSize < 4) {
        return "";
      }
      j += appendCodePoint(dst, j, this.get32(this.leftover, 0));
    }
    const max = src.length - 3;
    for (; i < max; i += 4) {
      j += appendCodePoint(dst, j, this.get32(src, i));
    }
    this.leftoverSize = src.length - i;
    if (this.leftoverSize) {
      this.leftover.set(src.subarray(i));
    }
    return new TextDecoder("UTF-16", { ignoreBOM: this.noBOM }).decode(dst.subarray(0, j));
  }
};
var DECODERS = [UTF16Decoder, UTF32Decoder, UTF8Decoder];
var ENCODERS = [UnicodeEncoder, UnicodeEncoder, UTF8Encoder];
var UnicodeCharset = class extends Charset {
  /**
   * @param {number} i - 0 for UTF-16, 1 for UTF-32, 2 for UTF-8
   * @param {number} bo - 0 for LE, 1 for BE, 2 for none
   */
  constructor(i, bo) {
    super("UTF-" + NAMES[i] + POSTFIX[bo]);
    this.i = i;
    this.bo = bo;
  }
  /**
   * @override
   * @param {!ns.DecoderOptions} [options]
   * @returns {!ns.CharsetDecoder}
   */
  // @ts-expect-error
  newDecoder(options) {
    return new DECODERS[this.i](!(options?.stripBOM ?? STRIP_BOM_DEFAULT), this.bo);
  }
  /**
   * @override
   * @param {!ns.EncoderOptions} [options]
   * @returns {!ns.CharsetEncoder}
   */
  // @ts-expect-error
  newEncoder(options) {
    return new ENCODERS[this.i](options?.addBOM ?? ADD_BOM_DEFAULT, this.i, this.bo);
  }
};
var Unicode = class {
  /**
   * @param {number} i
   * @param {number} bo
   */
  constructor(i, bo) {
    this.i = i;
    this.bo = bo;
  }
  /**
   * @override
   * @returns {!ns.Encoding}
   */
  // @ts-expect-error
  create() {
    return new UnicodeCharset(this.i, this.bo);
  }
};

// dist/main.mjs
var ISO_8859_1 = new SBCS("ISO-8859-1", "");
var ISO_8859_2 = new SBCS("ISO-8859-2", "Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙");
var ISO_8859_3 = new SBCS("ISO-8859-3", "ŭŝ˙", "¡Ħ¢˘¥�¦Ĥ©İªŞ«Ğ¬Ĵ®�¯Ż±ħ¶ĥ¹ıºş»ğ¼ĵ¾�¿żÃ�ÅĊÆĈÐ�ÕĠØĜÝŬÞŜã�åċæĉð�õġøĝ");
var ISO_8859_4 = new SBCS("ISO-8859-4", "ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙");
var ISO_8859_5 = new SBCS("ISO-8859-5", "ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ");
var ISO_8859_6 = new SBCS("ISO-8859-6", "���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������");
var ISO_8859_7 = new SBCS("ISO-8859-7", "΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�", "¡‘¢’¤€¥₯ªͺ®�¯―");
var ISO_8859_8 = new SBCS("ISO-8859-8", "��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�", "¡�ª×º÷");
var ISO_8859_9 = new SBCS("ISO-8859-9", "ışÿ", "ÐĞÝİÞŞðğ");
var ISO_8859_10 = new SBCS("ISO-8859-10", "ĸ", "¡Ą¢Ē£Ģ¤Ī¥Ĩ¦Ķ¨Ļ©ĐªŠ«Ŧ¬Ž®Ū¯Ŋ±ą²ē³ģ´īµĩ¶ķ¸ļ¹đºš»ŧ¼ž½―¾ū¿ŋÀĀÇĮÈČÊĘÌĖÑŅÒŌ×ŨÙŲàāçįèčêęìėñņòō÷ũùų");
var ISO_8859_11 = new SBCS("ISO-8859-11", "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����");
var ISO_8859_13 = new SBCS("ISO-8859-13", "æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’", "¡”¥„¨ØªŖ¯Æ´“¸øºŗ");
var ISO_8859_14 = new SBCS("ISO-8859-14", "ŷÿ", "¡Ḃ¢ḃ¤Ċ¥ċ¦Ḋ¨ẀªẂ«ḋ¬Ỳ¯Ÿ°Ḟ±ḟ²Ġ³ġ´Ṁµṁ·Ṗ¸ẁ¹ṗºẃ»Ṡ¼ỳ½Ẅ¾ẅ¿ṡÐŴ×ṪÞŶðŵ÷ṫ");
var ISO_8859_15 = new SBCS("ISO-8859-15", "", "¤€¦Š¨š´Ž¸ž¼Œ½œ¾Ÿ");
var ISO_8859_16 = new SBCS("ISO-8859-16", "ęțÿ", "¡Ą¢ą£Ł¤€¥„¦Š¨šªȘ¬Ź®ź¯Ż²Č³ł´Žµ”¸ž¹čºș¼Œ½œ¾Ÿ¿żÃĂÅĆÐĐÑŃÕŐ×ŚØŰÝĘÞȚãăåćðđñńõő÷śøű");
var CP037 = new SBCS("CP037", "	\v\f\r\b\n\x1B\x07  âäàáãåçñ¢.<(+|&éêëèíîïìß!$*);¬-/ÂÄÀÁÃÅÇÑ¦,%_>?øÉÊËÈÍÎÏÌ`:#@'=\"Øabcdefghi«»ðýþ±°jklmnopqrªºæ¸Æ¤µ~stuvwxyz¡¿ÐÝÞ®^£¥·©§¶¼½¾[]¯¨´×{ABCDEFGHI­ôöòóõ}JKLMNOPQR¹ûüùúÿ\\÷STUVWXYZ²ÔÖÒÓÕ0123456789³ÛÜÙÚ");
var CP500 = new SBCS("CP500", "	\v\f\r\b\n\x1B\x07  âäàáãåçñ[.<(+!&éêëèíîïìß]$*);^-/ÂÄÀÁÃÅÇÑ¦,%_>?øÉÊËÈÍÎÏÌ`:#@'=\"Øabcdefghi«»ðýþ±°jklmnopqrªºæ¸Æ¤µ~stuvwxyz¡¿ÐÝÞ®¢£¥·©§¶¼½¾¬|¯¨´×{ABCDEFGHI­ôöòóõ}JKLMNOPQR¹ûüùúÿ\\÷STUVWXYZ²ÔÖÒÓÕ0123456789³ÛÜÙÚ");
var CP875 = new SBCS("CP875", "	\v\f\r\b\n\x1B\x07 ΑΒΓΔΕΖΗΘΙ[.<(+!&ΚΛΜΝΞΟΠΡΣ]$*);^-/ΤΥΦΧΨΩΪΫ|,%_>?¨ΆΈΉ ΊΌΎΏ`:#@'=\"΅abcdefghiαβγδεζ°jklmnopqrηθικλμ´~stuvwxyzνξοπρσ£άέήϊίόύϋώςτυφχψ{ABCDEFGHI­ωΐΰ‘―}JKLMNOPQR±½�·’¦\\₯STUVWXYZ²§ͺ�«¬0123456789³©€�»");
var CP1026 = new SBCS("CP1026", "	\v\f\r\b\n\x1B\x07  âäàáãå{ñÇ.<(+!&éêëèíîïìßĞİ*);^-/ÂÄÀÁÃÅ[Ñş,%_>?øÉÊËÈÍÎÏÌı:ÖŞ'=ÜØabcdefghi«»}`¦±°jklmnopqrªºæ¸Æ¤µöstuvwxyz¡¿]$@®¢£¥·©§¶¼½¾¬|¯¨´×çABCDEFGHI­ô~òóõğJKLMNOPQR¹û\\ùúÿü÷STUVWXYZ²Ô#ÒÓÕ0123456789³Û\"ÙÚ");
var CP437 = new SBCS("CP437", "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ");
var CP737 = new SBCS("CP737", "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ωάέήϊίόύϋώΆΈΉΊΌΎΏ±≥≤ΪΫ÷≈°∙·√ⁿ²■ ");
var CP775 = new SBCS("CP775", "ĆüéāäģåćłēŖŗīŹÄÅÉæÆōöĢ¢ŚśÖÜø£Ø×¤ĀĪóŻżź”¦©®¬½¼Ł«»░▒▓│┤ĄČĘĖ╣║╗╝ĮŠ┐└┴┬├─┼ŲŪ╚╔╩╦╠═╬Žąčęėįšųūž┘┌█▄▌▐▀ÓßŌŃõÕµńĶķĻļņĒŅ’­±“¾¶§÷„°∙·¹³²■ ");
var CP850 = new SBCS("CP850", "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ ");
var CP852 = new SBCS("CP852", "ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´­˝˛ˇ˘§÷¸°¨˙űŘř■ ");
var CP855 = new SBCS("CP855", "ђЂѓЃёЁєЄѕЅіІїЇјЈљЉњЊћЋќЌўЎџЏюЮъЪаАбБцЦдДеЕфФгГ«»░▒▓│┤хХиИ╣║╗╝йЙ┐└┴┬├─┼кК╚╔╩╦╠═╬¤лЛмМнНоОп┘┌█▄Пя▀ЯрРсСтТуУжЖвВьЬ№­ыЫзЗшШэЭщЩчЧ§■ ");
var CP857 = new SBCS("CP857", "ÇüéâäàåçêëèïîıÄÅÉæÆôöòûùİÖÜø£ØŞşáíóúñÑĞğ¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ºªÊËÈ�ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµ�×ÚÛÙìÿ¯´­±�¾¶§÷¸°¨·¹³²■ ");
var CP860 = new SBCS("CP860", "ÇüéâãàÁçêÊèÍÔìÃÂÉÀÈôõòÚùÌÕÜ¢£Ù₧ÓáíóúñÑªº¿Ò¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ");
var CP861 = new SBCS("CP861", "ÇüéâäàåçêëèÐðÞÄÅÉæÆôöþûÝýÖÜø£Ø₧ƒáíóúÁÍÓÚ¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ");
var CP862 = new SBCS("CP862", "אבגדהוזחטיךכלםמןנסעףפץצקרשת¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ");
var CP863 = new SBCS("CP863", "ÇüéâÂà¶çêëèïî‗À§ÉÈÊôËÏûù¤ÔÜ¢£ÙÛƒ¦´óú¨¸³¯Î⌐¬½¼¾«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ");
var CP864 = new SBCS("CP864", "°·∙√▒─│┼┤┬├┴┐┌└┘β∞φ±½¼≈«»ﻷﻸ��ﻻﻼ� ­ﺂ£¤ﺄ��ﺎﺏﺕﺙ،ﺝﺡﺥ٠١٢٣٤٥٦٧٨٩ﻑ؛ﺱﺵﺹ؟¢ﺀﺁﺃﺅﻊﺋﺍﺑﺓﺗﺛﺟﺣﺧﺩﺫﺭﺯﺳﺷﺻﺿﻁﻅﻋﻏ¦¬÷×ﻉـﻓﻗﻛﻟﻣﻧﻫﻭﻯﻳﺽﻌﻎﻍﻡﹽّﻥﻩﻬﻰﻲﻐﻕﻵﻶﻝﻙﻱ■�", "%٪");
var CP865 = new SBCS("CP865", "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø₧ƒáíóúñÑªº¿⌐¬½¼¡«¤░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ");
var CP866 = new SBCS("CP866", "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■ ");
var CP869 = new SBCS("CP869", "������Ά�·¬¦‘’Έ―ΉΊΪΌ��ΎΫ©Ώ²³ά£έήίϊΐόύΑΒΓΔΕΖΗ½ΘΙ«»░▒▓│┤ΚΛΜΝ╣║╗╝ΞΟ┐└┴┬├─┼ΠΡ╚╔╩╦╠═╬ΣΤΥΦΧΨΩαβγ┘┌█▄δε▀ζηθικλμνξοπρσςτ΄­±υφχ§ψ΅°¨ωϋΰώ■ ");
var CP874 = new SBCS("CP874", "€����…�����������‘’“”•–—�������� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����");
var CP1250 = new SBCS("CP1250", "€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙");
var CP1251 = new SBCS("CP1251", "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя");
var CP1252 = new SBCS("CP1252", "", "€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ");
var CP1253 = new SBCS("CP1253", "€�‚ƒ„…†‡�‰�‹�����‘’“”•–—�™�›���� ΅Ά£¤¥¦§¨©�«¬­®―°±²³΄µ¶·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�");
var CP1254 = new SBCS("CP1254", "ışÿ", "€�‚ƒ„…†‡ˆ‰Š‹Œ����‘’“”•–—˜™š›œ��ŸÐĞÝİÞŞðğ");
var CP1255 = new SBCS("CP1255", "€�‚ƒ„…†‡ˆ‰�‹�����‘’“”•–—˜™�›���� ¡¢£₪¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾¿ְֱֲֳִֵֶַָֹֺֻּֽ־ֿ׀ׁׂ׃װױײ׳״�������אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�");
var CP1256 = new SBCS("CP1256", "€پ‚ƒ„…†‡ˆ‰ٹ‹Œچژڈگ‘’“”•–—ک™ڑ›œ‌‍ں ،¢£¤¥¦§¨©ھ«¬­®¯°±²³´µ¶·¸¹؛»¼½¾؟ہءآأؤإئابةتثجحخدذرزسشصض×طظعغـفقكàلâمنهوçèéêëىيîïًٌٍَôُِ÷ّùْûü‎‏ے");
var CP1257 = new SBCS("CP1257", "€�‚�„…†‡�‰�‹�¨ˇ¸�‘’“”•–—�™�›�¯˛� �¢£¤�¦§Ø©Ŗ«¬­®Æ°±²³´µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž˙");
var CP1258 = new SBCS("CP1258", "ư₫ÿ", "€�‚ƒ„…†‡ˆ‰�‹Œ����‘’“”•–—˜™�›œ��ŸÃĂÌ̀ÐĐÒ̉ÕƠÝƯÞ̃ãăì́ðđọ̀õơ");
var MAC_CYRILLIC = new SBCS("MAC-CYRILLIC", "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°¢£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµ∂ЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤");
var MAC_GREEK = new SBCS("MAC-GREEK", "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦­ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ�");
var MAC_ICELAND = new SBCS("MAC-ICELAND", "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ");
var MAC_LATIN2 = new SBCS("MAC-LATIN2", "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ");
var MAC_ROMAN = new SBCS("MAC-ROMAN", "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ");
var MAC_TURKISH = new SBCS("MAC-TURKISH", "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙ�ˆ˜¯˘˙˚¸˝˛ˇ");
var ATARIST = new SBCS("ATARIST", "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥ßƒáíóúñÑªº¿⌐¬½¼¡«»ãõØøœŒÀÃÕ¨´†¶©®™ĳĲאבגדהוזחטיכלמנסעפצקרשתןךםףץ§∧∞αβΓπΣσµτΦΘΩδ∮φ∈∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²³¯");
var CP424 = new SBCS("CP424", "	\v\f\r\b\n\x1B\x07 אבגדהוזחט¢.<(+|&יךכלםמןנס!$*);¬-/עףפץצקרש¦,%_>?pתrs uvw‗`:#@'=\"�abcdefghi«»���±°jklmnopqr���¸�¤µ~stuvwxyz�����®^£¥·©§¶¼½¾[]¯¨´×{ABCDEFGHI­�����}JKLMNOPQR¹�����\\÷STUVWXYZ²�����0123456789³����");
var CP856 = new SBCS("CP856", "אבגדהוזחטיךכלםמןנסעףפץצקרשת�£�×����������®¬½¼�«»░▒▓│┤���©╣║╗╝¢¥┐└┴┬├─┼��╚╔╩╦╠═╬¤���������┘┌█▄¦�▀������µ�������¯´­±‗¾¶§÷¸°¨·¹³²■ ");
var CP1006 = new SBCS("CP1006", "۰۱۲۳۴۵۶۷۸۹،؛­؟ﺁﺍﺎﺎﺏﺑﭖﭘﺓﺕﺗﭦﭨﺙﺛﺝﺟﭺﭼﺡﺣﺥﺧﺩﮄﺫﺭﮌﺯﮊﺱﺳﺵﺷﺹﺻﺽﺿﻁﻅﻉﻊﻋﻌﻍﻎﻏﻐﻑﻓﻕﻗﻙﻛﮒﮔﻝﻟﻠﻡﻣﮞﻥﻧﺅﻭﮦﮨﮩﮪﺀﺉﺊﺋﻱﻲﻳﮰﮮﹼﹽ");
var KOI8_R = new SBCS("KOI8-R", "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ");
var KOI8_U = new SBCS("KOI8-U", "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґ╝╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪Ґ╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ");
var KZ1048 = new SBCS("KZ1048", "ЂЃ‚ѓ„…†‡€‰Љ‹ЊҚҺЏђ‘’“”•–—�™љ›њқһџ ҰұӘ¤Ө¦§Ё©Ғ«¬­®Ү°±Ііөµ¶·ё№ғ»әҢңүАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя");
var NEXTSTEP = new SBCS("NEXTSTEP", " ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞµ×÷©¡¢£⁄¥ƒ§¤’“«‹›ﬁﬂ®–†‡·¦¶•‚„”»…‰¬¿¹ˋ´ˆ˜¯˘˙¨²˚¸³˝˛ˇ—±¼½¾àáâãäåçèéêëìÆíªîïðñŁØŒºòóôõöæùúûıüýłøœßþÿ��");
var US_ASCII = new SBCS("US-ASCII", "�".repeat(128));
var UTF8 = new Unicode(2, 2);
var UTF16LE = new Unicode(0, 0);
var UTF16BE = new Unicode(0, 1);
var UTF32LE = new Unicode(1, 0);
var UTF32BE = new Unicode(1, 1);
var encodings = { ISO_8859_1, ISO_8859_2, ISO_8859_3, ISO_8859_4, ISO_8859_5, ISO_8859_6, ISO_8859_7, ISO_8859_8, ISO_8859_9, ISO_8859_10, ISO_8859_11, ISO_8859_13, ISO_8859_14, ISO_8859_15, ISO_8859_16, CP037, CP500, CP875, CP1026, CP437, CP737, CP775, CP850, CP852, CP855, CP857, CP860, CP861, CP862, CP863, CP864, CP865, CP866, CP869, CP874, CP1250, CP1251, CP1252, CP1253, CP1254, CP1255, CP1256, CP1257, CP1258, MAC_CYRILLIC, MAC_GREEK, MAC_ICELAND, MAC_LATIN2, MAC_ROMAN, MAC_TURKISH, ATARIST, CP424, CP856, CP1006, KOI8_R, KOI8_U, KZ1048, NEXTSTEP, US_ASCII, UTF8, UTF16LE, UTF16BE, UTF32LE, UTF32BE };
var aliases = "ISO-8859-1 819 88591 cp819 csisolatin1 ibm819 isoir100 l1 latin1,ISO-8859-2 88592 912 cp912 csisolatin2 ibm912 isoir101 l2 latin2,ISO-8859-3 88593 913 cp913 csisolatin3 ibm913 isoir109 l3 latin3,ISO-8859-4 88594 914 cp914 csisolatin4 ibm914 isoir110 l4 latin4,ISO-8859-5 88595 915 cp915 csisolatincyrillic cyrillic ibm915 isoir144,ISO-8859-6 1089 88596 arabic asmo708 cp1089 csisolatinarabic ecma114 ibm1089 isoir127,ISO-8859-7 813 88597 cp813 csisolatingreek ecma118 elot928 greek greek8 ibm813 isoir126 suneugreek,ISO-8859-8 88598 916 cp916 csisolatinhebrew hebrew ibm916 isoir138,ISO-8859-9 88599 920 cp920 csisolatin5 ibm920 isoir148 l5 latin5,ISO-8859-10 csisolatin6 isoir157 l6 latin6,ISO-8859-11 xiso885911,ISO-8859-13 885913,ISO-8859-14 isoceltic isoir199 l8 latin8,ISO-8859-15 885915 923 cp923 csiso885915 csisolatin csisolatin9 ibm923 iso885915fdis l9 latin latin9,ISO-8859-16 csiso885916 iso8859162001 isoir226 l10 latin10,CP037 37 cpibm37 csebcdiccpca csebcdiccpnl csebcdiccpus csebcdiccpwt csibm37 ebcdiccpca ebcdiccpnl ebcdiccpus ebcdiccpwt ibm37,CP500 500 csibm500 ebcdiccpbh ebcdiccpch ibm500,CP875 875 ibm875 xibm875,CP1026 1026 ibm1026,CP437 437 cspc8codepage437 ibm437 windows437,CP737 737 ibm737 xibm737,CP775 775 ibm775,CP850 850 cspc850multilingual ibm850,CP852 852 cspcp852 ibm852,CP855 855 cspcp855 ibm855,CP857 857 csibm857 ibm857,CP860 860 csibm860 ibm860,CP861 861 cpis csibm861 ibm861,CP862 862 csibm862 cspc862latinhebrew ibm862,CP863 863 csibm863 ibm863,CP864 864 csibm864 ibm864,CP865 865 csibm865 ibm865,CP866 866 csibm866 ibm866,CP869 869 cpgr csibm869 ibm869,CP874 874 ibm874 xibm874,CP1250 cp5346 win1250 windows1250,CP1251 ansi1251 cp5347 win1251 windows1251,CP1252 cp5348 ibm1252 win1252 windows1252,CP1253 cp5349 win1253 windows1253,CP1254 cp5350 win1254 windows1254,CP1255 win1255 windows1255,CP1256 win1256 windows1256,CP1257 cp5353 win1257 windows1257,CP1258 win1258 windows1258,MAC-CYRILLIC xmaccyrillic,MAC-GREEK xmacgreek,MAC-ICELAND xmaciceland,MAC-LATIN2 maccentraleurope xmaccentraleurope,MAC-ROMAN xmacroman,MAC-TURKISH xmacturkish,ATARIST,CP424 424 csibm424 ebcdiccphe ibm424,CP856 856 ibm856 xibm856,CP1006 1006 ibm1006 xibm1006,KOI8-R cskoi8r koi8,KOI8-U cskoi8u,KZ1048 cskz1048 rk1048 strk10482002,NEXTSTEP we8nextstep,US-ASCII 646 ansix34 ascii ascii7 cp367 csascii default ibm367 iso646irv iso646us isoir6 us,UTF8 unicode11utf8,UTF16LE utf16,UTF16BE,UTF32LE utf32,UTF32BE";
export {
  ATARIST,
  CP037,
  CP1006,
  CP1026,
  CP1250,
  CP1251,
  CP1252,
  CP1253,
  CP1254,
  CP1255,
  CP1256,
  CP1257,
  CP1258,
  CP424,
  CP437,
  CP500,
  CP737,
  CP775,
  CP850,
  CP852,
  CP855,
  CP856,
  CP857,
  CP860,
  CP861,
  CP862,
  CP863,
  CP864,
  CP865,
  CP866,
  CP869,
  CP874,
  CP875,
  ISO_8859_1,
  ISO_8859_10,
  ISO_8859_11,
  ISO_8859_13,
  ISO_8859_14,
  ISO_8859_15,
  ISO_8859_16,
  ISO_8859_2,
  ISO_8859_3,
  ISO_8859_4,
  ISO_8859_5,
  ISO_8859_6,
  ISO_8859_7,
  ISO_8859_8,
  ISO_8859_9,
  IconvTiny,
  KOI8_R,
  KOI8_U,
  KZ1048,
  MAC_CYRILLIC,
  MAC_GREEK,
  MAC_ICELAND,
  MAC_LATIN2,
  MAC_ROMAN,
  MAC_TURKISH,
  NEXTSTEP,
  SBCS,
  US_ASCII,
  UTF16BE,
  UTF16LE,
  UTF32BE,
  UTF32LE,
  UTF8,
  Unicode,
  aliases,
  canonicalize,
  encodings
};

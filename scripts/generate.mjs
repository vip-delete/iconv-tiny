import { buildSync } from "esbuild";
import { getString, REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";
import { canonicalize } from "../src/iconv.mjs";
import { existsSync, getBanner, getExports, getIdentifier, mkdirSync, readFileSync, writeFileSync } from "./commons.mjs";
import unicodeConfig from "./unicode.config.json" with { type: "json" };
import whatwgConfig from "./whatwg.config.json" with { type: "json" };

/**
 * @enum {string}
 */
const EncodingsStandard = {
  UNICODE: "unicode", // https://www.unicode.org/Public/MAPPINGS/
  WHATWG: "whatwg", // https://encoding.spec.whatwg.org
};

/**
 * @typedef {{
 *   name: string,
 *   ascii?: boolean,
 *   parent?: string,
 *   aliases?: string,
 * }} Encoding
 */

/**
 * @typedef {{
 *   url: string,
 *   type: string,
 *   encoding: !Encoding,
 * }} EncodingConfig
 */

/**
 * @typedef {(content: string) => !Map<number, number>} ParseMappingsFn
 */

/**
 * @typedef {(encoding: !Encoding, b2c: !Uint16Array, parentB2C: ?Uint16Array) => string} EncodingArgumentFactory
 */

/**
 * @param {boolean} condition
 * @param {string} [msg]
 * @returns {undefined}
 */
const assert = (condition, msg) => {
  if (!condition) {
    throw new Error(msg);
  }
};

/**
 * @type {!Array<!Array<string>>}
 */
const STRING_ESCAPE_MAPPINGS = [
  ["\\", "\\\\"],
  ["\x22", "\\\x22"], // QUOTATION MARK
  ["\x07", "\\x07"],
  ["\x1B", "\\x1B"],
  ["\b", "\\b"],
  ["\n", "\\n"],
  ["\v", "\\v"], // 0x0B Vertical Tab
  ["\f", "\\f"], // 0x0C Form Feed
  ["\r", "\\r"],
  ["\x00", "\\x00"], // NULL
];

/**
 * @param {string} str
 * @returns {string}
 */
const escape = (str) => {
  for (let i = 0; i < STRING_ESCAPE_MAPPINGS.length; i++) {
    const row = STRING_ESCAPE_MAPPINGS[i];
    str = str.replaceAll(row[0], row[1]);
  }
  return str;
};

/**
 * @param {number} num
 * @returns {string}
 */
const hex = (num) => `0x${num.toString(16).toUpperCase().padStart(4, "0")}`;

/**
 * @type {!ParseMappingsFn}
 */
const parseUnicodeMappings = (content) => {
  /**
   * @type {!Map<number, number>}
   */
  const mappings = new Map();
  const lines = content.split("\n");
  lines.forEach((line) => {
    const i = line.indexOf("#");
    if (i === 0) {
      // ignore comments
      return;
    }
    const beforeHash = i === -1 ? line : line.substring(0, i).trim();
    const parts = beforeHash.split(/\s+/u).filter(Boolean).map(Number).filter(Number.isFinite);
    if (!parts.length) {
      // ignore empty lines
      return;
    }
    const key = parts[0];
    assert(Number.isInteger(key), `Key "${key}" is not an integer: ${line}`);
    assert(key >= 0 && key <= 0xffff, `Key "${key}" is not in range [0...${hex(0xffff)}]: ${line}`);
    assert(!mappings.has(key), `Duplicate key "${hex(key)}": ${line}`);
    const value = parts[1] ?? null;
    if (value !== null) {
      assert(value >= 0 && value <= 0xffff, `Value "${value}" is not in range [0...0xFFFF]: ${line}`);
    }
    mappings.set(key, value);
  });
  return mappings;
};

/**
 * @type {!ParseMappingsFn}
 */
const parseWHATWGMappings = (content) => {
  /**
   * @type {!Map<number, number>}
   */
  const mappings = new Map();

  for (let i = 0; i < 128; i++) {
    mappings.set(i, i);
  }

  const lines = content.split("\n");
  lines.forEach((line) => {
    const i = line.indexOf("#");
    if (i === 0) {
      // ignore comments
      return;
    }
    const beforeHash = i === -1 ? line : line.substring(0, i).trim();
    const parts = beforeHash.split(/\s+/u).filter(Boolean).map(Number).filter(Number.isFinite);
    if (!parts.length) {
      // ignore empty lines
      return;
    }
    let key = Number(parts[0]);
    assert(Number.isInteger(key), `Key "${key}" is not an integer: ${line}`);
    key += 128;
    assert(key >= 0 && key <= 0xffff, `Key "${key}" is not in range [0...${hex(0xffff)}]: ${line}`);
    assert(!mappings.has(key), `Duplicate key "${hex(key)}": ${line}`);
    const value = parts[1] ?? null;
    if (value !== null) {
      assert(value >= 0 && value <= 0xffff, `Value "${value}" is not in range [0...0xFFFF]: ${line}`);
    }
    mappings.set(key, value);
  });
  return mappings;
};

/**
 * @type {!ParseMappingsFn}
 */
const parseMappings = (content) => {
  if (content.substring(0, 200).includes("encoding.spec.whatwg.org")) {
    return parseWHATWGMappings(content);
  }
  return parseUnicodeMappings(content);
};

/**
 * @param {!EncodingsStandard} standard
 * @param {!Encoding} encoding
 * @param {!Map<number, number>} mappings
 */
const applyOverrides = (standard, encoding, mappings) => {
  const filename = `scripts/${standard}/${encoding.name}.TXT`;
  if (existsSync(filename)) {
    const content = readFileSync(filename);
    const overrides = parseMappings(content);
    for (const [key, value] of overrides) {
      const oldValue = mappings.get(key) ?? null;
      const oldValueStr = oldValue === null ? "<UNDEFINED>" : hex(oldValue);
      const newValueStr = value === null ? "<UNDEFINED>" : hex(value);
      console.log(`OVERRIDE ${encoding.name.padEnd(8, " ")} Key = ${hex(key)}: ${oldValueStr} -> ${newValueStr}`);
      mappings.set(key, value);
    }
  }
};

/**
 * @param {!EncodingsStandard} standard
 * @param {!Encoding} encoding
 * @returns {!Map<number,number>}
 */
export const loadMappings = (standard, encoding) => {
  const filename = `temp/${standard}/${encoding.name}.TXT`;
  const content = readFileSync(filename);
  const mappings = parseMappings(content);
  applyOverrides(standard, encoding, mappings);
  return mappings;
};

/**
 * @param {!EncodingsStandard} standard
 * @param {!EncodingConfig} cfg
 * @param {!Array<() => Promise<void>>} tasks
 */
const fetchEncoding = (standard, cfg, tasks) => {
  const url = cfg.url;
  const filename = `temp/${standard}/${cfg.encoding.name}.TXT`;
  // fetch the file if it doesn't exist
  if (!existsSync(filename)) {
    mkdirSync(`temp/${standard}`);
    tasks.push(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch from "${url}" failed: ${response.status}\n${errorText}`);
      }
      const content = await response.arrayBuffer();
      writeFileSync(filename, new Uint8Array(content));
    });
  }
};

/**
 * @param {!EncodingsStandard} standard
 * @param {!Array<!EncodingConfig>} encodingConfigs
 * @returns {!Promise<void>}
 */
const fetchEncodings = async (standard, encodingConfigs) => {
  /**
   * @type {!Array<() => Promise<void>>}
   */
  const tasks = [];
  for (const cfg of encodingConfigs) {
    fetchEncoding(standard, cfg, tasks);
  }
  await Promise.all(tasks.map((task) => task()));
};

/**
 * @param  {!Encoding} encoding
 * @param {!Map<number, number>} mappings
 * @returns {!Uint16Array}
 */
const createB2C = (encoding, mappings) => {
  const b2c = new Uint16Array(65536).fill(REPLACEMENT_CHARACTER_CODE);
  if (encoding?.ascii) {
    // some encodings don't have ascii mappings but imply
    for (let i = 0; i < 128; i++) {
      b2c[i] = i;
    }
  }
  for (const [key, value] of mappings) {
    if (value !== null) {
      b2c[key] = value;
    }
  }
  return b2c;
};

/**
 * @param {!Map<string, Uint16Array>} dataMap
 * @param {string} [base]
 * @returns {?Uint16Array}
 */
const getBaseB2C = (dataMap, base) => {
  if (!base) {
    return null;
  }
  const baseData = dataMap.get(base) ?? null;
  assert(baseData !== null, "No base encoding found: " + base);
  return baseData;
};

/**
 * @param {!Encoding} encoding
 * @param {!EncodingArgumentFactory} factory
 * @param {!Map<number,number>} mappings
 * @param {!Array<string>} mjs
 * @param {!Map<string, Uint16Array>} dataMap
 */
const processB2C = (encoding, factory, mappings, mjs, dataMap) => {
  const name = encoding.name;
  const b2c = createB2C(encoding, mappings);
  dataMap.set(name, b2c);
  const parentB2C = getBaseB2C(dataMap, encoding.parent);
  mjs.push(`${getIdentifier(name)}=${factory(encoding, b2c, parentB2C)}`);
};

// SPACE means the same character as an index for index >= 128
const SAME_CHARCODE = " ".charCodeAt(0);

// QUESTION MARK means replacement character for index >= 128
const UNKNOWN_CHARCODE = "?".charCodeAt(0);

/**
 * @type {!EncodingArgumentFactory}
 */
const sbcsEncodingArgumentFactory = (encoding, b2c) => {
  const overrides = [];
  let bestBytesInUTF8 = Number.MAX_VALUE;
  let bestArgs = "";
  const encoder = new TextEncoder();

  let i = 128;
  while (i < 256 && b2c[i] === i) {
    i++;
  }

  while (i < 256) {
    const ch = b2c[i];
    assert(ch !== SAME_CHARCODE);
    assert(ch !== UNKNOWN_CHARCODE);
    if (ch === i) {
      b2c[i] = SAME_CHARCODE;
    }
    if (ch === REPLACEMENT_CHARACTER_CODE) {
      b2c[i] = UNKNOWN_CHARCODE;
    }
    i++;
  }

  i = 0;
  while (i < 256) {
    const ch = b2c[i];
    if (i !== ch && !(i >= 128 && ch === SAME_CHARCODE)) {
      overrides.push(escape(String.fromCharCode(i)));
      overrides.push(escape(String.fromCharCode(ch)));
    }
    if (overrides.length >= 20) {
      // too many overrides are bad for gzip
      break;
    }
    const overridesStr = overrides.length === 0 ? "" : `,"${overrides.join("")}"`;
    const args = `"${escape(String.fromCharCode(...b2c.subarray(i + 1, 256)))}"${overridesStr}`;
    const bytesInUTF8 = encoder.encode(args).length;
    if (bytesInUTF8 < bestBytesInUTF8) {
      bestBytesInUTF8 = bytesInUTF8;
      bestArgs = args;
    }
    i++;
  }
  return `new SBCS("${encoding.name}",${bestArgs})`;
};

/**
 * @param {!Uint16Array} arr
 * @param {number} startIdx
 * @param {number} endIdx
 * @returns {!Array<number|string>}
 */
const compressRange = (arr, startIdx, endIdx) => {
  /**
   * @type {!Array<number|string>}
   */
  const result = [];
  result.push(startIdx.toString(16));
  let singleStart = startIdx;

  let i = startIdx;
  while (i < endIdx) {
    let count = 1;

    while (i + count < endIdx && arr[i + count] === arr[i + count - 1] + 1) {
      count++;
    }

    if (count > 4) {
      if (i > singleStart) {
        result.push(getString(arr.subarray(singleStart, i + 1)));
      } else {
        result.push(String.fromCharCode(arr[i]));
      }
      result.push(count - 1);
      singleStart = i + count;
    }

    i += count;
  }

  if (singleStart < endIdx) {
    result.push(getString(arr.subarray(singleStart, endIdx)));
  }

  return result;
};

/**
 * @type {!EncodingArgumentFactory}
 */
const dbcsEncodingArgumentFactory = (encoding, b2c, parentB2C) => {
  /**
   * @type {!Array<!Array<number|string>>}
   */
  const table = [];
  let start = 0;

  for (let i = 0; i < b2c.length; i++) {
    const value = b2c[i];
    if (value === REPLACEMENT_CHARACTER_CODE || (parentB2C !== null && i < parentB2C.length && parentB2C[i] === value)) {
      if (start < i) {
        table.push(compressRange(b2c, start, i));
      }
      start = i + 1;
    }
  }

  if (start < b2c.length) {
    table.push(compressRange(b2c, start, b2c.length));
  }

  // format

  /**
   * @type {!Array<string>}
   */
  const mappingTable = [];
  for (let i = 0; i < table.length; i++) {
    mappingTable.push(JSON.stringify(table[i]));
  }
  const json = "[\n" + mappingTable.join(",\n") + "\n]";

  const parent = encoding.parent ? getIdentifier(encoding.parent) : null;
  return `new DBCS("${encoding.name}",${parent},${json})`;
};

/**
 * @param {!Array<string>} mjs
 * @param {!Array<!Encoding>} encodings
 */
const processUnicode = (mjs, encodings) => {
  // add Unicode
  mjs.push(`UTF8=new Singleton(UTF_8)`);
  mjs.push(`UTF16LE=new Singleton(UTF_16LE)`);
  mjs.push(`UTF16BE=new Singleton(UTF_16BE)`);
  mjs.push(`UTF32LE=new Singleton(UTF_32LE)`);
  mjs.push(`UTF32BE=new Singleton(UTF_32BE)`);
  encodings.push({ name: "UTF8", aliases: "unicode-1-1-utf-8 unicode11utf8 unicode20utf8 utf-8 utf8 x-unicode20utf8" });
  encodings.push({ name: "UTF16LE", aliases: "UTF16" });
  encodings.push({ name: "UTF16BE", aliases: "" });
  encodings.push({ name: "UTF32LE", aliases: "UTF32" });
  encodings.push({ name: "UTF32BE", aliases: "" });
};

/**
 * @param {!EncodingsStandard} standard
 * @param {!Array<string>} ids
 */
const generateMTS = (standard, ids) => {
  /**
   * @type {!Array<string>}
   */
  const mts = [];
  const lines = readFileSync("src/global.d.ts").split(/\r\n|\n/u);
  for (const line of lines) {
    if (line.length === 0) {
      mts.push(line);
    } else if (line.startsWith("  ")) {
      mts.push(line.slice(2));
    }
  }

  for (const id of ids) {
    mts.push(`export const ${id}: EncodingFactory;`);
  }

  mts.push(`\nexport const encodings: { [key: string]: EncodingFactory };`);
  mts.push(`export const aliases: string;`);

  const mtsContent = mts.join("\n") + "\n";
  writeFileSync(`dist/${standard}.iconv-tiny.d.mts`, mtsContent);
};

/**
 * @param {!Array<!Encoding>} encodings
 * @returns {string}
 */
const generateAliases = (encodings) => {
  const list = [];
  const used = new Set();
  for (const encoding of encodings) {
    const { name, aliases } = encoding;
    if (aliases) {
      const set = new Set(aliases.split(/\s+/u).filter(Boolean).map(canonicalize));
      // check that none of the aliases are already used
      set.forEach((it) => {
        assert(!used.has(it), `Duplicate alias ${it}: ${name}`);
        used.add(it);
      });
      set.delete(canonicalize(name));
      const arr = Array.from(set).toSorted();
      arr.unshift(name);
      list.push(arr.join(" "));
    } else {
      list.push(name);
    }
  }
  return list.join(",");
};

/**
 * @param {!EncodingsStandard} standard
 * @param {!Array<string>} mjs
 */
const writeBundle = (standard, mjs) => {
  // generate esm bundle
  const mjsContent = "export const\n" + mjs.join(",\n") + ";\n";

  const banner = getBanner();

  if (existsSync("dist/cc.mjs")) {
    // bundle with the Closure Compiled code
    writeFileSync(`dist/${standard}.iconv-tiny.min.mjs`, banner + readFileSync("dist/cc.mjs") + mjsContent);
  }

  /**
   * @param {string} it
   * @returns {boolean}
   */
  const functionFilter = (it) => it.charAt(0) !== it.charAt(0).toUpperCase();

  // bundle with the Source Code to debug and test coverage
  const exports = getExports("src/index.mjs");

  // re-export functions only
  const sc = `import { ${exports.join(", ")} } from "../src/index.mjs";\nexport { ${exports.filter(functionFilter).join(", ")} };\n`;
  writeFileSync(`dist/${standard}.main.mjs`, sc + mjsContent);

  // esbuild
  buildSync({
    entryPoints: [`./dist/${standard}.main.mjs`],
    banner: { js: banner },
    format: "esm",
    bundle: true,
    charset: "utf8",
    outfile: `./dist/${standard}.iconv-tiny.mjs`,
  });
};

/**
 * @type {{[key: string]: !EncodingArgumentFactory}}
 */
const ENCODING_TYPES = {
  SBCS: sbcsEncodingArgumentFactory,
  DBCS: dbcsEncodingArgumentFactory,
};

/**
 *
 * @param {!EncodingsStandard} standard
 * @param {!Array<!EncodingConfig>} encodingConfigs
 */
const generateBundle = async (standard, encodingConfigs) => {
  /**
   * @type {!Array<string>}
   */
  const mjs = [];

  /**
   * @type {!Array<!Encoding>}
   */
  const encodings = [];

  /**
   * @type {!Map<string, !Uint16Array>}
   */
  const dataMap = new Map();

  if (standard === EncodingsStandard.UNICODE) {
    // unicode: there is no ascii table
    // whatwg: ascii is an alias of windows-1252
    const ascii = { name: "US-ASCII", ascii: true, aliases: "iso-ir-6 ANSI_X3.4 ISO_646.irv ASCII ISO646-US us IBM367 cp367 csASCII default 646 ANSI_X3.4 ascii7" };
    mjs.push(`${getIdentifier(ascii.name)}=new SBCS("${ascii.name}","?".repeat(128))`);
    encodings.push(ascii);
  }

  await fetchEncodings(standard, encodingConfigs);

  encodingConfigs.forEach((cfg) => {
    const mappings = loadMappings(standard, cfg.encoding);
    const factory = ENCODING_TYPES[cfg.type];
    processB2C(cfg.encoding, factory, mappings, mjs, dataMap);
    encodings.push(cfg.encoding);
  });

  processUnicode(mjs, encodings);

  /**
   * @type {!Array<string>}
   */
  const ids = [];
  for (const encoding of encodings) {
    const id = getIdentifier(encoding.name);
    ids.push(id);
  }

  generateMTS(standard, ids);

  mjs.push(`encodings={${ids.join(",")}}`);
  mjs.push(`aliases="${generateAliases(encodings)}"`);

  writeBundle(standard, mjs);
};

// main
mkdirSync("dist");
await generateBundle(EncodingsStandard.UNICODE, unicodeConfig.encodings);
await generateBundle(EncodingsStandard.WHATWG, whatwgConfig.encodings);

import { buildSync } from "esbuild";
import { REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";
import { canonicalize } from "../src/iconv-tiny.mjs";
import { existsSync, getBanner, getExports, getIdentifier, mkdirSync, readFileSync, writeFileSync } from "./commons.mjs";
import config from "./config.json" with { type: "json" };

/**
 * @typedef {{
 *   path: string,
 *   name: string,
 *   ascii?: boolean,
 *   ids: !Array<string>,
 * }} EncodingConfig
 */

/**
 * @typedef {{
 *   name: string,
 *   aliases: string,
 *   cfg?: EncodingConfig,
 * }} Encoding
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
 * @param {string} content
 * @returns {!Map<number, number>}
 */
const parseMappings = (content) => {
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
 * @param {!Map<number, number>} mappings
 * @param {string} name
 */
const applyOverrides = (mappings, name) => {
  const filename = `scripts/mappings/${name}.TXT`;
  if (existsSync(filename)) {
    const content = readFileSync(filename);
    const overrides = parseMappings(content);
    for (const [key, value] of overrides) {
      const oldValue = mappings.get(key) ?? null;
      const oldValueStr = oldValue === null ? "<NULL>" : hex(oldValue);
      const newValueStr = value === null ? "<NULL>" : hex(value);
      console.log(`OVERRIDE ${name.padEnd(6, " ")} Key = ${hex(key)}: ${oldValueStr} -> ${newValueStr}`);
      mappings.set(key, value);
    }
  }
};

/**
 * @param {!EncodingConfig} cfg
 * @param {string} row
 * @param {!Array<() => Promise<void>>} tasks
 * @returns {!Encoding}
 */
const fetchEncoding = (cfg, row, tasks) => {
  const i = row.indexOf(" ");
  const id = i < 0 ? row : row.slice(0, i);
  const aliases = i < 0 ? "" : row.slice(i + 1);
  const name = cfg.name.replaceAll("{ID}", id);
  const filename = `temp/${name}.TXT`;
  // fetch the file if it doesn't exist
  if (!existsSync(filename)) {
    const url = `${config.baseUrl}/${cfg.path.replaceAll("{ID}", id)}`;
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
  return { name, aliases, cfg };
};

/**
 * @param {!Array<!EncodingConfig>} encodingConfigs
 * @returns {!Promise<!Array<!Encoding>>}
 */
const fetchEncodings = async (encodingConfigs) => {
  /**
   * @type {!Array<!Encoding>}
   */
  const encodings = [];

  /**
   * @type {!Array<() => Promise<void>>}
   */
  const tasks = [];
  for (const cfg of encodingConfigs) {
    for (const row of cfg.ids) {
      encodings.push(fetchEncoding(cfg, row, tasks));
    }
  }
  await Promise.all(tasks.map((task) => task()));
  return encodings;
};

/**
 * @param {!Uint16Array} b2c
 * @returns {string}
 */
const getBestArgs = (b2c) => {
  const overrides = [];
  let bestBytesInUTF8 = Number.MAX_VALUE;
  let bestArgs = "";
  const encoder = new TextEncoder();
  for (let i = 0; i < 256; i++) {
    const ch = b2c[i];
    if (i !== ch) {
      overrides.push(escape(String.fromCharCode(i)));
      overrides.push(escape(String.fromCharCode(ch)));
    }
    if (overrides.length >= 20) {
      // too many overrides are bad for gzip
      break;
    }
    const overridesStr = overrides.length === 0 ? "" : `,"${overrides.join("")}"`;
    const args = `"${escape(String.fromCharCode(...b2c.subarray(i + 1)))}"${overridesStr}`;
    const bytesInUTF8 = encoder.encode(args).length;
    if (bytesInUTF8 < bestBytesInUTF8) {
      bestBytesInUTF8 = bytesInUTF8;
      bestArgs = args;
    }
  }
  return bestArgs;
};

/**
 * @param {!Array<string>} mjs
 * @param {!Array<Encoding>} encodings
 */
const processSBCS = async (mjs, encodings) => {
  const sbcs = await fetchEncodings(config.encodings.sbcs);
  for (const encoding of sbcs) {
    const { name, cfg } = encoding;
    const filename = `temp/${name}.TXT`;
    const content = readFileSync(filename);
    const mappings = parseMappings(content);
    applyOverrides(mappings, name);
    const b2c = new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);
    if (cfg?.ascii) {
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
    const args = getBestArgs(b2c);
    mjs.push(`${getIdentifier(name)}=new SBCS("${name}",${args})`);
    encodings.push(encoding);
  }

  // add ASCII
  mjs.push(`US_ASCII=new SBCS("US-ASCII","�".repeat(128))`);
  encodings.push({ name: "US-ASCII", aliases: "iso-ir-6 ANSI_X3.4 ISO_646.irv ASCII ISO646-US us IBM367 cp367 csASCII default 646 iso_646.irv ANSI_X3.4 ascii7" });
};

/**
 * @param {!Array<string>} mjs
 * @param {!Array<Encoding>} encodings
 */
const processUnicode = (mjs, encodings) => {
  // add Unicode
  mjs.push(`UTF8=new Unicode(2,2)`);
  mjs.push(`UTF16LE=new Unicode(0,0)`);
  mjs.push(`UTF16BE=new Unicode(0,1)`);
  mjs.push(`UTF32LE=new Unicode(1,0)`);
  mjs.push(`UTF32BE=new Unicode(1,1)`);
  encodings.push({ name: "UTF8", aliases: "unicode-1-1-utf-8" });
  encodings.push({ name: "UTF16LE", aliases: "UTF16" });
  encodings.push({ name: "UTF16BE", aliases: "" });
  encodings.push({ name: "UTF32LE", aliases: "UTF32" });
  encodings.push({ name: "UTF32BE", aliases: "" });
};

/**
 * @param {!Array<string>} ids
 */
const generateMTS = (ids) => {
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
  writeFileSync("dist/iconv-tiny.d.mts", mtsContent);
};

/**
 * @param {!Array<Encoding>} encodings
 * @returns {string}
 */
const generateAliases = (encodings) => {
  const list = [];
  const used = new Set();
  for (const encoding of encodings) {
    const { name, aliases } = encoding;
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
  }
  return list.join(",");
};

/**
 * @param {!Array<string>} mjs
 */
const writeBundle = (mjs) => {
  // generate esm bundle
  const mjsContent = "export const\n" + mjs.join(",\n") + ";\n";

  const banner = getBanner();

  if (existsSync("dist/cc.mjs")) {
    // bundle with the Closure Compiled code
    writeFileSync("dist/iconv-tiny.min.mjs", banner + readFileSync("dist/cc.mjs") + mjsContent);
  }

  // bundle with the Source Code to debug and test coverage
  const exports = getExports("src/index.mjs");
  const sc = `import ${exports} from "../src/index.mjs";\n// import ${exports} from "./cc.mjs";\nexport ${exports};\n`;
  writeFileSync("dist/main.mjs", sc + mjsContent);

  // esbuild
  buildSync({
    entryPoints: ["./dist/main.mjs"],
    banner: { js: banner },
    format: "esm",
    bundle: true,
    charset: "utf8",
    outfile: "./dist/iconv-tiny.mjs",
  });
};

const generateBundle = async () => {
  /**
   * @type {!Array<string>}
   */
  const mjs = [];

  /**
   * @type {!Array<!Encoding>}
   */
  const encodings = [];

  await processSBCS(mjs, encodings);
  // await processDBCS(mjs, encodings);
  processUnicode(mjs, encodings);

  /**
   * @type {!Array<string>}
   */
  const ids = [];
  for (const encoding of encodings) {
    const id = getIdentifier(encoding.name);
    ids.push(id);
  }

  generateMTS(ids);

  mjs.push(`encodings={${ids.join(",")}}`);
  mjs.push(`aliases="${generateAliases(encodings)}"`);

  writeBundle(mjs);
};

// main
mkdirSync("dist");
mkdirSync("temp");
await generateBundle();

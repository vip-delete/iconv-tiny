import { buildSync } from "esbuild";
import { REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";
import { canonicalize } from "../src/iconv-tiny.mjs";
import { existsSync, getBanner, getExports, getIdentifier, mkdirSync, readFileSync, writeFileSync } from "./commons.mjs";
import config from "./config.json" with { type: "json" };

/**
 * @typedef {{
 *   key: number,
 *   value: number,
 *   comment: string,
 * }} Mapping
 */

/**
 * @typedef {{
 *   name: string,
 *   aliases: string,
 * }} Encoding
 */

/**
 * @typedef {{
 *   mjs: !Array<string>,
 *   mts: !Array<string>,
 * }} FileContent
 */

const banner = getBanner();

/**
 * @type {!Array<!Array<string>>}
 */
const STRING_ESCAPE_MAPPINGS = [
  ["\\", "\\\\"],
  ["\x22", "\\\x22"], // QUOTATION MARK
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\v", "\\v"], // 0x0B Vertical Tab
  ["\f", "\\f"], // 0x0C Form Feed
  ["\r", "\\r"],
  ["\xA0", "\\xA0"], // NBSP
  ["\x00", "\\x00"], // NULL
  ["\x7F", "\\x7F"], // DELETE
];

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
 * @param {?number} num
 * @param {number} pad
 * @returns {string}
 */
const hex = (num, pad) => {
  if (num === null) {
    return "<EMPTY>";
  }
  return `0x${num.toString(16).toUpperCase().padStart(pad, "0")}`;
};

/**
 * @param {!Mapping} mapping
 * @returns {string}
 */
const getMappingStr = (mapping) => `${hex(mapping.key, 2)} ${hex(mapping.value, 4)} #${mapping.comment}`;

/**
 * @param {!Array<!Mapping>} mappings
 */
const validate = (mappings) => {
  const keys = new Set();
  const values = new Set();
  mappings.forEach((mapping) => {
    const mappingStr = getMappingStr(mapping);
    const { key, value, comment } = mapping;
    assert(!keys.has(key), `Duplicate key "${hex(key, 2)}": ${mappingStr}`);
    keys.add(key);
    if (value === null) {
      assert(comment.startsWith("UNDEFINED"), `Comment "#${comment}" must be "#UNDEFINED": ${mappingStr}`);
    } else {
      assert(!comment.startsWith("UNDEFINED"), `Comment "#${comment}" must not be "#UNDEFINED": ${mappingStr}`);
      if (values.has(value)) {
        console.warn(`Duplicate value "${hex(value, 4)}": ${mappingStr}`);
      }
      values.add(value);
    }
  });
};

/**
 * @param {string} content
 * @returns {!Array<!Mapping>}
 */
const parseMappings = (content) => {
  const lines = content.split("\n");
  return lines
    .map((line) => {
      const i = line.indexOf("#");
      if (i === 0) {
        return null;
      }
      const beforeHash = i === -1 ? line : line.substring(0, i).trim();
      const comment = i === -1 ? "" : line.substring(i + 1).trim();
      const parts = beforeHash.split(/\s+/u).filter(Boolean).map(Number).filter(Number.isFinite);
      if (parts.length === 0) {
        return null;
      }
      const key = parts[0];
      assert(Number.isInteger(key), `Key "${key}" is not an integer: ${line}`);
      assert(key >= 0 && key <= 0xff, `Key "${key}" is not in range [0...0xFF]: ${line}`);
      const value = parts[1] ?? null;
      if (value !== null) {
        assert(value >= 0 && value <= 0xffff, `Value "${value}" is not in range [0...0xFFFF]: ${line}`);
      }
      return { key, value, comment };
    })
    .filter((it) => it !== null);
};

/**
 * @param {!Array<!Mapping>} mappings
 * @param {string} name
 */
const applyOverrides = (mappings, name) => {
  const filename = `scripts/mappings/${name}.TXT`;
  if (existsSync(filename)) {
    const content = readFileSync(filename);
    const overrides = parseMappings(content);
    validate(overrides);
    mappings.forEach((mapping) => {
      overrides.forEach((override) => {
        if (mapping.key === override.key) {
          console.log(`OVERRIDE: ${name} (${hex(mapping.key, 2)}): (${hex(mapping.value, 4)}, ${mapping.comment}) -> (${hex(override.value, 4)}, ${override.comment})`);
          mapping.value = override.value;
          mapping.comment = override.comment;
        }
      });
    });
  }
};

/**
 * @param {string} name
 * @param {string} content
 * @returns {!Uint16Array}
 */
const createB2C = (name, content) => {
  const mappings = parseMappings(content);
  applyOverrides(mappings, name);
  validate(mappings);
  const b2c = new Uint16Array(256).fill(REPLACEMENT_CHARACTER_CODE);
  for (let i = 0; i < 128; i++) {
    b2c[i] = i;
  }
  mappings.forEach(({ key, value }) => {
    if (value !== null) {
      b2c[key] = value;
    }
  });
  return b2c;
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
 * @returns {!Promise<Array<!Encoding>>}
 */
const fetchEncodings = async () => {
  /**
   * @type {!Array<!Encoding>}
   */
  const encodings = [];

  // fetch all missing files
  const tasks = [];
  for (const cfg of config.encodings.sbcs) {
    for (const row of cfg.ids) {
      const i = row.indexOf(" ");
      const id = i < 0 ? row : row.slice(0, i);
      const aliases = i < 0 ? "" : row.slice(i + 1);
      const name = cfg.name.replaceAll("{ID}", id);
      const filename = `temp/${name}.TXT`;
      encodings.push({ name, aliases });
      // fetch the file if it doesn't exist
      if (!existsSync(filename)) {
        const url = `${config.baseUrl}/${cfg.path.replaceAll("{ID}", id)}`;
        tasks.push(async () => {
          const response = await fetch(url);
          const content = await response.text();
          if (!response.ok) {
            throw new Error(`Fetch from "${url}" failed: ${response.status}\n${content}`);
          }
          writeFileSync(filename, content);
        });
      }
    }
  }
  await Promise.all(tasks);
  return encodings;
};

/**
 * @param {!Array<!Encoding>} encodings
 */
const generateBundle = (encodings) => {
  const mjs = [];

  for (const encoding of encodings) {
    const { name } = encoding;
    const filename = `temp/${name}.TXT`;
    const content = readFileSync(filename);
    const args = getBestArgs(createB2C(name, content));
    mjs.push(`${getIdentifier(name)}=new SBCS("${name}",${args})`);
  }

  // add ASCII
  mjs.push(`US_ASCII=new SBCS("US-ASCII","�".repeat(128))`);
  encodings.push({ name: "US-ASCII", aliases: "iso-ir-6 ANSI_X3.4 ISO_646.irv ASCII ISO646-US us IBM367 cp367 csASCII default 646 iso_646.irv ANSI_X3.4 ascii7" });

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

  const mts = [];
  const lines = readFileSync("src/global.d.ts").split(/\r\n|\n/u);
  for (const line of lines) {
    if (line.length === 0) {
      mts.push(line);
    } else if (line.startsWith("  ")) {
      mts.push(line.slice(2));
    }
  }

  /**
   * @type {!Array<string>}
   */
  const ids = [];
  for (const encoding of encodings) {
    const id = getIdentifier(encoding.name);
    ids.push(id);
    mts.push(`export const ${id}: EncodingFactory;`);
  }

  mjs.push(`encodings={${ids.join(",")}}`);
  mts.push(`\nexport const encodings: { [key: string]: EncodingFactory };`);

  // generate aliases
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
  mjs.push(`aliases="${list.join(",")}"`);
  mts.push(`export const aliases: string;`);

  // generate esm bundle
  const mjsContent = "export const\n" + mjs.join(",\n") + ";\n";
  const mtsContent = mts.join("\n") + "\n";
  writeFileSync("dist/iconv-tiny.d.mts", mtsContent);

  if (existsSync("dist/cc.mjs")) {
    // bundle with the Closure Compiled code
    writeFileSync("dist/iconv-tiny.min.mjs", banner + readFileSync("dist/cc.mjs") + mjsContent);
  }

  // bundle with the Source Code to debug and test coverage
  const exports = getExports("src/index.mjs");
  const sc = `import ${exports} from "../src/index.mjs";\n//import ${exports} from "./cc.mjs";\nexport ${exports};\n`;
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

// main
mkdirSync("dist");
mkdirSync("temp");
generateBundle(await fetchEncodings());

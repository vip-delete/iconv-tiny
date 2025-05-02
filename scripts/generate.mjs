import { REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";
import { canonicalize } from "../src/iconv-tiny.mjs";
import { existsSync, getHeader, getIdentifier, mkdirSync, readFileSync, writeFileSync } from "./commons.mjs";

const HEADER = getHeader();

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

// main
{
  /**
   * @type {!Array<!Encoding>}
   */
  const encodings = await fetchEncodings();
  generateEncodings(encodings);
  generateAliases(encodings);
  generateBundle();
}

/**
 * @returns {!Promise<Array<!Encoding>>}
 */
async function fetchEncodings() {
  mkdirSync("temp");

  /**
   * @type {import("./commons.mjs").Config}
   */
  const config = JSON.parse(readFileSync("scripts/config.json"));

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
}

/**
 * @param {!Array<!Encoding>} encodings
 */
function generateEncodings(encodings) {
  const mjsContent = [];

  for (const encoding of encodings) {
    const { name } = encoding;
    const filename = `temp/${name}.TXT`;
    const content = readFileSync(filename);
    const args = getBestArgs(createB2C(name, content));
    mjsContent.push(`export const ${getIdentifier(name)} = new SBCS("${name}",${args});\n`);
  }

  // add ASCII
  mjsContent.push(`export const US_ASCII = new SBCS("US-ASCII","�".repeat(128));\n`);
  encodings.push({ name: "US-ASCII", aliases: "iso-ir-6 ANSI_X3.4 ISO_646.irv ASCII ISO646-US us IBM367 cp367 csASCII default 646 iso_646.irv ANSI_X3.4 ascii7" });

  // add Unicode
  mjsContent.push(`export const UTF8 = new Unicode(2,2);\n`);
  mjsContent.push(`export const UTF16LE = new Unicode(0,0);\n`);
  mjsContent.push(`export const UTF16BE = new Unicode(0,1);\n`);
  mjsContent.push(`export const UTF32LE = new Unicode(1,0);\n`);
  mjsContent.push(`export const UTF32BE = new Unicode(1,1);\n`);
  encodings.push({ name: "UTF8", aliases: "unicode-1-1-utf-8" });
  encodings.push({ name: "UTF16LE", aliases: "UTF16" });
  encodings.push({ name: "UTF16BE", aliases: "" });
  encodings.push({ name: "UTF32LE", aliases: "UTF32" });
  encodings.push({ name: "UTF32BE", aliases: "" });

  const mtsContent = [];
  for (const encoding of encodings) {
    mtsContent.push(`export const ${getIdentifier(encoding.name)}: EncodingFactory;\n`);
  }

  writeFileSync(`dist/iconv-tiny.encodings.mjs`, HEADER + `import { SBCS, Unicode } from "iconv-tiny";\n` + mjsContent.join(""));
  writeFileSync(`dist/iconv-tiny.encodings.d.mts`, HEADER + `import { EncodingFactory } from "iconv-tiny";\n` + mtsContent.join(""));
}

/**
 * @param {!Array<!Encoding>} encodings
 */
function generateAliases(encodings) {
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

  const mjsContent = `export const aliases = "${list.join(",")}";\n`;
  const mtsContent = `export const aliases: string;\n`;

  writeFileSync(`dist/iconv-tiny.aliases.mjs`, HEADER + mjsContent);
  writeFileSync(`dist/iconv-tiny.aliases.d.mts`, HEADER + mtsContent);
}

function generateBundle() {
  const result = [];
  result.push(read("dist/iconv-tiny.runtime.mjs") + "\n");
  result.push(read("dist/iconv-tiny.encodings.mjs") + "\n");
  result.push(read("dist/iconv-tiny.aliases.mjs") + "\n");
  writeFileSync("dist/iconv-tiny.bundle.mjs", HEADER + "// @ts-nocheck\n" + result.join(""));

  /**
   * @param {string} filename
   * @returns {string}
   */
  function read(filename) {
    let content = readFileSync(filename);
    if (content.startsWith(HEADER)) {
      content = content.slice(HEADER.length);
      while (content.startsWith("import ")) {
        content = content.substring(content.indexOf("\n") + 1);
      }
    }
    return content.trim();
  }
}

/**
 * @param {string} content
 * @returns {!Array<!Mapping>}
 */
function parseMappings(content) {
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
}

/**
 * @param {!Array<!Mapping>} mappings
 * @param {string} name
 */
function applyOverrides(mappings, name) {
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
}

/**
 * @param {!Array<!Mapping>} mappings
 */
function validate(mappings) {
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
}

// Utils

/**
 * @param {!Mapping} mapping
 * @returns {string}
 */
function getMappingStr(mapping) {
  return `${hex(mapping.key, 2)} ${hex(mapping.value, 4)} #${mapping.comment}`;
}

/**
 * @param {?number} num
 * @param {number} pad
 * @returns {string}
 */
function hex(num, pad) {
  if (num === null) {
    return "<EMPTY>";
  }
  return `0x${num.toString(16).toUpperCase().padStart(pad, "0")}`;
}

/**
 * @param {boolean} condition
 * @param {string} [msg]
 * @returns {undefined}
 */
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}

/**
 * @param {string} str
 * @returns {string}
 */
function escape(str) {
  for (let i = 0; i < STRING_ESCAPE_MAPPINGS.length; i++) {
    const row = STRING_ESCAPE_MAPPINGS[i];
    str = str.replaceAll(row[0], row[1]);
  }
  return str;
}

/**
 * @param {string} name
 * @param {string} content
 * @returns {!Uint16Array}
 */
function createB2C(name, content) {
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
}

/**
 * @param {!Uint16Array} b2c
 * @returns {string}
 */
function getBestArgs(b2c) {
  const overrides = [];
  let bestBytesInUTF8 = Number.MAX_VALUE;
  let bestArgs = "";
  const encoder = new TextEncoder();
  for (let i = 0; i < 256; i++) {
    const c = b2c[i];
    if (i !== c) {
      overrides.push(escape(String.fromCharCode(i)));
      overrides.push(escape(String.fromCharCode(c)));
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
}

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

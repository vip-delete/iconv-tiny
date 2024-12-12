import { DEFAULT_CHAR_UNICODE } from "../src/commons.mjs";
import { canonicalize } from "../src/iconv-tiny.mjs";
import { existsSync, getHeader, getIdentifier, readFileSync, writeFileSync } from "./commons.mjs";

const HEADER = getHeader();

/**
 * @param {import("./commons.mjs").Config} config
 */
export async function generateSBE(config) {
  const names = await generateEncodings(config);
  createEncodingFiles("US-ASCII", `"${String.fromCharCode(DEFAULT_CHAR_UNICODE)}".repeat(128)`);
  names.unshift("US-ASCII");
  generateIndex(names);
  generateExports(names);
  generateAliases(config);
}

/**
 * @param {import("./commons.mjs").Config} config
 * @returns {!Promise<string[]>}
 */
function generateEncodings(config) {
  const tasks = [];
  for (const cfg of config.encodings.sbcs) {
    for (const id of Object.keys(cfg.ids)) {
      tasks.push(
        (async () => {
          const { name, content } = await getEncodingData(config, cfg, id);
          generateEncoding(name, content);
          return name;
        })(),
      );
    }
  }
  return Promise.all(tasks);
}

/**
 * @param {!Array<string>} names
 */
function generateIndex(names) {
  const mjsContent = names.map((name) => `export * from "./${name}.mjs";\n`).join("");
  writeFileSync("dist/encodings/index.mjs", HEADER + mjsContent);
  writeFileSync("src/encodings/index.mjs", HEADER + mjsContent);
  const mtsHeader = `import { SBEF } from "iconv-tiny/sbe";\n`;
  const mtsBody = names.map((name) => `export const ${getIdentifier(name)}: SBEF;\n`).join("");
  const mtsContent = mtsHeader + mtsBody;
  writeFileSync("dist/encodings/index.d.mts", HEADER + mtsContent);
}

/**
 * @param {!Array<string>} names
 */
function generateExports(names) {
  const json = JSON.parse(readFileSync("package.json"));
  const exports = {
    ".": {
      "types": "./types/iconv-tiny.d.mts",
      "import": "./dist/iconv-tiny.mjs",
    },
    "./sbe": {
      "types": "./types/sbe.d.mts",
      "import": "./dist/sbe.mjs",
    },
    "./aliases": {
      "types": "./types/aliases.d.mts",
      "import": "./dist/aliases.mjs",
    },
    "./encodings": "./dist/encodings/index.mjs",
  };
  for (const name of names) {
    // @ts-ignore
    exports[`./encodings/${name}`] = `./dist/encodings/${name}.mjs`;
  }
  json.exports = exports;
  writeFileSync("package.json", JSON.stringify(json, null, 2) + "\n");
}

/**
 * @param {import("./commons.mjs").Config} config
 */
function generateAliases(config) {
  const list = [];
  const used = new Set();
  list.push(formatAliases("US-ASCII", "iso-ir-6 ANSI_X3.4 ISO_646.irv ASCII ISO646-US us IBM367 cp367 csASCII default 646 iso_646.irv ANSI_X3.4 ascii7", used));
  for (const cfg of config.encodings.sbcs) {
    for (const id of Object.keys(cfg.ids)) {
      const name = cfg.name.replaceAll("{ID}", id);
      list.push(formatAliases(name, cfg.ids[id], used));
    }
  }
  const mjsContent = `export const aliases = "${list.join(",")}";\n`;
  writeFileSync(`dist/aliases.mjs`, HEADER + mjsContent);
}

/**
 * @param {string} name
 * @param {string} aliases
 * @param {Set<string>} used
 * @returns {string}
 */
function formatAliases(name, aliases, used) {
  const set = new Set(aliases.split(/\s+/u).filter(Boolean).map(canonicalize));
  // check that none of the aliases are already used
  set.forEach((it) => {
    assert(!used.has(it), `Duplicate alias ${it}: ${name}`);
    used.add(it);
  });
  set.delete(canonicalize(name));
  const arr = Array.from(set).toSorted();
  arr.unshift(name);
  return arr.join(" ");
}

// Other

/**
 * @param {import("./commons.mjs").Config} config
 * @param {import("./commons.mjs").Encoding} cfg
 * @param {string} id
 * @returns {!Promise<{name:string, content:string}>}
 */
async function getEncodingData(config, cfg, id) {
  const name = cfg.name.replaceAll("{ID}", id);
  const filename = `temp/${name}.TXT`;
  if (existsSync(filename)) {
    return { name, content: readFileSync(filename) };
  }
  const url = `${config.baseUrl}/${cfg.path.replaceAll("{ID}", id)}`;
  const response = await fetch(url);
  const content = await response.text();
  if (!response.ok) {
    throw new Error(`Fetch from "${url}" failed: ${response.status}\n${content}`);
  }
  writeFileSync(filename, content);
  return { name, content };
}

/**
 * @param {string} name
 * @param {string} content
 */
function generateEncoding(name, content) {
  const mappings = parseMappings(content);
  applyOverrides(mappings, name);
  validate(mappings);
  const b2c = new Uint16Array(256).fill(DEFAULT_CHAR_UNICODE);
  for (let i = 0; i < 128; i++) {
    b2c[i] = i;
  }
  mappings.forEach(({ key, value }) => {
    if (value !== null) {
      b2c[key] = value;
    }
  });
  createEncodingFiles(name, getBestArgs(b2c));
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
          console.log(
            `OVERRIDE: ${name} (${hex(mapping.key, 2)}): (${hex(mapping.value, 4)}, ${mapping.comment}) -> (${hex(override.value, 4)}, ${override.comment})`,
          );
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

/**
 * @param {string} name
 * @param {string} args
 */
function createEncodingFiles(name, args) {
  const mjsContent = `import { SBEF } from "../sbe.mjs";\nexport const ${getIdentifier(name)} = new SBEF("${name}",${args});\n`;
  const mtsContent = `import { SBEF } from "iconv-tiny/sbe";\nexport const ${getIdentifier(name)}: SBEF;\n`;
  writeFileSync(`src/encodings/${name}.mjs`, HEADER + mjsContent);
  writeFileSync(`dist/encodings/${name}.mjs`, HEADER + mjsContent);
  writeFileSync(`dist/encodings/${name}.d.mts`, HEADER + mtsContent);
}

// Utils

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

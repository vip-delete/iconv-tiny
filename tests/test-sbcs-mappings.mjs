import { encodings } from "iconv-tiny";
import { expect, test } from "vitest";
import { loadMappings } from "../scripts/generate.mjs";
import { DEFAULT_CHAR_BYTE, REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";

const unicode = ["UTF8", "UTF16LE", "UTF16BE", "UTF32LE", "UTF32BE"];
const dbcs = ["SHIFT_JIS", "CP932"];
const ascii = ["NEXTSTEP", "JIS_0201"];

const loadAsciiMappings = () => {
  const mappings = new Map();
  for (let i = 0; i < 128; i++) {
    mappings.set(i, i);
  }
  return mappings;
};

// SBCS Table Mapping Test
for (const [key, value] of Object.entries(encodings)) {
  if (!unicode.includes(key) && !dbcs.includes(key)) {
    const encoding = value.create();
    const name = encoding.getName();
    const b2c = key === "US_ASCII" ? loadAsciiMappings() : loadMappings({ name });

    if (ascii.includes(key)) {
      // some mapping tables skipped ascii mappings
      for (let i = 0; i < 128; i++) {
        if (!b2c.has(i)) {
          b2c.set(i, i);
        }
      }
    }

    const c2b = new Map();
    for (const [k1, v1] of b2c) {
      c2b.set(v1, k1);
    }

    test(`TableMapping ${name} (decode)`, () => {
      for (let i = 0; i < 256; i++) {
        const j = i;
        let mapped = true;
        const ch = encoding.decode(new Uint8Array([j]), {
          defaultCharUnicode: (input, index) => {
            expect(input).toBe(j);
            expect(index).toBe(0);
            mapped = false;
            return null;
          },
        });
        expect(ch.length).toBe(1);
        const actual = ch.charCodeAt(0);
        const expected = b2c.get(j);
        if (typeof expected === "number") {
          if (actual !== expected) {
            console.error(`${name}: ${actual} (${ch}) !== ${expected} (${String.fromCharCode(expected)})`);
            expect(actual).toBe(expected);
          }
        } else {
          expect(mapped).toBe(false);
          expect(actual).toBe(REPLACEMENT_CHARACTER_CODE);
        }
      }
    });

    test(`TableMapping ${name} (encode)`, () => {
      for (let i = 0; i < 65536; i++) {
        const j = i;
        let mapped = true;
        const buf = encoding.encode(String.fromCharCode(j), {
          defaultCharByte: () => {
            mapped = false;
            return null;
          },
        });
        expect(buf.length).toBe(1);
        const actual = buf[0];
        const expected = c2b.get(j);
        if (typeof expected === "number") {
          if (actual !== expected) {
            console.error(`${name}: ${actual} (${String.fromCharCode(actual)}) !== ${expected} (${String.fromCharCode(expected)})`);
            expect(actual).toBe(expected);
          }
        } else {
          if (mapped) {
            expect(mapped).toBe(false);
          }
          if (actual !== DEFAULT_CHAR_BYTE) {
            expect(actual).toBe(DEFAULT_CHAR_BYTE);
          }
        }
      }
    });
  }
}

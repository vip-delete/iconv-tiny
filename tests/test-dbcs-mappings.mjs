import { encodings } from "iconv-tiny";
import { expect, test } from "vitest";
import { loadMappings } from "../scripts/generate.mjs";
import { DEFAULT_CHAR_BYTE, REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";

const dbcs = ["SHIFT_JIS", "CP932"];
// const dbcs = ["CP932"];
const ascii = ["SHIFT_JIS", "CP932"];

// DBCS Table Mapping Test
for (const [key, value] of Object.entries(encodings)) {
  if (dbcs.includes(key)) {
    const encoding = value.create();
    const name = encoding.getName();
    const b2c = loadMappings({ name });

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
      for (let i = 0; i < 65536; i++) {
        const j = i;
        const inputBuffer = j < 256 ? new Uint8Array([j]) : new Uint8Array([j >> 8, j & 0xff]);
        let mapped = true;
        const ch = encoding.decode(inputBuffer, {
          defaultCharUnicode: () => {
            mapped = false;
            return null;
          },
        });

        const actual = ch.length === 1 ? ch.charCodeAt(0) : REPLACEMENT_CHARACTER_CODE;
        if (ch.length !== 1) {
          // unmapped
          mapped = false;
        }
        const expected = b2c.get(j);
        if (typeof expected === "number") {
          if (actual !== expected) {
            console.error(`${name} i = ${j}: ${actual} (${ch}) !== ${expected} (${String.fromCharCode(expected)})`);
            expect(actual).toBe(expected);
          }
        } else {
          if (mapped) {
            expect(mapped).toBe(false);
          }
          if (actual !== REPLACEMENT_CHARACTER_CODE) {
            expect(actual).toBe(REPLACEMENT_CHARACTER_CODE);
          }
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

        const actual = buf.length === 1 ? buf[0] : (buf[0] << 8) | buf[1];
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

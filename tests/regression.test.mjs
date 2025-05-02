import iconvLite from "iconv-lite";
import { IconvTiny } from "iconv-tiny";
import * as encodings from "iconv-tiny/encodings";
import { assert, expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE } from "../src/commons.mjs";
import { ALL_SYMBOLS } from "./common.mjs";

regressionTest(Object.keys(encodings), new IconvTiny(encodings));

/**
 * @param {!Array<string>} encodingsList
 * @param {IconvTiny} iconvTiny
 */
export function regressionTest(encodingsList, iconvTiny) {
  const buffer = new Uint8Array(256);
  for (let i = 0; i < 255; i++) {
    buffer[i] = i;
  }

  /**
   * @type {string[]}
   */
  const missing = encodingsList.filter((it) => !iconvLite.encodingExists(it));
  console.warn(`Missing encodings in iconv-lite: ${missing}`);

  const supported = encodingsList.filter(iconvLite.encodingExists);
  const sbcs = supported.filter((it) => !it.startsWith("UTF"));
  for (const name of sbcs) {
    test(`Regression ${name} (decode)`, () => {
      const expected = iconvLite.decode(Buffer.from(buffer), name);
      const actual = iconvTiny.decode(buffer, name);
      expect(actual).toBe(expected);
    });

    test(`Regression ${name} (encode)`, () => {
      const expectedArr = new Uint8Array(iconvLite.encode(ALL_SYMBOLS, name));
      const actualArr = iconvTiny.encode(ALL_SYMBOLS, name);
      expect(actualArr.length).toBe(expectedArr.length);
      for (let i = 0; i < expectedArr.length; i++) {
        const expected = expectedArr[i];
        const actual = actualArr[i];
        if (expected !== actual) {
          if (ALL_SYMBOLS.charAt(i) === "�") {
            // iconv-lite maps "�" to the latest unmapped code, different for different encodings. Bug?
            // iconv-tiny maps "�" to the default char byte, because it always "unmapped".
            if (actual !== DEFAULT_CHAR_BYTE) {
              throw new Error(`${name}: codepoint ${i}, expected default char byte, actual ${actual}`);
            }
          } else {
            throw new Error(`${name}: codepoint ${i}, expected ${expected}, actual ${actual}`);
          }
        }
      }
    });
  }

  // Unicode regression
  for (const name of ["UTF8", "UTF16LE", "UTF16BE", "UTF32LE", "UTF32BE"]) {
    test(`Regression ${name} (encode)`, () => {
      // addBOM: false (default)
      const expectedArr = new Uint8Array(iconvLite.encode(ALL_SYMBOLS, name));
      const actualArr = iconvTiny.encode(ALL_SYMBOLS, name);
      expect(actualArr.length).toBe(expectedArr.length);
      for (let i = 0; i < expectedArr.length; i++) {
        const expected = expectedArr[i];
        const actual = actualArr[i];
        if (actual !== expected) {
          assert.strictEqual(actual, expected, `${name}: encode mismatch at position '${i}'`);
        }
      }

      // addBOM: true
      const expectedArrBom = new Uint8Array(iconvLite.encode(ALL_SYMBOLS, name, { addBOM: true }));
      const actualArrBom = iconvTiny.encode(ALL_SYMBOLS, name, { addBOM: true });
      expect(actualArrBom.length).toBe(expectedArrBom.length);
      for (let i = 0; i < expectedArrBom.length; i++) {
        const expected = expectedArr[i];
        const actual = actualArr[i];
        if (actual !== expected) {
          assert.strictEqual(actual, expected, `${name}: encode mismatch at position '${i}'`);
        }
      }

      // // no BOM
      const expectedStr = iconvLite.decode(Buffer.from(expectedArr), name);
      const actualStr = iconvTiny.decode(actualArr, name);
      compareStr(name, expectedStr, ALL_SYMBOLS);
      compareStr(name, actualStr, ALL_SYMBOLS);

      // // stripBOM: true (default)
      const expectedStr2 = iconvLite.decode(Buffer.from(expectedArrBom), name);
      const actualStr2 = iconvTiny.decode(actualArrBom, name);
      compareStr(name, expectedStr2, ALL_SYMBOLS);
      compareStr(name, actualStr2, ALL_SYMBOLS);

      // stripBOM: false
      const expectedStrBOM = iconvLite.decode(Buffer.from(expectedArrBom), name, { stripBOM: false });
      const actualStrBOM = iconvTiny.decode(actualArrBom, name, { stripBOM: false });
      compareStr(name, expectedStrBOM, "\ufeff" + ALL_SYMBOLS);
      compareStr(name, actualStrBOM, "\ufeff" + ALL_SYMBOLS);
    });
  }

  // UTF-8 incomplete decode
  {
    const dec = iconvTiny.getEncoding("UTF-8").newDecoder();
    expect(dec.decode(new Uint8Array([0xd0]))).toBe("");
    expect(dec.decode()).toBe("�"); // incomplete
    const dec1 = iconvLite.getDecoder("UTF-8");
    expect(dec1.write(Buffer.from(new Uint8Array([0xd0])))).toBe("");
    expect(dec1.end()).toBe("�"); // incomplete
  }
}

/**
 * @param {string} name
 * @param {string} actualStr
 * @param {string} expectedStr
 */
function compareStr(name, actualStr, expectedStr) {
  assert.strictEqual(actualStr.length, expectedStr.length, `${name}: string length mismatch`);
  expect(actualStr.length).toBe(expectedStr.length);
  for (let i = 0; i < expectedStr.length; i++) {
    const expected = expectedStr.codePointAt(i) ?? 0;
    const actual = actualStr.codePointAt(i) ?? 0;
    if (expected !== actual) {
      assert.strictEqual(actual, expected, `${name}: codePoint mismatch at position '${i}'`);
    }
    if (expected > 0xffff) {
      i++;
    }
  }
}

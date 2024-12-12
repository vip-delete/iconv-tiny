import iconvLite from "iconv-lite";
import { IconvTiny } from "iconv-tiny";
import * as encodings from "iconv-tiny/encodings";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE } from "../src/commons.mjs";

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
  const array = new Uint16Array(65536);
  for (let i = 0; i < 65536; i++) {
    array[i] = i;
  }
  const codepoints = String.fromCharCode.apply(null, Array.from(array));

  /**
   * @type {string[]}
   */
  const missing = encodingsList.filter((it) => !iconvLite.encodingExists(it));
  console.warn(`Missing encodings in iconv-lite: ${missing}`);

  const supported = encodingsList.filter(iconvLite.encodingExists);
  for (const name of supported) {
    test(`Regression ${name} (decode)`, () => {
      // eslint-disable-next-line no-undef
      const expected = iconvLite.decode(Buffer.from(buffer), name);
      // strict=false is OK if mapping result doesn't have invalid surrogate pairs
      const actual = iconvTiny.decode(buffer, name);
      expect(actual).toBe(expected);
    });

    test(`Regression ${name} (encode)`, () => {
      const expectedArr = new Uint8Array(iconvLite.encode(codepoints, name));
      const actualArr = iconvTiny.encode(codepoints, name);
      for (let i = 0; i < 65536; i++) {
        const expected = expectedArr[i];
        const actual = actualArr[i];
        if (expected !== actual) {
          if (i === "�".charCodeAt(0)) {
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
}

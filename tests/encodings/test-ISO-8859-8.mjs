import iconvLite from "iconv-lite";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, DEFAULT_CHAR_UNICODE } from "../../src/commons.mjs";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testISO88598(CP) {
  test("ISO-8859-8", () => {
    const cp = CP.create();
    // new TextDecoder("ISO-8859-8").decode(new Uint8Array([0xA1]));
    // TextDecoder correctly maps unmapped byte 0xA1 to �
    expect(cp.decode(new Uint8Array([0xa1]))).toBe(String.fromCharCode(DEFAULT_CHAR_UNICODE));
    expect(cp.encode(String.fromCharCode(0xa1))[0]).toBe(DEFAULT_CHAR_BYTE);

    // new TextDecoder("ISO-8859-8") is not used if defaultCharUnicode is set
    const cp1 = CP.create({ defaultCharUnicode: "❓" });
    expect(cp1.decode(new Uint8Array([0xa1]))).toBe("❓");
  });

  test("ISO-8859-8: iconv-lite comparison", () => {
    const array = new Uint16Array(0xffff);
    for (let i = 0; i < array.length; i++) {
      array[i] = i;
    }
    const codepoints = String.fromCharCode.apply(null, Array.from(array));
    const cp = CP.create();
    const encodeExpected = new Uint8Array(iconvLite.encode(codepoints, "ISO-8859-8"));
    const encodeActual = cp.encode(codepoints);
    for (let i = 0; i < array.length; i++) {
      const expected = encodeExpected[i];
      const actual = encodeActual[i];
      if (i === "�".charCodeAt(0)) {
        // iconv-lite maps to the latest unmapped symbol (bug?)
        expect(expected).toBe(255);
        expect(actual).toBe("?".charCodeAt(0));
      } else {
        expect(expected).toBe(actual);
      }
    }
  });
}

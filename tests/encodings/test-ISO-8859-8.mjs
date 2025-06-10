import iconvLite from "iconv-lite";
import { ISO_8859_8 } from "iconv-tiny";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, REPLACEMENT_CHARACTER_CODE } from "../../src/commons.mjs";

test("ISO-8859-8", () => {
  const cp = ISO_8859_8.create();
  // new TextDecoder("ISO-8859-8").decode(new Uint8Array([0xA1]));
  // TextDecoder correctly maps unmapped byte 0xA1 to �
  expect(cp.decode(new Uint8Array([0xa1]))).toBe(String.fromCharCode(REPLACEMENT_CHARACTER_CODE));
  expect(cp.encode(String.fromCharCode(0xa1))[0]).toBe(DEFAULT_CHAR_BYTE);
  expect(cp.encode("\u05EA")[0]).toBe(250);
  expect(cp.encode("\u05EB")[0]).toBe(DEFAULT_CHAR_BYTE);
  expect(cp.encode("\u05FF")[0]).toBe(DEFAULT_CHAR_BYTE);
  expect(cp.encode("\u0600")[0]).toBe(DEFAULT_CHAR_BYTE);

  // new TextDecoder("ISO-8859-8") is not used if defaultCharUnicode is set
  expect(cp.decode(new Uint8Array([0xa1]), { defaultCharUnicode: "❓" })).toBe("❓");
});

test("ISO-8859-8: iconv-lite comparison", () => {
  const array = new Uint16Array(0xffff);
  for (let i = 0; i < array.length; i++) {
    array[i] = i;
  }
  const str = String.fromCharCode.apply(null, Array.from(array));
  const cp = ISO_8859_8.create();
  const encodeExpected = new Uint8Array(iconvLite.encode(str, "ISO-8859-8"));
  const encodeActual = cp.encode(str);
  expect(encodeExpected.length).toBe(array.length);
  expect(encodeActual.length).toBe(array.length);
  for (let i = 0; i < array.length; i++) {
    const expected = encodeExpected[i];
    const actual = encodeActual[i];
    if (i === "�".charCodeAt(0)) {
      // iconv-lite maps to the latest unmapped symbol (bug?)
      expect(expected).toBe(255);
      expect(actual).toBe("?".charCodeAt(0));
    } else {
      expect(actual).toBe(expected);
    }
  }
});

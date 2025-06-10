import iconvLite from "iconv-lite";
import { US_ASCII as CP } from "iconv-tiny";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, REPLACEMENT_CHARACTER_CODE } from "../../src/commons.mjs";

test("US-ASCII", () => {
  const cp = CP.create();
  // iconv-lite maps "�" to the latest unmapped code (to 255)
  // but "�" has no mapping at all and should be mapped to the default char
  expect(cp.encode("�")[0]).toBe(DEFAULT_CHAR_BYTE);
  expect(cp.encode("").length).toBe(0);
  expect(cp.newEncoder().encode().length).toBe(0);
  expect(cp.newDecoder().decode()).toBe("");

  const str = String.fromCharCode(REPLACEMENT_CHARACTER_CODE);
  const buf = new Uint8Array([65, 66, 67, 229]);
  // US-ASCII range 0x80-0xFF is unmapped
  expect(cp.decode(buf)).toBe(`ABC${str}`);
  // but TextDecoder maps US-ASCII "as-is" like LATIN1 aka ISO-8859-1
  expect(new TextDecoder("US-ASCII").decode(buf)).toBe(`ABCå`);
  // however iconv-lite also maps a 0x80-0xFF to "�"
  expect(iconvLite.decode(Buffer.from(buf), "US-ASCII")).toBe(`ABC${str}`);
});

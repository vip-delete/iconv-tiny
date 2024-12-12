import iconvLite from "iconv-lite";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, DEFAULT_CHAR_UNICODE } from "../../src/commons.mjs";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testUSASCII(CP) {
  test("US-ASCII", () => {
    const cp = CP.create();
    // iconv-lite maps "�" to the latest unmapped code (to 255)
    // but "�" has no mapping at all and should be mapped to the default char
    expect(cp.encode("�")[0]).toBe(DEFAULT_CHAR_BYTE);

    const c = String.fromCharCode(DEFAULT_CHAR_UNICODE);
    const buf = new Uint8Array([65, 66, 67, 229]);
    // US-ASCII range 0x80-0xFF is unmapped
    expect(cp.decode(buf)).toBe(`ABC${c}`);
    // but TextDecoder maps US-ASCII "as-is" like LATIN1 aka ISO-8859-1
    expect(new TextDecoder("US-ASCII").decode(buf)).toBe(`ABCå`);
    // however iconv-lite also maps a 0x80-0xFF to "�"
    // eslint-disable-next-line no-undef
    expect(iconvLite.decode(Buffer.from(buf), "US-ASCII")).toBe(`ABC${c}`);
  });
}

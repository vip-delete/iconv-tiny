import { expect, test } from "vitest";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testCP1255(CP) {
  test("CP1255", () => {
    const cp = CP.create();
    expect(cp.decode(new Uint8Array([0xca])).charCodeAt(0)).toBe(0x05ba);
  });
}

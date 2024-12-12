import { expect, test } from "vitest";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testCP864(CP) {
  test("CP846", () => {
    const cp1 = CP.create();
    const cp2 = CP.create({ overrides: [0x25, 0x25] });
    const cp3 = CP.create({ overrides: [0x25, "€"] });
    expect(cp1.decode(new Uint8Array([0x25]))).toBe("٪"); // ARABIC PERCENT SIGN
    expect(cp2.decode(new Uint8Array([0x25]))).toBe("%"); // PERCENT SIGN
    expect(cp3.decode(new Uint8Array([0x25]))).toBe("€"); // EURO SIGN
  });
}

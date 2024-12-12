import { expect, test } from "vitest";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testCP875(CP) {
  test("CP875", () => {
    const cp1 = CP.create();
    expect(cp1.decode(new Uint8Array([0xe1, 0xfc, 0xec]))).toBe("₯€ͺ");

    const cp2 = CP.create({ nativeDecode: true });
    expect(cp2.decode(new Uint8Array([0xfd]))).toBe("�");
  });
}

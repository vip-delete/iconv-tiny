import { expect, test } from "vitest";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testCP437(CP) {
  test("CP437", () => {
    const cp = CP.create();
    expect(cp.decode(new Uint8Array([0, 1, 2]))).toBe("\x00\x01\x02");
  });

  test("CP437 graphic mode", () => {
    const cp2 = CP.create({ graphicMode: true });
    expect(cp2.decode(new Uint8Array([0, 1, 2, 3, 4]))).toBe(" ☺☻♥♦");
  });
}

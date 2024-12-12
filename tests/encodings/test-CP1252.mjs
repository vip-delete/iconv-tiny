import { expect, test } from "vitest";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testCP1252(CP) {
  test("CP1252", () => {
    const cp = CP.create();
    expect(cp.decode(new Uint8Array([".".charCodeAt(0), 32, 32, 32, 32, 32, 32, 32, 32, 32, 32])).trimEnd()).toBe(".");
    expect(cp.decode(new Uint8Array([72, 69, 76, 76, 79, 32, 32, 32, 65, 32, 32])).trimEnd()).toBe("HELLO   A");
    expect(cp.decode(new Uint8Array([72, 69, 76, 76, 79, 32, 32, 32, 65, 83, 77]))).toBe("HELLO   ASM");
    expect(cp.decode(new Uint8Array([224, 225, 226, 227, 228, 229, 184, 230, 231, 232, 233]))).toBe("àáâãäå¸æçèé");
    expect(cp.decode(new Uint8Array([1, 127]))).toBe("\u0001\u007f");
    expect(cp.decode(cp.encode("Превед Medved!"))).toBe("?????? Medved!");
    expect(cp.encode("HELLO   ASM")).toStrictEqual(new Uint8Array([72, 69, 76, 76, 79, 32, 32, 32, 65, 83, 77]));
  });

  test("CP1252 overrides", () => {
    const cp = CP.create({ overrides: [0x81, "❓"] });
    const buf = new Uint8Array([0x80, 0x81]);
    expect(cp.decode(buf)).toBe("€❓");
    expect(cp.encode("€❓")).toStrictEqual(buf);
  });

  test("CP1252 overrides", () => {
    const buf = new Uint8Array([0x41, 0x42, 0x81, 0x8d, 0x8f, 0x90, 0x9d]);

    const cp = CP.create({ defaultCharUnicode: "❓" });
    expect(cp.decode(buf)).toBe("AB❓❓❓❓❓");

    // default character as be a function.
    const indexes = /** @type {Array<number>} */ ([]);
    const cp1 = CP.create({
      defaultCharUnicode: (input, index) => {
        indexes.push(index);
        return null;
      },
    });
    expect(cp1.decode(buf)).toBe("AB�����");
    expect(indexes).toStrictEqual([2, 3, 4, 5, 6]);
  });
}

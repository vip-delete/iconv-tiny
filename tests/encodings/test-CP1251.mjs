import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, DEFAULT_CHAR_UNICODE } from "../../src/commons.mjs";

/**
 * @param {import("../common.mjs").SBEF} CP
 */
export function testCP1251(CP) {
  test("CP1251", () => {
    const cp = CP.create({ nativeDecode: true });
    expect(cp.encode("\u0098")[0]).toBe(DEFAULT_CHAR_BYTE);
    // TextDecoder maps UNDEFINED bytes in CP1251 to Unicode "as-is": 0x98 maps to \u0098
    expect(cp.decode(new Uint8Array([0x98]))).toBe("\u0098");

    const cp1 = CP.create({ nativeDecode: true, defaultCharUnicode: "❓" });
    expect(cp1.decode(new Uint8Array([0x98]))).toBe("❓");

    const cp2 = CP.create({ nativeDecode: true, graphicMode: true });
    expect(cp2.decode(new Uint8Array([1]))).toBe("☺");

    const cp3 = CP.create({ nativeDecode: true, overrides: [1, "❓"] });
    expect(cp3.decode(new Uint8Array([1]))).toBe("❓");
  });

  test("CP1251 with strict", () => {
    const cp1 = CP.create({ strictDecode: false });
    const cp2 = CP.create({ strictDecode: true });
    const cp3 = CP.create();
    expect(cp1.decode(new Uint8Array([0x98])).charCodeAt(0)).toBe(DEFAULT_CHAR_UNICODE);
    expect(cp2.decode(new Uint8Array([0x98])).charCodeAt(0)).toBe(DEFAULT_CHAR_UNICODE);
    expect(cp3.decode(new Uint8Array([0x98])).charCodeAt(0)).toBe(DEFAULT_CHAR_UNICODE);
  });

  test("CP1251 with handler", () => {
    const cp = CP.create({
      defaultCharUnicode: (b, i) => (i % 2 === 0 ? "❓".charCodeAt(0) : null),
    });
    expect(cp.decode(new Uint8Array([0x98, 0x98, 0x98, 0x98, 0x98]))).toBe("❓�❓�❓");
  });

  test("CP1251 with handler 2", () => {
    const cp = CP.create({
      defaultCharUnicode: (b, i) => b + i,
    });
    expect(cp.decode(new Uint8Array([0x5b, 0x98, 0x41, 0x42, 0x43, 0x98, 0x5d]))).toBe("[\x99ABC\x9d]");
  });

  test("CP1251 with handler 3", () => {
    const cp = CP.create({
      defaultCharByte: (b, i) => (i % 2 === 0 ? "_".charCodeAt(0) : null),
    });
    expect(cp.decode(cp.encode("привет 😀"))).toBe("привет ?_");
  });

  test("CP1251 with handler 4", () => {
    const cp = CP.create({
      defaultCharByte: (b) => (b === "�".charCodeAt(0) ? 0 : 0x3f),
    });
    expect(cp.encode("[❓�❓]")).toStrictEqual(new Uint8Array([0x5b, 0x3f, 0, 0x3f, 0x5d]));
  });

  test("CP1251", () => {
    const cp = CP.create();
    expect(cp.decode(cp.encode("hello привет"))).toBe("hello привет");
    expect(cp.decode(cp.encode("😀"))).toBe("??");
    expect(cp.decode(new Uint8Array([224, 225, 226, 227, 228, 229, 184, 230, 231, 232, 233]))).toBe("абвгдеёжзий");
    expect(cp.decode(new Uint8Array([1, 127]))).toBe("\u0001\u007f");
    expect(cp.decode(cp.encode("Превед Medved!"))).toBe("Превед Medved!");
    expect(cp.encode("абвгдеёжзий")).toStrictEqual(new Uint8Array([224, 225, 226, 227, 228, 229, 184, 230, 231, 232, 233]));
  });

  test("CP1251 options", () => {
    const cp1 = CP.create({ defaultCharUnicode: "_" });
    const cp2 = CP.create({ defaultCharUnicode: "#" });
    expect(cp1.decode(new Uint8Array([0x98]))).toBe("_");
    expect(cp2.decode(new Uint8Array([0x98]))).toBe("#");
  });

  test("CP1251 options 2", () => {
    const cp = CP.create({ defaultCharByte: "_" });
    expect(cp.decode(cp.encode("😀"))).toBe("__");
  });

  test("CP1251 overrides", () => {
    const cp = CP.create({ defaultCharByte: "#", overrides: [0, "😀"] });
    expect(cp.decode(cp.encode("😀"))).toBe("�#");
  });

  test("CP1251 overrides 2", () => {
    const cp = CP.create({ overrides: [0, "😀", 1, "😀".charCodeAt(1)] });
    expect(cp.decode(cp.encode("😀"))).toBe("😀");
  });

  test("CP1251 TextDecoder", () => {
    const buffer = new Uint8Array(256);
    for (let i = 0; i < 255; i++) {
      buffer[i] = i;
    }
    const cp = CP.create({ nativeDecode: true });
    const str = cp.decode(buffer);
    expect(str).toBe(new TextDecoder("cp1251").decode(buffer));
  });
}

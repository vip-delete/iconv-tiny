import { CP1251 } from "iconv-tiny";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, REPLACEMENT_CHARACTER_CODE } from "../../src/commons.mjs";

test("CP1251", () => {
  const cp = CP1251.create();
  expect(cp.encode("\u0098")[0]).toBe(DEFAULT_CHAR_BYTE);
  // TextDecoder maps UNDEFINED bytes in CP1251 to Unicode "as-is": 0x98 maps to \u0098
  expect(cp.decode(new Uint8Array([0x98]), { native: true })).toBe("\u0098");
  // defaultCharUnicode is ignored if native is true
  expect(cp.decode(new Uint8Array([0x98]), { native: true, defaultCharUnicode: "❓" })).toBe("\u0098");
  // overrides is ignored if native is true
  const cp1 = CP1251.create({ overrides: [1, "☺"] });
  expect(cp1.decode(new Uint8Array([1]), { native: true })).toBe("\u0001");
});

test("CP1251 with strict", () => {
  const cp = CP1251.create();
  expect(cp.decode(new Uint8Array([0x98])).charCodeAt(0)).toBe(REPLACEMENT_CHARACTER_CODE);
});

test("CP1251 with handler", () => {
  const cp = CP1251.create();
  expect(
    cp.decode(new Uint8Array([0x98, 0x98, 0x98, 0x98, 0x98]), {
      defaultCharUnicode: (input, index) => (index % 2 === 0 ? "❓".charCodeAt(0) : null),
    }),
  ).toBe("❓�❓�❓");
});

test("CP1251 with handler 2", () => {
  const cp = CP1251.create();
  expect(
    cp.decode(new Uint8Array([0x5b, 0x98, 0x41, 0x42, 0x43, 0x98, 0x5d]), {
      defaultCharUnicode: (input, index) => input + index,
    }),
  ).toBe("[\x99ABC\x9d]");
});

test("CP1251 with handler 3", () => {
  const cp = CP1251.create();
  expect(
    cp.decode(
      cp.encode("привет 😀", {
        defaultCharByte: (input, index) => (index % 2 === 0 ? "_".charCodeAt(0) : null),
      }),
    ),
  ).toBe("привет ?_");
});

test("CP1251 with handler 4", () => {
  const cp = CP1251.create();
  expect(
    cp.encode("[❓�❓]", {
      defaultCharByte: (input) => (input === "�".charCodeAt(0) ? 0 : 0x3f),
    }),
  ).toStrictEqual(new Uint8Array([0x5b, 0x3f, 0, 0x3f, 0x5d]));
});

test("CP1251", () => {
  const cp = CP1251.create();
  expect(cp.decode(cp.encode("hello привет"))).toBe("hello привет");
  expect(cp.decode(cp.encode("😀"))).toBe("??");
  expect(cp.decode(new Uint8Array([224, 225, 226, 227, 228, 229, 184, 230, 231, 232, 233]))).toBe("абвгдеёжзий");
  expect(cp.decode(new Uint8Array([1, 127]))).toBe("\u0001\u007f");
  expect(cp.decode(cp.encode("Превед Medved!"))).toBe("Превед Medved!");
  expect(cp.encode("абвгдеёжзий")).toStrictEqual(new Uint8Array([224, 225, 226, 227, 228, 229, 184, 230, 231, 232, 233]));
});

test("CP1251 options", () => {
  const cp = CP1251.create();
  expect(cp.decode(new Uint8Array([0x98]), { defaultCharUnicode: "_" })).toBe("_");
  expect(cp.decode(new Uint8Array([0x98]), { defaultCharUnicode: "#" })).toBe("#");
});

test("CP1251 options 2", () => {
  const cp = CP1251.create();
  expect(cp.decode(cp.encode("😀", { defaultCharByte: "_" }))).toBe("__");
});

test("CP1251 overrides", () => {
  const cp = CP1251.create({ overrides: [0, "😀"] });
  expect(cp.decode(cp.encode("😀", { defaultCharByte: "#" }))).toBe("\ud83d#");
  expect(cp.decode(cp.encode("😀".repeat(200), { defaultCharByte: "#" }))).toBe("\ud83d#".repeat(200));
});

test("CP1251 overrides 2", () => {
  const cp = CP1251.create({ overrides: [0, "😀", 1, "😀".charCodeAt(1)] });
  expect(cp.decode(cp.encode("😀"))).toBe("😀");
});

test("CP1251 byteLength", () => {
  const cp = CP1251.create();
  expect(cp.newEncoder().byteLength("😀")).toBe(2);
  expect(cp.newEncoder().byteLength("Привет")).toBe(6);
  expect(cp.newEncoder().byteLength("你好")).toBe(2); // 2 code units
});

test("CP1251 TextDecoder", () => {
  const buffer = new Uint8Array(256);
  for (let i = 0; i < 255; i++) {
    buffer[i] = i;
  }
  const cp = CP1251.create();
  const str = cp.decode(buffer, { native: true });
  expect(str).toBe(new TextDecoder("cp1251").decode(buffer));
});

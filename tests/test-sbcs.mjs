import iconvLite from "iconv-lite";
import { CP1006, CP1251, CP1252, CP1255, CP424, CP437, CP864, CP875, createIconv, ISO_8859_15, ISO_8859_8, NEXTSTEP, US_ASCII } from "iconv-tiny";
import { expect, test } from "vitest";
import { DEFAULT_CHAR_BYTE, REPLACEMENT_CHARACTER_CODE } from "../src/commons.mjs";

test("CP424", () => {
  const cp = CP424.create();
  expect(cp.getName()).toBe("CP424");
  expect(cp.decode(new Uint8Array([0]))).toBe("\x00");
  expect(cp.decode(new Uint8Array([1]))).toBe("\x01");
  expect(cp.decode(new Uint8Array([2]))).toBe("\x02");
  expect(cp.decode(new Uint8Array([3]))).toBe("\x03");
  expect(cp.decode(new Uint8Array([4]))).toBe("\x9c");
  expect(cp.decode(new Uint8Array([5]))).toBe("\x09");
  expect(cp.decode(new Uint8Array([6]))).toBe("\x86");
  expect(cp.decode(new Uint8Array([7]))).toBe("\x7F");
  expect(cp.decode(new Uint8Array([8]))).toBe("\x97");
  expect(cp.decode(new Uint8Array([9]))).toBe("\x8d");
  expect(cp.decode(new Uint8Array([10]))).toBe("\x8e");

  expect(cp.decode(new Uint8Array([70]))).toBe("\u05d5");
  expect(cp.decode(new Uint8Array([0x70]))).toBe("�");
  expect(cp.decode(new Uint8Array([0xfe]))).toBe("�");
  expect(cp.decode(new Uint8Array([0xff]))).toBe("\x9f");
});

test("CP437", () => {
  const cp = CP437.create();
  expect(cp.getName()).toBe("CP437");
  expect(cp.decode(new Uint8Array([0, 1, 2]))).toBe("\x00\x01\x02");
});

test("CP437 graphic mode", () => {
  const graphics = " ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼";
  const overrides = [];
  for (let i = 0; i < graphics.length; i++) {
    overrides.push(i);
    overrides.push(graphics[i]);
  }
  const cp = CP437.create({ overrides });
  expect(cp.decode(new Uint8Array([0, 1, 2, 3, 4]))).toBe(" ☺☻♥♦");
});

test("CP846", () => {
  const cp1 = CP864.create();
  const cp2 = CP864.create({ overrides: [0x25, 0x25] });
  const cp3 = CP864.create({ overrides: [0x25, "€"] });
  expect(cp1.decode(new Uint8Array([0x25]))).toBe("٪"); // ARABIC PERCENT SIGN
  expect(cp2.decode(new Uint8Array([0x25]))).toBe("%"); // PERCENT SIGN
  expect(cp3.decode(new Uint8Array([0x25]))).toBe("€"); // EURO SIGN
});

test("CP875", () => {
  const cp = CP875.create();
  expect(cp.decode(new Uint8Array([0xe1, 0xfc, 0xec]))).toBe("₯€ͺ");
  expect(cp.decode(new Uint8Array([0xfd]), { native: true })).toBe("�");
});

test("CP1006", () => {
  const cp = CP1006.create();
  // https://www.unicode.org/Public/MAPPINGS/VENDORS/MISC/CP1006.TXT
  // ...
  // 0xB1 0xFE8E # ARABIC LETTER ALEF FINAL FORM
  // 0xB2 0xFE8E # ARABIC LETTER ALEF FINAL FORM
  // ...
  expect(cp.decode(new Uint8Array([0xb1]))).toBe("\ufe8e");
  expect(cp.decode(new Uint8Array([0xb2]))).toBe("\ufe8e");
  expect(cp.encode("\ufe8e")[0]).toBe(0xb2);
});

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
  expect(cp.byteLength("😀")).toBe(2);
  expect(cp.byteLength("Привет")).toBe(6);
  expect(cp.byteLength("你好")).toBe(2); // 2 code units
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

test("CP1252", () => {
  const cp = CP1252.create();
  expect(cp.decode(new Uint8Array([".".charCodeAt(0), 32, 32, 32, 32, 32, 32, 32, 32, 32, 32])).trimEnd()).toBe(".");
  expect(cp.decode(new Uint8Array([72, 69, 76, 76, 79, 32, 32, 32, 65, 32, 32])).trimEnd()).toBe("HELLO   A");
  expect(cp.decode(new Uint8Array([72, 69, 76, 76, 79, 32, 32, 32, 65, 83, 77]))).toBe("HELLO   ASM");
  expect(cp.decode(new Uint8Array([224, 225, 226, 227, 228, 229, 184, 230, 231, 232, 233]))).toBe("àáâãäå¸æçèé");
  expect(cp.decode(new Uint8Array([1, 127]))).toBe("\u0001\u007f");
  expect(cp.decode(cp.encode("Превед Medved!"))).toBe("?????? Medved!");
  expect(cp.encode("HELLO   ASM")).toStrictEqual(new Uint8Array([72, 69, 76, 76, 79, 32, 32, 32, 65, 83, 77]));
});

test("CP1252 overrides", () => {
  const cp = CP1252.create({ overrides: [0x81, "❓"] });
  const buf = new Uint8Array([0x80, 0x81]);
  expect(cp.decode(buf)).toBe("€❓");
  expect(cp.encode("€❓")).toStrictEqual(buf);
});

test("CP1252 overrides", () => {
  const buf = new Uint8Array([0x41, 0x42, 0x81, 0x8d, 0x8f, 0x90, 0x9d]);

  const cp = CP1252.create();
  expect(cp.decode(buf, { defaultCharUnicode: "❓" })).toBe("AB❓❓❓❓❓");

  // default character as be a function.
  const indexes = /** @type {Array<number>} */ ([]);
  expect(
    cp.decode(buf, {
      defaultCharUnicode: (input, index) => {
        indexes.push(index);
        return null;
      },
    }),
  ).toBe("AB�����");
  expect(indexes).toStrictEqual([2, 3, 4, 5, 6]);
});
test("CP1255", () => {
  const cp = CP1255.create();
  expect(cp.decode(new Uint8Array([0xca])).charCodeAt(0)).toBe(0x05ba);
});

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

test("ISO-8859-15", () => {
  const iconv = createIconv({ CP1251, ISO_8859_15 });
  expect(iconv.decode(new Uint8Array([164]), "iso8859-15")).toBe("€");
  expect(iconv.decode(new Uint8Array([190]), "iso-885915")).toBe("Ÿ");
});

test("US-ASCII", () => {
  const cp = US_ASCII.create();
  // iconv-lite maps "�" to the latest unmapped code (to 255)
  // but "�" has no mapping at all and should be mapped to the default char
  expect(cp.encode("�")[0]).toBe(DEFAULT_CHAR_BYTE);
  expect(cp.encode("").length).toBe(0);
  expect(cp.getEncoder().end().length).toBe(0);
  expect(cp.getDecoder().end()).toBe("");

  const str = String.fromCharCode(REPLACEMENT_CHARACTER_CODE);
  const buf = new Uint8Array([65, 66, 67, 229]);
  // US-ASCII range 0x80-0xFF is unmapped
  expect(cp.decode(buf)).toBe(`ABC${str}`);
  // but TextDecoder maps US-ASCII "as-is" like LATIN1 aka ISO-8859-1
  expect(new TextDecoder("US-ASCII").decode(buf)).toBe(`ABCå`);
  // however iconv-lite also maps a 0x80-0xFF to "�"
  expect(iconvLite.decode(Buffer.from(buf), "US-ASCII")).toBe(`ABC${str}`);
});

test("NEXTSTEP", () => {
  const iconv = createIconv({ NEXTSTEP });
  expect(iconv.decode(new Uint8Array([0xfe]), "NEXTSTEP", { defaultCharUnicode: "1" })).toBe("1");
  expect(iconv.decode(new Uint8Array([0xfe]), "NEXTSTEP", { defaultCharUnicode: "2" })).toBe("2");
  expect(iconv.decode(new Uint8Array([0xff]), "NEXTSTEP", { defaultCharUnicode: "3" })).toBe("3");
  expect(iconv.decode(new Uint8Array([0xff]), "NEXTSTEP", { defaultCharUnicode: "4" })).toBe("4");
});

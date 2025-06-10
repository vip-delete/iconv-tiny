import { UTF16BE, UTF16LE, UTF32BE, UTF32LE, UTF8 } from "iconv-tiny";
import { expect, test } from "vitest";

const tests = [
  {
    str: "Hello",
    utf8: [0x48, 0x65, 0x6c, 0x6c, 0x6f],
    utf16le: [0x48, 0, 0x65, 0, 0x6c, 0, 0x6c, 0, 0x6f, 0],
    utf16be: [0, 0x48, 0, 0x65, 0, 0x6c, 0, 0x6c, 0, 0x6f],
    utf16lebom: [0xff, 0xfe, 0x48, 0, 0x65, 0, 0x6c, 0, 0x6c, 0, 0x6f, 0],
    utf16bebom: [0xfe, 0xff, 0, 0x48, 0, 0x65, 0, 0x6c, 0, 0x6c, 0, 0x6f],
    utf32le: [0x48, 0, 0, 0, 0x65, 0, 0, 0, 0x6c, 0, 0, 0, 0x6c, 0, 0, 0, 0x6f, 0, 0, 0],
    utf32be: [0, 0, 0, 0x48, 0, 0, 0, 0x65, 0, 0, 0, 0x6c, 0, 0, 0, 0x6c, 0, 0, 0, 0x6f],
    utf32lebom: [0xff, 0xfe, 0, 0, 0x48, 0, 0, 0, 0x65, 0, 0, 0, 0x6c, 0, 0, 0, 0x6c, 0, 0, 0, 0x6f, 0, 0, 0],
    utf32bebom: [0, 0, 0xfe, 0xff, 0, 0, 0, 0x48, 0, 0, 0, 0x65, 0, 0, 0, 0x6c, 0, 0, 0, 0x6c, 0, 0, 0, 0x6f],
  },
  {
    str: "Привет",
    utf8: [0xd0, 0x9f, 0xd1, 0x80, 0xd0, 0xb8, 0xd0, 0xb2, 0xd0, 0xb5, 0xd1, 0x82],
    utf16le: [0x1f, 0x04, 0x40, 0x04, 0x38, 0x04, 0x32, 0x04, 0x35, 0x04, 0x42, 0x04],
    utf16be: [0x04, 0x1f, 0x04, 0x40, 0x04, 0x38, 0x04, 0x32, 0x04, 0x35, 0x04, 0x42],
    utf16lebom: [0xff, 0xfe, 0x1f, 0x04, 0x40, 0x04, 0x38, 0x04, 0x32, 0x04, 0x35, 0x04, 0x42, 0x04],
    utf16bebom: [0xfe, 0xff, 0x04, 0x1f, 0x04, 0x40, 0x04, 0x38, 0x04, 0x32, 0x04, 0x35, 0x04, 0x42],
    utf32le: [0x1f, 0x04, 0, 0, 0x40, 0x04, 0, 0, 0x38, 0x04, 0, 0, 0x32, 0x04, 0, 0, 0x35, 0x04, 0, 0, 0x42, 0x04, 0, 0],
    utf32be: [0, 0, 0x04, 0x1f, 0, 0, 0x04, 0x40, 0, 0, 0x04, 0x38, 0, 0, 0x04, 0x32, 0, 0, 0x04, 0x35, 0, 0, 0x04, 0x42],
    utf32lebom: [0xff, 0xfe, 0, 0, 0x1f, 0x04, 0, 0, 0x40, 0x04, 0, 0, 0x38, 0x04, 0, 0, 0x32, 0x04, 0, 0, 0x35, 0x04, 0, 0, 0x42, 0x04, 0, 0],
    utf32bebom: [0, 0, 0xfe, 0xff, 0, 0, 0x04, 0x1f, 0, 0, 0x04, 0x40, 0, 0, 0x04, 0x38, 0, 0, 0x04, 0x32, 0, 0, 0x04, 0x35, 0, 0, 0x04, 0x42],
  },
  {
    str: "😊", // U+1F60A
    utf8: [0xf0, 0x9f, 0x98, 0x8a],
    utf16le: [0x3d, 0xd8, 0x0a, 0xde],
    utf16be: [0xd8, 0x3d, 0xde, 0x0a],
    utf16lebom: [0xff, 0xfe, 0x3d, 0xd8, 0x0a, 0xde],
    utf16bebom: [0xfe, 0xff, 0xd8, 0x3d, 0xde, 0x0a],
    utf32le: [0x0a, 0xf6, 0x01, 0x00],
    utf32be: [0x00, 0x01, 0xf6, 0x0a],
    utf32lebom: [0xff, 0xfe, 0, 0, 0x0a, 0xf6, 0x01, 0x00],
    utf32bebom: [0, 0, 0xfe, 0xff, 0x00, 0x01, 0xf6, 0x0a],
  },
  {
    str: "€", // U+20AC
    utf8: [0xe2, 0x82, 0xac],
    utf16le: [0xac, 0x20],
    utf16be: [0x20, 0xac],
    utf16lebom: [0xff, 0xfe, 0xac, 0x20],
    utf16bebom: [0xfe, 0xff, 0x20, 0xac],
    utf32le: [0xac, 0x20, 0, 0],
    utf32be: [0, 0, 0x20, 0xac],
    utf32lebom: [0xff, 0xfe, 0, 0, 0xac, 0x20, 0, 0],
    utf32bebom: [0, 0, 0xfe, 0xff, 0, 0, 0x20, 0xac],
  },
  {
    str: "ñ", // U+00F1
    utf8: [0xc3, 0xb1],
    utf16le: [0xf1, 0],
    utf16be: [0, 0xf1],
    utf16lebom: [0xff, 0xfe, 0xf1, 0],
    utf16bebom: [0xfe, 0xff, 0, 0xf1],
    utf32le: [0xf1, 0, 0, 0],
    utf32be: [0, 0, 0, 0xf1],
    utf32lebom: [0xff, 0xfe, 0, 0, 0xf1, 0, 0, 0],
    utf32bebom: [0, 0, 0xfe, 0xff, 0, 0, 0, 0xf1],
  },
];

/**
 * @param {!ns.Encoding} encoding
 * @param {!Uint8Array} array
 * @returns {string}
 */
const decodeStream = (encoding, array) => {
  const decoder = encoding.newDecoder();
  let str = "";
  for (let i = 0; i < array.length; i++) {
    str += decoder.decode(new Uint8Array([array[i]]));
  }
  return str + decoder.decode();
};

test("UTF-8", () => {
  const utf8 = UTF8.create();
  expect(utf8.getName()).toBe("UTF-8");
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  for (const item of tests) {
    // native
    expect(encoder.encode(item.str)).toStrictEqual(new Uint8Array(item.utf8));
    expect(decoder.decode(new Uint8Array(item.utf8))).toBe(item.str);

    // iconv-tiny
    expect(utf8.encode(item.str)).toStrictEqual(new Uint8Array(item.utf8));
    expect(utf8.decode(new Uint8Array(item.utf8))).toBe(item.str);

    // stream
    expect(decodeStream(utf8, new Uint8Array(item.utf8))).toBe(item.str);
  }

  expect(utf8.newDecoder().decode()).toBe("");
  expect(utf8.newEncoder().encode()).toStrictEqual(new Uint8Array(0));

  expect(utf8.encode("😼", { addBOM: true }).subarray(0, 3)).toStrictEqual(new Uint8Array([0xef, 0xbb, 0xbf]));

  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(0))).toStrictEqual({ read: 0, written: 0 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(1))).toStrictEqual({ read: 0, written: 0 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(2))).toStrictEqual({ read: 0, written: 0 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(3))).toStrictEqual({ read: 0, written: 3 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(4))).toStrictEqual({ read: 0, written: 3 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(5))).toStrictEqual({ read: 0, written: 3 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(6))).toStrictEqual({ read: 0, written: 3 });
  expect(utf8.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(7))).toStrictEqual({ read: 2, written: 7 });

  expect(utf8.newEncoder().encode("😼")).toStrictEqual(new Uint8Array([0xf0, 0x9f, 0x98, 0xbc]));
  expect(utf8.newEncoder().byteLength("😼")).toBe(4);
  expect(utf8.newEncoder({ addBOM: true }).byteLength("😼")).toBe(7);
  expect(utf8.newEncoder().byteLength("A€😀")).toBe(1 + 3 + 4);
  expect(utf8.newEncoder().byteLength("")).toBe(0);
  expect(utf8.newEncoder({ addBOM: true }).byteLength("")).toBe(3);

  const big1 = "😼".repeat(10000);
  expect(new TextEncoder().encode(big1).length).toBe(4 * 10000);
  expect(utf8.newEncoder().byteLength(big1)).toBe(4 * 10000);
  expect(utf8.newEncoder({ addBOM: true }).byteLength(big1)).toBe(3 + 4 * 10000);

  const big2 = "€".repeat(10000);
  expect(new TextEncoder().encode(big2).length).toBe(3 * 10000);
  expect(utf8.newEncoder().byteLength(big2)).toBe(3 * 10000);
  expect(utf8.newEncoder({ addBOM: true }).byteLength(big2)).toBe(3 + 3 * 10000);

  expect(new TextEncoder().encodeInto("😼", new Uint8Array(0))).toStrictEqual({ read: 0, written: 0 });
  expect(new TextEncoder().encodeInto("😼", new Uint8Array(1))).toStrictEqual({ read: 0, written: 0 });
  expect(new TextEncoder().encodeInto("😼", new Uint8Array(2))).toStrictEqual({ read: 0, written: 0 });
  expect(new TextEncoder().encodeInto("😼", new Uint8Array(3))).toStrictEqual({ read: 0, written: 0 });
  expect(new TextEncoder().encodeInto("😼", new Uint8Array(4))).toStrictEqual({ read: 2, written: 4 });
});

test("UTF-8 incomplete", () => {
  const decoder = new TextDecoder();
  expect(decoder.decode(new Uint8Array([0xd0]), { stream: true })).toBe("");
  expect(decoder.decode()).toBe("�"); // incomplete

  const utf8 = UTF8.create();
  const dec = utf8.newDecoder();
  expect(dec.decode(new Uint8Array([0xd0]))).toBe("");
  expect(dec.decode()).toBe("�"); // incomplete
});

test("UTF-16", () => {
  // native
  const decoderUTF16LE = new TextDecoder("UTF-16LE", { ignoreBOM: true });
  const decoderUTF16BE = new TextDecoder("UTF-16BE", { ignoreBOM: true });
  const decoderUTF16LEBOM = new TextDecoder("UTF-16LE"); // ignoreBOM: false
  const decoderUTF16BEBOM = new TextDecoder("UTF-16BE"); // ignoreBOM: false

  // iconv-tiny
  const utf16le = UTF16LE.create();
  const utf16be = UTF16BE.create();
  expect(utf16le.getName()).toBe("UTF-16LE");
  expect(utf16be.getName()).toBe("UTF-16BE");

  expect(utf16be.decode(new Uint8Array([0x00, 0x92, 0x00, 0x93]))).toBe("\u0092\u0093");
  expect(utf16be.decode(new Uint8Array([0xfe, 0xff, 0x00, 0x92, 0x00, 0x93]), { stripBOM: false })).toBe("\ufeff\u0092\u0093");
  expect(utf16le.decode(new Uint8Array([0x00, 0x92, 0x00, 0x93]))).toBe("\u9200\u9300");
  expect(utf16le.decode(new Uint8Array([0xff, 0xfe, 0x00, 0x92, 0x00, 0x93]), { stripBOM: false })).toBe("\ufeff\u9200\u9300");

  for (const item of tests) {
    // native
    expect(decoderUTF16LE.decode(new Uint8Array(item.utf16le))).toBe(item.str);
    expect(decoderUTF16LE.decode(new Uint8Array(item.utf16lebom))).toBe("\ufeff" + item.str);
    expect(decoderUTF16BE.decode(new Uint8Array(item.utf16be))).toBe(item.str);
    expect(decoderUTF16BE.decode(new Uint8Array(item.utf16bebom))).toBe("\ufeff" + item.str);
    expect(decoderUTF16LEBOM.decode(new Uint8Array(item.utf16lebom))).toBe(item.str);
    expect(decoderUTF16BEBOM.decode(new Uint8Array(item.utf16bebom))).toBe(item.str);

    // iconv-tiny decode
    expect(utf16le.decode(new Uint8Array(item.utf16le))).toBe(item.str);
    expect(utf16le.decode(new Uint8Array(item.utf16lebom))).toBe(item.str);
    expect(utf16le.decode(new Uint8Array(item.utf16lebom), { stripBOM: false })).toBe("\ufeff" + item.str);
    expect(utf16be.decode(new Uint8Array(item.utf16be))).toBe(item.str);
    expect(utf16be.decode(new Uint8Array(item.utf16bebom))).toBe(item.str);
    expect(utf16be.decode(new Uint8Array(item.utf16bebom), { stripBOM: false })).toBe("\ufeff" + item.str);

    // stream
    expect(decodeStream(utf16le, new Uint8Array(item.utf16le))).toBe(item.str);
    expect(decodeStream(utf16be, new Uint8Array(item.utf16be))).toBe(item.str);
    expect(decodeStream(utf16le, new Uint8Array(item.utf16lebom))).toBe(item.str);
    expect(decodeStream(utf16be, new Uint8Array(item.utf16bebom))).toBe(item.str);

    // iconv-tiny encode
    expect(utf16le.encode(item.str)).toStrictEqual(new Uint8Array(item.utf16le));
    expect(utf16be.encode(item.str)).toStrictEqual(new Uint8Array(item.utf16be));
    expect(utf16le.encode(item.str, { addBOM: true })).toStrictEqual(new Uint8Array(item.utf16lebom));
    expect(utf16be.encode(item.str, { addBOM: true })).toStrictEqual(new Uint8Array(item.utf16bebom));
  }

  expect(utf16le.newDecoder().decode()).toBe("");
  expect(utf16le.newEncoder().encode()).toStrictEqual(new Uint8Array(0));
  expect(utf16be.newDecoder().decode()).toBe("");
  expect(utf16be.newEncoder().encode()).toStrictEqual(new Uint8Array(0));

  expect(utf16le.encode("😼", { addBOM: true }).subarray(0, 2)).toStrictEqual(new Uint8Array([0xff, 0xfe]));
  expect(utf16be.encode("😼", { addBOM: true }).subarray(0, 2)).toStrictEqual(new Uint8Array([0xfe, 0xff]));

  expect(utf16le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(0))).toStrictEqual({ read: 0, written: 0 });
  expect(utf16le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(1))).toStrictEqual({ read: 0, written: 0 });
  expect(utf16le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(2))).toStrictEqual({ read: 0, written: 2 });
  expect(utf16le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(3))).toStrictEqual({ read: 0, written: 2 });
  expect(utf16le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(4))).toStrictEqual({ read: 2, written: 6 });

  expect(utf16le.newEncoder().byteLength("1")).toBe(2);
  expect(utf16le.newEncoder().byteLength("11")).toBe(4);
  expect(utf16le.newEncoder().byteLength("😼")).toBe(4);
  expect(utf16le.newEncoder({ addBOM: true }).byteLength("😼")).toBe(6);
});

test("UTF-32", () => {
  const utf32le = UTF32LE.create();
  const utf32be = UTF32BE.create();
  expect(utf32le.getName()).toBe("UTF-32LE");
  expect(utf32be.getName()).toBe("UTF-32BE");

  for (const item of tests) {
    // iconv-tiny decode
    expect(utf32le.decode(new Uint8Array(item.utf32le))).toBe(item.str);
    expect(utf32le.decode(new Uint8Array(item.utf32lebom))).toBe(item.str);
    expect(utf32le.decode(new Uint8Array(item.utf32lebom), { stripBOM: false })).toBe("\ufeff" + item.str);
    expect(utf32be.decode(new Uint8Array(item.utf32be))).toBe(item.str);
    expect(utf32be.decode(new Uint8Array(item.utf32bebom))).toBe(item.str);
    expect(utf32be.decode(new Uint8Array(item.utf32bebom), { stripBOM: false })).toBe("\ufeff" + item.str);

    // // stream
    expect(decodeStream(utf32le, new Uint8Array(item.utf32le))).toBe(item.str);
    expect(decodeStream(utf32be, new Uint8Array(item.utf32be))).toBe(item.str);
    expect(decodeStream(utf32le, new Uint8Array(item.utf32lebom))).toBe(item.str);
    expect(decodeStream(utf32be, new Uint8Array(item.utf32bebom))).toBe(item.str);

    // iconv-tiny encode
    expect(utf32le.encode(item.str)).toStrictEqual(new Uint8Array(item.utf32le));
    expect(utf32be.encode(item.str)).toStrictEqual(new Uint8Array(item.utf32be));
    expect(utf32le.encode(item.str, { addBOM: true })).toStrictEqual(new Uint8Array(item.utf32lebom));
    expect(utf32be.encode(item.str, { addBOM: true })).toStrictEqual(new Uint8Array(item.utf32bebom));
  }

  expect(utf32le.newDecoder().decode()).toBe("");
  expect(utf32le.newEncoder().encode()).toStrictEqual(new Uint8Array(0));
  expect(utf32be.newDecoder().decode()).toBe("");
  expect(utf32be.newEncoder().encode()).toStrictEqual(new Uint8Array(0));

  expect(utf32le.encode("😼", { addBOM: true }).subarray(0, 4)).toStrictEqual(new Uint8Array([0xff, 0xfe, 0, 0]));
  expect(utf32be.encode("😼", { addBOM: true }).subarray(0, 4)).toStrictEqual(new Uint8Array([0, 0, 0xfe, 0xff]));

  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(0))).toStrictEqual({ read: 0, written: 0 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(1))).toStrictEqual({ read: 0, written: 0 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(2))).toStrictEqual({ read: 0, written: 0 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(3))).toStrictEqual({ read: 0, written: 0 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(4))).toStrictEqual({ read: 0, written: 4 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(5))).toStrictEqual({ read: 0, written: 4 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(6))).toStrictEqual({ read: 0, written: 4 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(7))).toStrictEqual({ read: 0, written: 4 });
  expect(utf32le.newEncoder({ addBOM: true }).encodeInto("😼", new Uint8Array(8))).toStrictEqual({ read: 2, written: 8 });

  expect(utf32le.newEncoder().byteLength("1")).toBe(4);
  expect(utf32le.newEncoder().byteLength("11")).toBe(8);
  expect(utf32le.newEncoder().byteLength("😼")).toBe(4);
  expect(utf32le.newEncoder({ addBOM: true }).byteLength("😼")).toBe(8);

  expect(utf32le.newDecoder().decode(new Uint8Array([0xff, 0xff, 0xff, 0xff]))).toBe("�");
});

test("UTF-32 incomplete", () => {
  const utf32 = UTF32LE.create();
  const dec = utf32.newDecoder();
  expect(dec.decode(new Uint8Array([0xd0]))).toBe("");
  expect(dec.decode()).toBe("�"); // incomplete
});

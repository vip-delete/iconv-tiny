import iconvLite from "iconv-lite";
import { aliases, createIconv, encodings } from "iconv-tiny";
import { expect, test } from "vitest";

const iconv = createIconv(encodings, aliases);

/**
 * @param {string} string
 * @param {string} encoding
 * @returns {!Uint8Array}
 */
const testString = (string, encoding) => {
  const expected = new Uint8Array(iconvLite.encode(string, encoding));
  expect(iconvLite.decode(expected, encoding)).toStrictEqual(string);

  const buf = iconv.encode(string, encoding);
  const str = iconv.decode(buf, encoding);
  expect(buf).toStrictEqual(expected);
  expect(str).toBe(string);
  expect(new TextDecoder(encoding).decode(buf)).toBe(string);

  return buf;
};

test("SHIFT-JIS", () => {
  const buf = testString("JS はすごい", "shift-jis");

  // stream mode (doble-byte sequence is broken into two parts)
  const decoder = iconv.getEncoding("shift-jis").newDecoder();
  const a1 = decoder.decode(new Uint8Array([0x82]));
  const b1 = decoder.decode(new Uint8Array([0x60]));
  const c1 = decoder.decode();
  expect(a1).toBe("");
  expect(b1).toBe("Ａ");
  expect(c1).toBe("");
  expect(iconv.getEncoding("shift-jis").decode(new Uint8Array([0x82, 0x60]))).toBe("Ａ");

  // stream mode (doble-byte sequence is broken into two parts)
  const decoder2 = iconv.getEncoding("shift-jis").newDecoder();
  const a2 = decoder2.decode(new Uint8Array([0x82])); // valid lead byte goes to leftoverByte
  const b2 = decoder2.decode(new Uint8Array([0x22])); // 0x8222 becomes �, but keep 0x22 in the stream
  const c2 = decoder2.decode();
  expect(a2).toBe("");
  expect(b2).toBe(`�"`);
  expect(c2).toBe("");
  expect(iconv.getEncoding("shift-jis").decode(new Uint8Array([0x82, 0x22]))).toBe(`�"`);
  expect(new TextDecoder("shift-jis").decode(new Uint8Array([0x82, 0x22]))).toBe(`�"`);

  // stream mode 3
  const decoder3 = iconv.getEncoding("shift-jis").newDecoder();
  const a3 = decoder3.decode(buf.subarray(0, buf.length - 3));
  const b3 = decoder3.decode(buf.subarray(buf.length - 3));
  const c3 = decoder3.decode();
  expect(a3).toBe("JS はす");
  expect(b3).toBe("ごい");
  expect(c3).toBe("");

  // valid lead byte + unmapped pair
  const invalidPairs = [];
  for (let i = 0; i < 0x4f; i++) {
    invalidPairs.push(i);
  }
  invalidPairs.push(0x7f);
  for (let i = 0xf2; i <= 0xff; i++) {
    invalidPairs.push(i);
  }

  // the real difference comes from unmapped pairs
  for (let i = 0; i < 256; i++) {
    const tiny = iconv.getEncoding("cp932").decode(new Uint8Array([0x82, i]));
    const lite = iconvLite.decode(new Uint8Array([0x82, i]), "shift-jis");

    // iconv-tiny is identical to iconv-lite
    expect(tiny).toBe(lite);

    // new TextDecoder("shift-jis").decode(new Uint8Array([0x82, i]));
    // Browsers follow WhatWG Encoding Standard which is different from Unicode Mappings 🤯🤦‍♂️
    // NodeJS also adds additional mappings into unmapped ranges
    // [0x82, 0x1a] gives "�\u001c" in NodeJS 🤦‍♂️, but correct "�\u001a" in Firefox/Chrome/Edge/IconvTiny/IconvLite
    // [0x82, 0x1c] gives "�\u007f" in NodeJS 🤦‍♂️, but correct "�\u001c" in Firefox/Chrome/Edge/IconvTiny/IconvLite
    // ...
  }
});

test("SHIFT-JIS 2", () => {
  const strings = [
    //
    "１＋２＝３",
    "ｱｲｳｴｵ",
    "こんにちは",
    "Windowsで実行",
    "ﾃｽﾄ中",
  ];

  for (let i = 0; i < strings.length; i++) {
    testString(strings[i], "shift-jis");
  }
});

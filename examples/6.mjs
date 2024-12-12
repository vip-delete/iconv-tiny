import { CP1252 } from "iconv-tiny/encodings/CP1252";

// There are 5 UNDEFINED bytes in CP1252:
const buf = new Uint8Array([0x81, 0x8d, 0x8f, 0x90, 0x9d]);
const cp1252 = CP1252.create();

// If we cannot map a byte or a sequence of bytes to a Unicode character
// then the default character U+FFFD (�) is used.
const str = cp1252.decode(buf);
console.log(str); // �����

// We can change the default character. For example, let's use U+2753.
const red1252 = CP1252.create({ defaultCharUnicode: "❓" });
const output = red1252.decode(buf);
console.log(output); // ❓❓❓❓❓

// default character as be a function.
const indexes = /** @type {Array<number>} */ ([]);
const red = CP1252.create({
  defaultCharUnicode: (input, index) => {
    indexes.push(index);
    return "_".charCodeAt(0); // or null to use 'default'
  },
});
const output2 = red.decode(buf);
console.log(output2); // _____
console.log(JSON.stringify(indexes)); // [0, 1, 2, 3, 4]

// And vice-versa: if we cannot map a Unicode character to a byte or
// a sequence of bytes then a byte 0x3F is used, which maps to U+0063 (?)
const bytes = cp1252.encode("I am ⭐");
console.log(bytes); // [73, 32, 97, 109, 32, 63]
console.log(cp1252.decode(bytes)); // I am ?

// We can use any Unicode character in a range U+0000 - U+00FF.
const cp = CP1252.create({ defaultCharByte: "_" });
const out = cp.encode("I am ⭐");
console.log(out); // [73, 32, 97, 109, 32, 95]
console.log(cp.decode(out)); // I am _!

// defaultCharByte can be a function
const cp2 = CP1252.create({
  defaultCharByte: (input, i) => {
    throw new Error(`Can't encode '${String.fromCharCode(input)}' at position ${i}`); // throw an error to stop encoding
  },
});
try {
  cp2.encode("I am ⭐");
} catch (e) {
  console.error(/** @type {Error} */ (e).message); // Can't encode '⭐' at 5 position
}

// JS strings use UTF-16, and Unicode characters with codes greater than U+FFFF
// take 2 code units (String.length is 2), and encoded into 2 bytes.
// For example, U+1F63C (😼) is [0xD83D, 0xDE3C] in UTF-16.
// Both of the codes (0xD83D and 0xDE3C) are not mapped in CP1252.
const cat = cp1252.encode("😼");
console.log(cat); // [ 63, 63 ]
console.log(cp1252.decode(cat)); // ??

// We can override encoding mappings.
// Let's use unmapped bytes: 0x81 to 0xD83D, 0x8d to 0xDE3C
const enhanced = CP1252.create({ overrides: [0x81, 0xd83d, 0x8d, 0xde3c] });
const kitty = enhanced.encode("😼");
console.log(kitty); // [ 129, 141 ]
console.log(enhanced.decode(kitty)); // 😼

// One more example for U+26A1 (⚡)
const thunder = CP1252.create({ overrides: [0x8f, "⚡"] });
const array = thunder.encode("⚡");
console.log(array); // [ 143 ]
console.log(thunder.decode(array)); // ⚡

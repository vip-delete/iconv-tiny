import { SHIFT_JIS } from "iconv-tiny";

const shiftjis = SHIFT_JIS.create();

const buf = shiftjis.encode("JS はすごい");
const str = shiftjis.decode(buf);
console.log(buf); // [ 74, 83, 32, 130, 205, 130, 183, 130, 178, 130, 162 ]
console.log(str); // JS はすごい

console.log(new TextDecoder("shift-jis").decode(buf)); // JS はすごい

// stream mode (doble-byte sequence is split into two parts and decoder keeps the leftover byte)
const decoder = shiftjis.newDecoder();
const str2 = decoder.decode(buf.subarray(0, buf.length - 3));
const tail = decoder.decode(buf.subarray(buf.length - 3));
console.log(str2); // JS はす
console.log(tail); // ごい

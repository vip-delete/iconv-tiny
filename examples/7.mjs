import { createIconv, UTF8 } from "iconv-tiny";

// UTF-8 decoder always use TextDecoder with { stream: true }

const decoder = UTF8.create().getDecoder();
const p1 = decoder.write(new Uint8Array([226])); // empty
const p2 = decoder.write(new Uint8Array([157])); // empty
const p3 = decoder.write(new Uint8Array([147])); // ❓
console.log([p1, p2, p3].join(",")); // ,,❓

const a1 = decoder.write(new Uint8Array([226])); // empty
const b1 = decoder.write(new Uint8Array([157])); // empty

// same as TextDecoder.decode()
const c1 = decoder.end(); // �
console.log([a1, b1, c1].join(",")); // ,,�

// UTF-8 encoder always use TextEncoder
const encoder = UTF8.create().getEncoder();

// same as TextEncoder.encode("❓")
console.log(encoder.write("❓")); // [ 226, 157, 147 ]

const buf = new Uint8Array(4);
// same as TextEncoder.encodeInto("❓", buf)
console.log(encoder.encodeInto("❓", buf)); // { read: 1, written: 3 }
console.log(buf); // [ 226, 157, 147, 0 ]

// or use IconvTiny
console.log(createIconv({ UTF8 }).encode("❓", "UTF-8")); // [ 226, 157, 147 ]
console.log(createIconv({ UTF8 }).decode(new Uint8Array([226, 157, 147]), "UTF-8")); // ❓

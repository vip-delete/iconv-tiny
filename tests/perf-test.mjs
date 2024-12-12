import iconvLite from "iconv-lite";
import { CP1251 as CP } from "iconv-tiny/encodings/CP1251";

const cp = CP.create();
const runs = 10000;
const kb = 256;

const mb = kb / 1024;
const bytes = kb * 1024;
const buf = new Uint8Array(bytes);
for (let i = 0; i < buf.length; i++) {
  buf[i] = i & 0xff;
}
// eslint-disable-next-line no-undef
const buffer = Buffer.from(buf);

const array = new Uint16Array(buf.length / 2);
for (let i = 0; i < array.length; i++) {
  array[i] = i & 0xffff;
}
const text = Array.from(array)
  .map((c) => String.fromCharCode(c))
  .join("");

/**
 * @param {string} name
 * @param {function():{length:number}} fun
 */
function run(name, fun) {
  const start = Date.now();
  for (let i = 0; i < runs; i++) {
    fun();
  }
  const durationMs = Date.now() - start;
  const mbs = runs * (mb / (durationMs / 1000));
  console.log(`${name}: ${durationMs} ms, ${mbs.toFixed(3)} Mb/s.`);
}

console.log(`\nEncode ${kb}KB text ${runs} times:`);
run("iconv-lite", () => iconvLite.encode(text, "cp1251"));
run("iconv-tiny", () => cp.encode(text));

console.log(`\nDecode ${kb}KB array ${runs} times:`);
run("iconv-lite", () => iconvLite.decode(buffer, "cp1251"));
run("iconv-tiny", () => cp.decode(buf));

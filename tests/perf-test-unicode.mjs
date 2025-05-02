import iconvLite from "iconv-lite";
import { UTF16LE, UTF32LE, UTF8 } from "iconv-tiny/encodings";
import { ALL_SYMBOLS } from "./common.mjs";

const iconvLiteEncoder8 = iconvLite.getEncoder("UTF8");
const iconvLiteDecoder8 = iconvLite.getDecoder("UTF8");
const iconvLiteEncoder16 = iconvLite.getEncoder("UTF-16LE");
const iconvLiteDecoder16 = iconvLite.getDecoder("UTF-16LE");
const iconvLiteEncoder32 = iconvLite.getEncoder("UTF-32LE");
const iconvLiteDecoder32 = iconvLite.getDecoder("UTF-32LE");

const cp8 = UTF8.create();
const encoder8 = cp8.newEncoder();
const decoder8 = cp8.newDecoder();

const cp16 = UTF16LE.create();
const encoder16 = cp16.newEncoder();
const decoder16 = cp16.newDecoder();

const cp32 = UTF32LE.create();
const encoder32 = cp32.newEncoder();
const decoder32 = cp32.newDecoder();

const runs = 200;
const text = ALL_SYMBOLS;

const buf8 = encoder8.encode(text);
const buf16 = encoder16.encode(text);
const buf32 = encoder32.encode(text);

const buffer8 = Buffer.from(buf8);
const buffer16 = Buffer.from(buf16);
const buffer32 = Buffer.from(buf32);

const mb = buf8.length / 1024 / 1024;

/**
 * @param {string} name
 * @param {function():any} func
 * @param {string} [comment]
 */
export function run(name, func, comment) {
  const start = Date.now();
  for (let i = 0; i < runs; i++) {
    func();
  }
  const durationMs = Date.now() - start;
  const mbs = runs * (mb / (durationMs / 1000));
  console.log(`${name}: ${durationMs} ms, ${mbs.toFixed(1)} Mb/s.${comment ?? ""}`);
}

const temp = new Uint8Array(text.length * 4);

console.log(`\nUTF8: Encode:`);
run("iconv-lite", () => iconvLiteEncoder8.write(text));
run("iconv-tiny", () => encoder8.encodeInto(text, temp));

console.log(`\nUTF8: Decode:`);
run("iconv-lite", () => iconvLiteDecoder8.write(buffer8));
run("iconv-tiny", () => decoder8.decode(buf8));

console.log(`\nUTF16: Encode:`);
run("iconv-lite", () => iconvLiteEncoder16.write(text)); // Uses NodeJS's API
run("iconv-tiny", () => encoder16.encodeInto(text, temp));

console.log(`\nUTF16: Decode:`);
run("iconv-lite", () => iconvLiteDecoder16.write(buffer16)); // Uses NodeJS's API
run("iconv-tiny", () => decoder16.decode(buf16));

console.log(`\nUTF32: Encode:`);
run("iconv-lite", () => iconvLiteEncoder32.write(text));
run("iconv-tiny", () => encoder32.encodeInto(text, temp));

console.log(`\nUTF32: Decode:`);
run("iconv-lite", () => iconvLiteDecoder32.write(buffer32));
run("iconv-tiny", () => decoder32.decode(buf32));

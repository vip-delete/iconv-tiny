import iconvLite from "iconv-lite";
import { CP1251 as CP } from "iconv-tiny";

const runs = 1000;
const kb = 256;

const mb = kb / 1024;
const bytes = kb * 1024;
const buf = new Uint8Array(bytes);
for (let i = 0; i < buf.length; i++) {
  buf[i] = i & 0xff;
}
const buffer = Buffer.from(buf);

const array = new Uint16Array(buf.length / 2);
for (let i = 0; i < array.length; i++) {
  array[i] = i & 0xffff;
}
const text = Array.from(array)
  .map((ch) => String.fromCharCode(ch))
  .join("");

/**
 * @param {string} name
 * @param {function():any} func
 * @param {string} [comment]
 */
const run = (name, func, comment) => {
  const start = Date.now();
  for (let i = 0; i < runs; i++) {
    func();
  }
  const durationMs = Date.now() - start;
  const mbs = runs * (mb / (durationMs / 1000));
  console.log(`${name}: ${durationMs} ms, ${mbs.toFixed(1)} Mb/s.${comment ?? ""}`);
};

const iconvLiteEncoder = iconvLite.getEncoder("cp1251");
const iconvLiteDecoder = iconvLite.getDecoder("cp1251");

const cp = CP.create();
const encoder = cp.getEncoder();
const decoder = cp.getDecoder();
const decoderNative = cp.getDecoder({ native: true });
const temp = new Uint8Array(text.length);

// warm-up
// eslint-disable-next-line no-lone-blocks
{
  iconvLiteEncoder.write(text);
  iconvLiteEncoder.end();
  encoder.encodeInto(text, temp);
  encoder.flushInto(temp);
  iconvLiteDecoder.write(buffer);
  iconvLiteDecoder.end();
  decoder.write(buf);
  decoder.end();
}

console.log(`\nCP1251: Encode ${kb}KB text ${runs} times:`);
run("iconv-lite", () => {
  iconvLiteEncoder.write(text);
  iconvLiteEncoder.end();
});
run("iconv-tiny", () => {
  encoder.encodeInto(text, temp);
  encoder.flushInto(temp);
});

console.log(`\nCP1251: Decode ${kb}KB array ${runs} times:`);
run("iconv-lite", () => {
  iconvLiteDecoder.write(buffer);
  iconvLiteDecoder.end();
});
run("iconv-tiny", () => {
  decoder.write(buf);
  decoder.end();
});
run(
  "iconv-tiny",
  () => {
    decoderNative.write(buf);
    decoderNative.end();
  },
  " <--- native:true",
);

import fs from "fs";
import iconvLite from "iconv-lite";
import { CP932 } from "iconv-tiny";
import { Bench } from "tinybench";
import { abs } from "../scripts/commons.mjs";

// there is no original shift-jis in iconv-lite, iconv-lite's shift-jis is CP932 plus EUDC ranges
// it maps 0x8160 to 0xFF5E (FULLWIDTH TILDE)
// original shift-jis maps 0x8160 to 0x301C (WAVE DASH)
// to be consistent use CP932, it is superset of the shift-jis
const shiftJIS = CP932.create();
// const shiftJIS = SHIFT_JIS.create();

// native shift-jis isn't original shift-jis also
const nativeDecoder = new TextDecoder("shift-jis");

/**
 * @param {string} filename
 * @returns {!Uint8Array}
 */
export const readFileSync = (filename) => fs.readFileSync(abs(filename));

// encoding initialization 1
{
  const str1 = "１＋２＝３";
  const buf = shiftJIS.encode(str1);
  const str2 = iconvLite.decode(buf, "cp932");
  const str3 = nativeDecoder.decode(buf);
  if (str1 !== str2 || str2 !== str3) {
    throw new Error("Failed");
  }
}

// encoding initialization 2
const buf = readFileSync("./tests/KOKORO/SJIS.TXT");
const str = nativeDecoder.decode(buf);
{
  const str1 = shiftJIS.decode(buf);
  const str2 = iconvLite.decode(buf, "cp932");
  if (str1 !== str2) {
    if (str1.length !== str2.length) {
      throw new Error(`Length is different: ${str1.length} vs ${str2.length}`);
    }
    for (let i = 0; i < str1.length; i++) {
      const ch1 = str1.charAt(i);
      const ch2 = str2.charAt(i);
      if (ch1 !== ch2) {
        console.error(`Diff at position ${i}: ${ch1} (${ch1.charCodeAt(0).toString(16)}) vs ${ch2} (${ch2.charCodeAt(0).toString(16)})`);
      }
    }
  }
  if (str2 !== str) {
    throw new Error("Failed");
  }
}

const bench = new Bench({ time: 1000 });
bench
  .add("TextDecoder (decode)", () => {
    nativeDecoder.decode(buf);
  })
  .add("iconv-tiny (decode)", () => {
    shiftJIS.decode(buf);
  })
  .add("iconv-lite (decode)", () => {
    iconvLite.decode(buf, "shift-jis");
  })
  .add("iconv-tiny (encode)", () => {
    shiftJIS.encode(str);
  })
  .add("iconv-lite (encode)", () => {
    iconvLite.encode(str, "shift-jis");
  });

await bench.run();
console.table(bench.table());

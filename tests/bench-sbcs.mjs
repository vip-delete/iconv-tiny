import iconvLite from "iconv-lite";
import { aliases, createIconv, encodings } from "iconv-tiny";
import { Bench } from "tinybench";

const buf = new Uint8Array(1024 * 1024);
for (let i = 0; i < buf.length; i++) {
  buf[i] = i & 0xff;
}

const iconvTiny = createIconv(encodings, aliases);
const nativeDecoder = new TextDecoder("cp1251");

const str = nativeDecoder.decode(buf);

// encoding initialization
{
  const str1 = iconvTiny.decode(buf, "cp1251");
  const str2 = iconvLite.decode(buf, "cp1251");
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

const bench = new Bench({ time: 1000 });
bench
  .add("TextDecoder (decode)", () => {
    nativeDecoder.decode(buf);
  })
  .add("iconv-tiny (decode)", () => {
    iconvTiny.decode(buf, "cp1251");
  })
  .add("iconv-lite (decode)", () => {
    iconvLite.decode(buf, "cp1251");
  })
  .add("iconv-tiny (encode)", () => {
    iconvTiny.encode(str, "cp1251");
  })
  .add("iconv-lite (encode)", () => {
    iconvLite.encode(str, "cp1251");
  });

await bench.run();
console.table(bench.table());

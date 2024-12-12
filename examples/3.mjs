import { CP1251 } from "iconv-tiny/encodings/CP1251";
import { CP1252 } from "iconv-tiny/encodings/CP1252";

// A funny example of what happens if encodings are different.
const cp1251 = CP1251.create();
const cp1252 = CP1252.create();
const buf = cp1251.encode("Без алата нема ни заната.");
const str = cp1252.decode(buf);

// Garbled text:
console.log(str); // Áåç àëàòà íåìà íè çàíàòà.

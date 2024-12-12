import { IconvTiny } from "iconv-tiny";
import { CP437 } from "iconv-tiny/encodings/CP437";
import { CP1252 } from "iconv-tiny/encodings/CP1252";
// import { CP437, CP1252 } from "iconv-tiny/encodings";

// Sometimes the size matters and we want to include
// a limited number of encodings to our JS bundle.
const iconv = new IconvTiny({ CP437, CP1252 });
const buf = iconv.encode("░▒▓█▓▒░", "cp437");
console.log(buf); // [176, 177, 178, 219, 178, 177, 176]
console.log(iconv.decode(buf, "cp1252")); // °±²Û²±°
console.log(iconv.decode(buf, "cp437")); // ░▒▓█▓▒░

// it throws: Encoding "maccyrillic" not supported
// console.log(iconv.decode(buf, "MacCyrillic"));

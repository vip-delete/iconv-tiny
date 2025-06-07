import { IconvTiny } from "iconv-tiny";
import { aliases } from "iconv-tiny/aliases";
import * as encodings from "iconv-tiny/encodings";

const iconvTiny = new IconvTiny(encodings, aliases);
const buf = iconvTiny.encode("Hello", "UTF-16");
console.log(buf); // Uint8Array(10) [72, 0, 101, 0, 108, 0, 108, 0, 111, 0]
const str = iconvTiny.decode(buf, "UTF-16");
console.log(str); // Hello

import { IconvTiny, aliases, encodings } from "iconv-tiny";

const iconv = new IconvTiny(encodings, aliases);
const buf = iconv.encode("Hello", "UTF-16");
console.log(buf); // Uint8Array(10) [72, 0, 101, 0, 108, 0, 108, 0, 111, 0]
const str = iconv.decode(buf, "UTF-16");
console.log(str); // Hello

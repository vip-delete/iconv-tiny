import { IconvTiny, aliases, encodings } from "iconv-tiny";

// This is a simple example of the non-direct usage.
// We pass a list of encodings and their aliases.
const iconv = new IconvTiny(encodings, aliases);

// it just works
console.log(iconv.encode("Без муке нема науке", "windows-1251"));
console.log(iconv.encode("Сит гладном не верује", "Windows1251"));
console.log(iconv.encode("Без алата нема ни заната", "cp-1252"));
console.log(iconv.encode("Пожури полако", "MacCyrillic"));
console.log(iconv.encode("Да би био вољен, воли", "ISO8859-1"));

// it throws: Encoding "xyz666" not supported
// console.log(iconv.encode("Hmm", "xyz-666"));

// It works if we add an encoding alias xyz-666 to cp1251
const iconv666 = new IconvTiny(encodings, aliases + ",xyz-666 cp1251");
console.log(iconv666.encode("Hmm", "xyz-666")); // [ 72, 109, 109 ]

// We can specify additions options, for example:

// ... defaultCharByte for "encode"
const buf = iconv666.encode("🧳✈🇺🇸!", "cp1251", { defaultCharByte: "_" });
console.log(buf); // [95, 95, 95, 95, 95, 95, 95, 33]
console.log(iconv666.decode(buf, "cp1251")); // _______!

// ... defaultCharUnicode for "decode"
const unmapped = new Uint8Array([65, 66, 67, 68, 0x81, 0x8d, 0x8f]);
const str2 = iconv666.decode(unmapped, "Windows-1252", { defaultCharUnicode: "⍰" });
console.log(str2); // ABCD⍰⍰⍰

// ... and even funcy overrides
// "🧳✈🇺🇸" is "\uD83E\uDDF3\u2708\uD83C\uDDFA\uD83C\uDDF8" in UTF-16
const overrides = [65, 0xd83e, 66, 0xddf3, 67, 0x2708, 68, 0xd83c, 0x81, 0xddfa, 0x8d, 0xddf8];
const funcy = iconv666.decode(new Uint8Array([65, 66, 67, 68, 0x81, 68, 0x8d]), "Windows-1252", { overrides });
console.log(funcy); // 🧳✈🇺🇸

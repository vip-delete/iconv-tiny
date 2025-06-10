import { CP1251 } from "iconv-tiny";

// CP1251 is for Cyrillic languages: Russian, Serbia, Bulgarian, ...
const cp1251 = CP1251.create();

// Encode and decode a string with cyrillic symbols from Serbian language.
const buf = cp1251.encode("Љубав све побеђује.");
const str = cp1251.decode(buf);
console.log(buf); // [ 138, 243, 225, 224, 226, ... ]

// Serbian Cyrillic also works:
console.log(str); // Љубав све побеђује.

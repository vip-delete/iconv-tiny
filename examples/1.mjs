import { CP1251 } from "iconv-tiny";

// This is a simple example of the direct encoding usage.
// Technically, CP1251 is a "single-byte EncodingFactory" instance.
// Here we create "Encoding" instance. Optionally, we can pass "options", see next examples.
const cp1251 = CP1251.create();

// Encode and decode a string with cyrillic symbols from Russian language.
const buf = cp1251.encode("Век живи — век учись.");
const str = cp1251.decode(buf);
console.log(buf); // [ 194, 229, 234,  32, 230, 232, ... ]

// U+2014 EM DASH is correctly encoded/decoded:
console.log(str); // Век живи — век учись.

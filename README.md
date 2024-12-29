# iconv-tiny

[![ci](https://github.com/vip-delete/iconv-tiny/actions/workflows/ci.yaml/badge.svg)](https://github.com/vip-delete/iconv-tiny/actions/workflows/ci.yaml)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Pure JS ESM Encodings Set for Browser and NodeJS. Auto-Generated from Unicode.org.

**Features**
1. No dependencies.
2. One file per encoding.
3. Extension points to add custom encodings and add/modify symbol mappings (overrides).
4. Graphic Mode ☺. IBM PC memory-mapped symbols for 0-31 control codes.
5. Custom defaultChar or a callback for encode and decode functions.
6. Native TextDecoder for supported encodings (ISO-8859-* and CP125*)
7. Typescript friendly.
8. Tiny: ~400 bytes per encoding, ~24KB of full bundle.mjs, ~9KB in gzip.

## Installation

```
npm install iconv-tiny
```

## Supported encodings:

1. ISO-8859: 1,2,3,4,5,6,7,8,9,10,11,13,14,15,16
2. CP: 037, 424, 437, 500, 737, 775, 850, 852, 855, 856, 857, 860, 861, 862, 863, 864, 865, 866, 869, 874, 875, 1006, 1026, 1250, 1251, 1252, 1253, 1254, 1255, 1256, 1257, 1258
3. MAC: CYRILLIC, GREEK, ICELAND, LATIN2, ROMAN, TURKISH
4. ATARIST, KOI8-R, KOI8-U, KZ1048, NEXTSTEP, US-ASCII

**iconv-tiny** output is identical to **iconv-lite** output, see [tests/regression.test.mjs](tests/regression.test.mjs).

## Example

```javascript
import { CP1251 } from "iconv-tiny/encodings/CP1251";
const cp1251 = CP1251.create();
const buf = cp1251.encode("Век живи — век учись.");
const str = cp1251.decode(buf);
console.log(buf); // [ 194, 229, 234,  32, 230, 232, ... ]
console.log(str); // Век живи — век учись.
```

See more [examples](examples).

## Performance is comparable to that of iconv-lite.

```
Encode 256KB text 10000 times:
iconv-lite: 5232 ms, 477.829 MB/s.
iconv-tiny: 5198 ms, 480.954 MB/s.

Decode 256KB array 10000 times:
iconv-lite: 18008 ms, 138.827 MB/s.
iconv-tiny: 21008 ms, 119.002 MB/s.
iconv-tiny: 12412 ms, 201.418 MB/s. <-- using native TextDecoder
```

```
╔══──--∙·.      .·∙-──────────────────────══════╗
║ ▪   ▄▄·        ▐  ▄ ▌  ▐·▄▄▄▄▄▄ ▪  ▐  ▄·▄· ▄▌ ║
│ ██ ▐█ ▌▪▪     •█▌▐█▪█·▐▌  •██  ██ •█▌▐█ █▪█▌  ║
│ ▐█·██ ▄▄ ▄█▀▄ ▐█▐▐▌ ▐ █ •▄•▐█.▪▐█·▐█▐▐▌ ▐█▪   │
│ ▐█▌▐█ █▌▐█▌.▐▌█▌▐█▌ ▐█▌    ▐█▌·▐█ █▌▐█▌ ▐█·.  │
│ ▀▀▀·▀▀▀  ▀█▄▀▪▀  █▪. ▀     ▀▀▀ ▀▀ ▀  █▪  ▀ •  │
└──────--∙·    ·∙-───────────────by─ViP-DeLeTe──┘
```

[![ci](https://github.com/vip-delete/iconv-tiny/actions/workflows/ci.yaml/badge.svg)](https://github.com/vip-delete/iconv-tiny/actions/workflows/ci.yaml)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Pure JS ESM Encodings Set for Browser and NodeJS. Auto-Generated from http://www.unicode.org/Public/MAPPINGS.

**Features**
1. No dependencies.
2. Encoding mappings overrides. Can be used to display IBM PC memory-mapped symbols for 0-31 control codes.
3. DefaultChar override.
4. Native TextDecoder for supported encodings (ISO-8859-* and windows-125*)
5. Typescript friendly.
6. Tiny: ~400 bytes per encoding, ~24KB of full bundle.mjs, ~9KB in gzip.

## Installation

```
npm install iconv-tiny
```

```javascript
import { IconvTiny } from "iconv-tiny";
import { aliases } from "iconv-tiny/aliases";
import * as encodings from "iconv-tiny/encodings";

const iconvTiny = new IconvTiny(encodings, aliases);
const buf = iconvTiny.encode("Hello", "UTF-16");
console.log(buf); // Uint8Array(10) [72, 0, 101, 0, 108, 0, 108, 0, 111, 0]
const str = iconvTiny.decode(buf, "UTF-16");
console.log(str); // Hello
```

or directly import from CDN without installation:
```javascript
import { IconvTiny, aliases, encodings } from "https://unpkg.com/iconv-tiny@1.1.0/dist/iconv-tiny.bundle.mjs";
const iconv = new IconvTiny(encodings, aliases);
const buf = iconv.encode("Le malheur est notre plus grand maître.", "cp1252")
...
```

or import encodings individually:
```javascript
import { CP1251 } from "https://unpkg.com/iconv-tiny@1.1.0/dist/iconv-tiny.bundle.mjs";
const cp1251 = CP1251.create();
const buf = cp1251.encode("Век живи — век учись.");
const str = cp1251.decode(buf);
console.log(buf); // [ 194, 229, 234,  32, 230, 232, ... ]
console.log(str); // Век живи — век учись.
```

See more [examples](examples).

## Commands

Build:
```
npm run build
```
Note: You need JDK 21 or higher installed to compile the source code using the Google Closure Compiler.

Run tests:
```
npm run test
```

Run Coverage:
```
npm run coverage
```

Start UI:
```
npm run dev
```

## Supported encodings:

1. **ISO-8859**: 1,2,3,4,5,6,7,8,9,10,11,13,14,15,16
2. **EBCDIC**: Cp037, Cp500, Cp875, Cp1026
3. **DOS**: Cp437, Cp737, Cp775, Cp850, Cp852, Cp855, Cp857, Cp860, Cp861, Cp862, Cp863, Cp864, Cp865, Cp866, Cp869, Cp874
2. **WINDOWS**: Cp1250, Cp1251, Cp1252, Cp1253, Cp1254, Cp1255, Cp1256, Cp1257, Cp1258
3. **MAC**: CYRILLIC, GREEK, ICELAND, LATIN2, ROMAN, TURKISH
4. **MISC**: ATARIST, Cp424, CP856, Cp1006, KOI8-R, KOI8-U, KZ1048, NEXTSTEP
5. **OTHER**: US-ASCII
6. **UNICODE**: UTF-8, UTF-16, UTF-32

**iconv-tiny** output is identical to **iconv-lite** output, see [tests/regression.test.mjs](tests/regression.test.mjs).

## BOM Handling
1. UTF-8, UTF-16LE, UTF-16BE, UTF-32LE, UTF-32BE:
   - Decoding: BOM is stripped by default, unless overridden by `stripBOM: false` option.
   - Encoding: No BOM added, unless overridden by `addBOM: true` option.
2. UTF-16 is an alias of UTF-16LE
3. UTF-32 is an alias of UTF-32LE

## Performance

iconv-tiny vs iconv-lite
1. iconv-tiny is Browser oriented and doesn't use any NodeJS specific API like Buffer.
2. iconv-tiny can use native TextDecoder by `native: true` option.
3. iconv-tiny supports `encodeInto(Uint8Array)`, and there are no memory allocations.
4. iconv-lite uses NodeJS API and much faster for UTF-16 Encode/Decode in Node.
5. iconv-lite uses NodeJS's Buffer, but iconv-tiny uses Uint8Array.

Below are the tests in NodeJS:

```
/> node tests/perf-test-cp1251.mjs

Encode 256KB text 10000 times:
iconv-lite: 4837 ms, 516.8 Mb/s.
iconv-tiny: 4228 ms, 591.3 Mb/s.

Decode 256KB array 10000 times:
iconv-lite: 17314 ms, 144.4 Mb/s.
iconv-tiny: 20400 ms, 122.5 Mb/s.
iconv-tiny: 11530 ms, 216.8 Mb/s. <--- native: true

/> node tests/perf-test-unicode.mjs
UTF8: Encode:
iconv-lite: 4097 ms, 204.0 Mb/s.
iconv-tiny: 1668 ms, 501.1 Mb/s. <-- TextEncoder

UTF8: Decode:
iconv-lite: 7103 ms, 117.7 Mb/s.
iconv-tiny: 2960 ms, 282.4 Mb/s. <-- TextEncoder

UTF16: Encode:
iconv-lite: 262 ms, 3190.5 Mb/s. <-- NodeJS API
iconv-tiny: 6130 ms, 136.4 Mb/s. <-- "software" encode

UTF16: Decode:
iconv-lite: 328 ms, 2548.5 Mb/s. <-- NodeJS API
iconv-tiny: 1103 ms, 757.9 Mb/s. <-- TextDecoder

UTF32: Encode:
iconv-lite: 12391 ms, 67.5 Mb/s.
iconv-tiny: 5787 ms, 144.4 Mb/s.

UTF32: Decode:
iconv-lite: 3856 ms, 216.8 Mb/s.
iconv-tiny: 4494 ms, 186.0 Mb/s. <-- "software" decode
```

## Demo

https://vip-delete.github.io/iconv-tiny/

<img src="demo.png" width="50%">

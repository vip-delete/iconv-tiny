# Changelog

## [1.4.1] - 2026-01-18

* Add Encodings from https://encoding.spec.whatwg.org/

## [1.4.0] - 2026-01-07

* Make API similar to iconv-lite

## [1.3.0] - 2026-01-05

* add JIS-0201, SHIFT-JIS and CP932

## [1.2.2] - 2025-07-12

* fix byteLength

## [1.2.1] - 2025-06-14

* fix package.json

## [1.2.0] - 2025-06-14

* Make Closure Compiler optional, Add ESBuild and produce [**iconv-tiny.mjs**](dist/iconv-tiny.mjs) only.

## [1.1.1] - 2025-06-07

* Add Unicode support: UTF-8, UTF-16, UTF-32
* Add methods: `IconvTiny.getEncoding`, `Encoding.newDecoder`, `Encoding.newEncoder`, `CharsetEncoder.byteLength`.
* Move `nativeDecode` and `defaultCharUnicode` options to `DecoderOptions`.
* Move `defaultCharByte` option to `EncoderOptions`.
* Delete `strictDecode` option: always use TextDecoder to convert Uint16Array to string.
* Delete `graphicMode` and `graphics` options. They can be emulated by overrides.

## [1.0.1] - 2025-04-26

* Add UI

## [1.0.0] - 2025-01-01

* Initial release

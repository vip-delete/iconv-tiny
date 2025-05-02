# Changelog

## [1.1.0] - 2025-06-07

* Add Unicode support: UTF-8, UTF-16, UTF-32
* Add methods: `IconvTiny.getEncoding`, `Encoding.newDecoder`, `Encoding.newEncoder`.
* Move `nativeDecode` and `defaultCharUnicode` options to `DecoderOptions`.
* Move `defaultCharByte` option to `EncoderOptions`.
* Delete `strictDecode` option: always use TextDecoder to convert Uint16Array to string.
* Delete `graphicMode` and `graphics` options. They can be emulated by overrides.

## [1.0.1] - 2025-04-26

* Add UI

## [1.0.0] - 2025-01-01

* Initial release

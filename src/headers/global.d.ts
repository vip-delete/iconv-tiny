/**
 * @file Just to help TS to validate our JS files in IDE using JSDoc comments.
 */

/**
 * @see {@link file://./enc-externs.mjs}
 */
declare namespace encNS {
  interface Encoding {
    decode(array: Uint8Array): string;
    encode(text: string): Uint8Array;
  }

  interface EncodingFactory {
    create(options?: encNS.Options): encNS.Encoding;
  }

  type Overrides = Array<number | string>;

  type DefaultCharFunction = (input: number, index: number) => number | null;

  type Options = {
    defaultCharByte?: string | DefaultCharFunction;
    defaultCharUnicode?: string | DefaultCharFunction;
    overrides?: Overrides;
    graphics?: string;
    graphicMode?: boolean;
    nativeDecode?: boolean;
    strictDecode?: boolean;
  };
}

/**
 * @see {@link file://./sbe-externs.mjs}
 */
declare namespace sbeNS {}

/**
 * @see {@link file://./iconv-tiny-externs.mjs}
 */
declare namespace iconvTinyNS {
  interface IconvTiny {
    decode(buffer: Uint8Array, encoding: string, options?: encNS.Options): string;
    encode(content: string, encoding: string, options?: encNS.Options): Uint8Array;
  }
}

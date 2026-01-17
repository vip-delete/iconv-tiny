/* global describe, it */
import { expect } from "chai";
import { aliases, createIconv, encodings } from "iconv-tiny";

// https://github.com/whatwg/encoding/blob/main/encodings.json
import whatwgEncodingsJson from "./whatwg.encodings.json" with { type: "json" };

const iconvTiny = createIconv(encodings, aliases);

/**
 * @typedef {(bytes: !Uint8Array, encoding: string) => string} DecodeFn
 */
/**
 * @typedef {(content: string, encoding: string) => !Uint8Array} EncodeFn
 */

/**
 * @type {!DecodeFn}
 */
const decodeWHATWG = (bytes, encoding) => new TextDecoder(encoding).decode(bytes);

/**
 * @type {!DecodeFn}
 */
const iconvTinyDecode = (bytes, encoding) => iconvTiny.decode(bytes, encoding);

/**
 * @type {!EncodeFn}
 */
const iconvTinyEncode = (content, encoding) => iconvTiny.encode(content, encoding);

/**
 * @param {!Uint8Array} bytes
 * @param {string} name
 */
const compare = (bytes, name) => {
  const expected = decodeWHATWG(bytes, name);
  const actual = iconvTinyDecode(bytes, name);
  expect(actual).to.equal(expected);

  const unknowns = [];
  for (let j = 0; j < 255; j++) {
    if (expected.charCodeAt(j) === 0xfffd) {
      unknowns.push(j);
    }
  }

  const actualBytes = iconvTinyEncode(actual, name);
  // there are ? at unknown places: replace them
  for (const j of unknowns) {
    actualBytes[j] = j;
  }

  expect(actualBytes).to.deep.equal(bytes);
};

describe("Legacy single-byte encodings", () => {
  const whatwgEncodings = whatwgEncodingsJson.filter((it) => it.heading === "Legacy single-byte encodings").flatMap((it) => it.encodings);

  const bytes = new Uint8Array(255);
  for (let i = 0; i < 255; i++) {
    bytes[i] = i;
  }

  for (const whatwgEncoding of whatwgEncodings) {
    const name = whatwgEncoding.name;
    const labels = whatwgEncoding.labels;
    it(name, () => {
      compare(bytes, name);
      for (const label of labels) {
        compare(bytes, label);
      }
    });
  }
});

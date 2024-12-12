/**
 * @typedef {import("../types/sbe.mjs").SBEF} SBEF
 */

import { canonicalize } from "../src/iconv-tiny.mjs";

/**
 * @param {{[key:string]:function(*):void}} tests
 * @param {{[key:string]:*}} encodings
 */
export function testEncodings(tests, encodings) {
  const map = new Map();
  for (const [key, value] of Object.entries(encodings)) {
    map.set(canonicalize(key), value);
  }
  for (const key of Object.keys(tests)) {
    if (key.startsWith("test")) {
      const name = canonicalize(key.slice("test".length));
      const cp = map.get(name);
      tests[key](cp);
    }
  }
}

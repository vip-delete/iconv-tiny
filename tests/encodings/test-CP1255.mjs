import { CP1255 as CP } from "iconv-tiny/encodings";
import { expect, test } from "vitest";

test("CP1255", () => {
  const cp = CP.create();
  expect(cp.decode(new Uint8Array([0xca])).charCodeAt(0)).toBe(0x05ba);
});

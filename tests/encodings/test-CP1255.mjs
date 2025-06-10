import { CP1255 } from "iconv-tiny";
import { expect, test } from "vitest";

test("CP1255", () => {
  const cp = CP1255.create();
  expect(cp.decode(new Uint8Array([0xca])).charCodeAt(0)).toBe(0x05ba);
});

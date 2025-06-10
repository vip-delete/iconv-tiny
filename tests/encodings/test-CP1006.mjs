import { CP1006 } from "iconv-tiny";
import { expect, test } from "vitest";

test("CP1006", () => {
  const cp = CP1006.create();
  // https://www.unicode.org/Public/MAPPINGS/VENDORS/MISC/CP1006.TXT
  // ...
  // 0xB1 0xFE8E # ARABIC LETTER ALEF FINAL FORM
  // 0xB2 0xFE8E # ARABIC LETTER ALEF FINAL FORM
  // ...
  expect(cp.decode(new Uint8Array([0xb1]))).toBe("\ufe8e");
  expect(cp.decode(new Uint8Array([0xb2]))).toBe("\ufe8e");
  expect(cp.encode("\ufe8e")[0]).toBe(0xb2);
});

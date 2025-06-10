import { CP875 } from "iconv-tiny";
import { expect, test } from "vitest";

test("CP875", () => {
  const cp = CP875.create();
  expect(cp.decode(new Uint8Array([0xe1, 0xfc, 0xec]))).toBe("₯€ͺ");
  expect(cp.decode(new Uint8Array([0xfd]), { native: true })).toBe("�");
});

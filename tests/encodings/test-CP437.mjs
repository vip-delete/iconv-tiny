import { CP437 } from "iconv-tiny";
import { expect, test } from "vitest";

test("CP437", () => {
  const cp = CP437.create();
  expect(cp.getName()).toBe("CP437");
  expect(cp.decode(new Uint8Array([0, 1, 2]))).toBe("\x00\x01\x02");
});

test("CP437 graphic mode", () => {
  const graphics = " ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼";
  const overrides = [];
  for (let i = 0; i < graphics.length; i++) {
    overrides.push(i);
    overrides.push(graphics[i]);
  }
  const cp = CP437.create({ overrides });
  expect(cp.decode(new Uint8Array([0, 1, 2, 3, 4]))).toBe(" ☺☻♥♦");
});

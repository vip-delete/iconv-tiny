import { aliases } from "iconv-tiny/aliases";
import * as encodings from "iconv-tiny/encodings";
import { expect, test } from "vitest";
import { CP1251 } from "../src/encodings/CP1251.mjs";
import { ISO_8859_15 } from "../src/encodings/index.mjs";
import { IconvTiny, canonicalize } from "../src/iconv-tiny.mjs";

test("canonicalize", () => {
  expect(canonicalize("Windows-1251")).toBe("windows1251");
  expect(canonicalize("CP1251")).toBe("cp1251");
  expect(canonicalize("UTF-8")).toBe("utf8");
  expect(canonicalize("u.t.f-008")).toBe("utf8");
  expect(canonicalize("utf-80")).toBe("utf80");
  expect(canonicalize("iso-ir-9-1")).toBe(canonicalize("isoir91"));
  expect(canonicalize("iso-ir-9-1")).toBe(canonicalize("iso-ir-91"));
  expect(canonicalize("iso-ir-9-2!")).toBe(canonicalize("isoir92"));
  expect(canonicalize("iso-ir-9-2!")).toBe(canonicalize("iso-ir-92!"));
});

test("iconvTiny", () => {
  const iconvTiny = new IconvTiny(encodings, aliases + ",xyz-666 cp1251");
  expect(iconvTiny.encode("Љубав", "xyz-666")).toStrictEqual(new Uint8Array([138, 243, 225, 224, 226]));
  expect(() => iconvTiny.encode("Љубав", "xyz")).toThrow(`Encoding "xyz" not supported`);
  expect(iconvTiny.decode(new Uint8Array([0xa6]), "latin1")).toBe("\xA6");
});

test("iconvTiny 2", () => {
  const iconvTiny = new IconvTiny({ CP1251, ISO_8859_15 });
  expect(iconvTiny.decode(new Uint8Array([164]), "iso8859-15")).toBe("€");
  expect(iconvTiny.decode(new Uint8Array([190]), "iso-885915")).toBe("Ÿ");
});

test("iconvTiny strict flag", () => {
  const iconvTiny = new IconvTiny({ CP1251, ISO_8859_15 });
  const overrides = [1, 0xd7ff, 2, 0xd800, 3, 0xd801, 4, 0xd802];
  const buf = new Uint8Array([1, 2, 3, 4]);
  const fastMode = iconvTiny.decode(buf, "iso8859-15", { overrides, strictDecode: false });
  const strictMode = iconvTiny.decode(buf, "iso8859-15", { overrides, strictDecode: true });
  const defaultMode = iconvTiny.decode(buf, "iso8859-15", { overrides });
  const noOverrides = iconvTiny.decode(buf, "iso8859-15");

  expect(fastMode).toBe("\ud7ff\ufffd\ufffd\ufffd");
  expect(strictMode).toBe("\ud7ff\ud800\ud801\ud802");
  expect(defaultMode).toBe(fastMode);
  expect(noOverrides).toStrictEqual("\x01\x02\x03\x04");
});

test("grapheme cluster", () => {
  const R = "🇷"; // \uD83C\uDDF7
  const S = "🇸"; // \uD83C\uDDF8
  const RS = "🇷🇸"; // \uD83C\uDDF7\uD83C\uDDF8
  expect(R + S).toBe(RS);
  const buf = new Uint8Array([0x81, 0x8d, 0x81, 0x8f]);
  const overrides = [0x81, "\uD83C", 0x8d, "\uDDF7", 0x8f, "\uDDF8"];
  const cp = CP1251.create({ overrides });
  expect(cp.decode(buf)).toBe(RS);
  expect(cp.encode(RS)).toStrictEqual(buf);
});

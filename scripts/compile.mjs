import { compile, getHeader, readFileSync, writeFileSync } from "./commons.mjs";

const HEADER = getHeader();

const DO_REPLACEMENT = false;

await compile(
  "runtime",
  "src/wrapper.txt",
  "dist/iconv-tiny.runtime.mjs",
  [
    //
    "src/externs.mjs",
    "src/commons.mjs",
    "src/cs.mjs",
    "src/sbcs.mjs",
    "src/unicode.mjs",
    "src/iconv-tiny.mjs",
    "src/exports.mjs",
  ],
  "BROWSER",
);

if (DO_REPLACEMENT) {
  const replacements = [
    // from        to  bytes
    ["Uint8Array", "A", 17],
    ["Uint16Array", "B", 14],
    ["TextDecoder", "C", 14],
    ["charCodeAt", "z", 48],
  ];
  const prepend = "let A=Uint8Array,B=Uint16Array,C=TextDecoder;String.prototype.z=String.prototype.charCodeAt;\n";
  let runtime = readFileSync("dist/iconv-tiny.runtime.mjs");
  const sizeBefore = runtime.length;
  for (const replacement of replacements) {
    const from = /** @type {string} */ (replacement[0]);
    const to = /** @type {string} */ (replacement[1]);
    const size = /** @type {number} */ (replacement[2]);
    const before = runtime.length;
    runtime = runtime.replaceAll(from, to);
    const after = runtime.length;
    console.log(`Replace: ${from} -> ${to}, bytes saved: ${before - after - size}`);
  }
  runtime = prepend + runtime;
  const sizeAfter = runtime.length;
  console.log(`Total bytes saved: ${sizeBefore - sizeAfter}`);
  writeFileSync("dist/iconv-tiny.runtime.mjs", runtime);
}

const lines = readFileSync("src/global.d.ts").split(/\r\n|\n/u);
const arr = [];
for (const line of lines) {
  if (line.length === 0) {
    arr.push(line);
  } else if (line.startsWith("  ")) {
    arr.push(line.slice(2));
  }
}
writeFileSync("dist/iconv-tiny.runtime.d.mts", HEADER + arr.join("\n"));

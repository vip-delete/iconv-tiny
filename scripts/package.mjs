import { copyFileSync, getHeader, getIdentifier, readFileSync, writeFileSync } from "./commons.mjs";

const HEADER = getHeader();

const config = JSON.parse(readFileSync("scripts/config.json"));

// set encoding names to package into bundle.mjs
const names = ["US-ASCII"];
for (const cfg of config.encodings.sbcs) {
  for (const id of Object.keys(cfg.ids)) {
    names.push(cfg.name.replaceAll("{ID}", id));
  }
}

const result = [];
result.push(read("dist/sbe.mjs"));
result.push(read("dist/iconv-tiny.mjs"));
result.push(
  ...names.map((name) =>
    read(`dist/encodings/${name}.mjs`)
      .split("\n")
      .filter((it) => it.startsWith("export "))
      .join("\n"),
  ),
);
result.push(`export const encodings = {${names.map((it) => getIdentifier(it)).join(",")}}`);
result.push(read("dist/aliases.mjs"));
writeFileSync("dist/iconv-tiny.bundle.mjs", HEADER + "// @ts-nocheck\n" + result.join("\n") + "\n");
copyFileSync("dist/iconv-tiny.bundle.mjs", "public/iconv-tiny.bundle.mjs");

/**
 * @param {string} filename
 * @returns {string}
 */
function read(filename) {
  let content = readFileSync(filename);
  if (content.startsWith(HEADER)) {
    content = content.slice(HEADER.length);
  }
  return content.trim();
}

import fs from "fs";

import Path from "path";
import { fileURLToPath } from "url";
import pkg from "../package.json" with { type: "json" };

export const getBanner = () =>
  `/**
 * iconv-tiny v${pkg.version}
 * (c) 2025-present ${pkg.author}
 * @license ${pkg.license}
 **/
`;

/**
 * @param {string} rel
 * @returns {string}
 */
export const abs = (rel) => Path.resolve(Path.dirname(fileURLToPath(import.meta.url)), "../" + rel);

/**
 * @param {string} filename
 * @returns {string}
 */
export const readFileSync = (filename) => fs.readFileSync(abs(filename), "utf-8");

/**
 * @param {string} name
 * @returns {string}
 */
export const getIdentifier = (name) => name.replaceAll("-", "_").replaceAll(/[^0-9A-Z_]/gu, "");

/**
 * @param {string} path
 * @returns {!string}
 */
export const getExports = (path) => {
  const exports = readFileSync(path)
    .split("\n")
    .filter((it) => it.startsWith("export"))
    .flatMap((it) => {
      const i = it.indexOf("{");
      const j = it.indexOf("}", i + 1);
      if (i !== -1 && j !== -1) {
        return it
          .slice(i + 1, j)
          .split(",")
          .map((item) => item.trim());
      }
      return [];
    });

  return "{" + exports.join(",") + "}";
};

/**
 * @param {string} src
 * @param {string} dest
 */
export const copyFileSync = (src, dest) => {
  fs.copyFileSync(abs(src), abs(dest));
};

/**
 * @param {string} path
 * @returns {boolean}
 */
export const existsSync = (path) => fs.existsSync(abs(path));

/**
 * @param {string} dir
 * @returns {undefined}
 */
export const mkdirSync = (dir) => {
  if (!fs.existsSync(abs(dir))) {
    console.log(`MKDIR:  ${dir}`);
    fs.mkdirSync(abs(dir), { recursive: true });
  }
};

/**
 * @param {string} filename
 * @param {string|Uint8Array} content
 * @returns {undefined}
 */
export const writeFileSync = (filename, content) => {
  console.log(`WRITE:  ${filename}`);
  fs.writeFileSync(abs(filename), content);
};

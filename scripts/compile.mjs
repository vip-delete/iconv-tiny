import { compile, copyFileSync } from "./commons.mjs";

const USE_CLOSURE_COMPILER = true;

if (USE_CLOSURE_COMPILER) {
  await compile(
    "sbe",
    `src/headers/sbe-wrapper.txt`,
    `dist/sbe.mjs`,
    [
      //
      "src/headers/enc-externs.mjs",
      "src/headers/sbe-externs.mjs",
      "src/commons.mjs",
      "src/sbe.mjs",
      "src/headers/sbe-exports.mjs",
    ],
    "BROWSER",
  );

  await compile(
    "iconv-tiny",
    `src/headers/iconv-tiny-wrapper.txt`,
    `dist/iconv-tiny.mjs`,
    [
      //
      "src/headers/enc-externs.mjs",
      "src/headers/sbe-externs.mjs",
      "src/headers/iconv-tiny-externs.mjs",
      "src/iconv-tiny.mjs",
      "src/headers/iconv-tiny-exports.mjs",
    ],
    "BROWSER",
  );
} else {
  [
    //
    "commons.mjs",
    "sbe.mjs",
    "iconv-tiny.mjs",
  ].forEach((it) => {
    copyFileSync(`src/${it}`, `dist/${it}`);
  });
}

import { compile, getExports, writeFileSync } from "./commons.mjs";

const exports = getExports("src/index.mjs");

writeFileSync("./dist/exports.mjs", `import ${exports} from "../src/index.mjs";\nns = ${exports};\n`);
const outputWrapper = `let ns;\n%output%\nexport const ${exports}=ns;\n`;

await compile("app", outputWrapper, "dist/cc.mjs", [
  "src/externs.mjs",
  "src/commons.mjs",
  "src/sbcs.mjs",
  "src/unicode.mjs",
  "src/iconv-tiny.mjs",
  "src/index.mjs",
  "dist/exports.mjs",
]);

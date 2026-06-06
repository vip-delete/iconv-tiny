import { compiler as Compiler } from "google-closure-compiler";
import { abs, getExports, readFileSync, writeFileSync } from "./commons.mjs";

/**
 * @param {string} name
 * @param {string} outputFile
 * @param {!Array<string>} files
 */
const compile = async (name, outputFile, files) => {
  const args = {
    moduleResolution: "BROWSER",
    compilationLevel: "ADVANCED",
    warningLevel: "VERBOSE",
    jscompError: "*",
    jscompWarning: "reportUnknownTypes",
    assumeFunctionWrapper: true,
    summaryDetailLevel: String(3),
    languageIn: "ES_NEXT",
    useTypesForOptimization: true,
    define: [],
    jsOutputFile: abs(outputFile),
    charset: "utf-8",
    js: files.map(abs),
  };

  await new Promise((resolve, reject) => {
    new Compiler(args).run((exitCode, stdout, stderr) => {
      if (stdout) {
        console.log(stdout);
      }

      if (stderr) {
        console.log(stderr);
      }

      if (exitCode === 0 && !(stderr.includes("0 error(s)") && stderr.includes("0 warning(s)"))) {
        reject(new Error("Need 0 errors and warnings"));
      }

      if (exitCode === 0) {
        resolve(null);
      } else {
        reject(new Error(`Exit code ${exitCode}`));
      }
    });
  });

  console.log(`\x1b[33m${name.toUpperCase()}\x1b[0m: \x1b[92mBUILD SUCCESSFUL\x1b[0m: ${outputFile}\n`);
};

const exports = getExports("src/index.mjs");
writeFileSync("./dist/exports.mjs", `import { ${exports.join(", ")} } from "../src/index.mjs";\n${exports.map((it) => `iconvtiny.${it} = ${it};\n`).join("")}`);

await compile("app", "dist/cc.mjs", [
  "src/externs.mjs",
  "src/iconv.mjs",
  "src/types.mjs",
  "src/commons.mjs",
  "src/native.mjs",
  "src/mapped.mjs",
  "src/sbcs.mjs",
  "src/dbcs.mjs",
  "src/unicode.mjs",
  "src/utf8.mjs",
  "src/utf16.mjs",
  "src/utf32.mjs",
  "src/index.mjs",
  "dist/exports.mjs",
]);

/**
 * @param {string} match
 * @param {string} name
 * @returns {string}
 */
const replacer = (match, name) => ("\n" + (name[0] === name[0].toUpperCase() ? "" : "export ") + "const " + name);

const filename = `dist/cc.mjs`;
const ident = "(?<name>[A-Za-z_$][A-Za-z0-9_$]*)";
const regexp = "iconvtiny\\." + ident;

const min = readFileSync(filename) //
  .replace(new RegExp("\\n" + regexp, "gu"), replacer)
  .replace(new RegExp(regexp, "gu"), replacer);

writeFileSync(filename, min);

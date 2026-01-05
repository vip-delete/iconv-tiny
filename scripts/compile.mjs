import { compiler as Compiler } from "google-closure-compiler";
import { abs, getExports, writeFileSync } from "./commons.mjs";

/**
 * @param {string} name
 * @param {string} outputWrapper
 * @param {string} outputFile
 * @param {!Array<string>} files
 */
const compile = async (name, outputWrapper, outputFile, files) => {
  const args = {
    /* eslint-disable camelcase */
    module_resolution: "BROWSER",
    compilation_level: "ADVANCED",
    warning_level: "VERBOSE",
    jscomp_error: "*",
    jscomp_warning: "reportUnknownTypes",
    assume_function_wrapper: true,
    output_wrapper: outputWrapper,
    summary_detail_level: String(3),
    language_in: "ES_NEXT",
    use_types_for_optimization: true,
    define: [],
    js_output_file: abs(outputFile),
    charset: "utf-8",
    js: files.map(abs),
    /* eslint-enable camelcase */
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

/**
 * @param {string} it
 * @returns {boolean}
 */
const functionFilter = (it) => it.charAt(0) !== it.charAt(0).toUpperCase();

const exports = getExports("src/index.mjs");
writeFileSync("./dist/exports.mjs", `import { ${exports.join(", ")} } from "../src/index.mjs";\n${exports.map((it) => `ns.${it} = ${it};\n`).join("")}`);

// re-export functions only
const outputWrapper = `const ns = {};\n{\n%output%\n}\nexport const { ${exports.filter(functionFilter).join(", ")} } = ns;\nconst { ${exports.filter((it) => !functionFilter(it)).join(", ")} } = ns;\n`;

await compile("app", outputWrapper, "dist/cc.mjs", [
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

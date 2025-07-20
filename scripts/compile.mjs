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

      if (exitCode === 0 && !stderr.includes("100.0%")) {
        reject(new Error("Need 100% type coverage"));
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

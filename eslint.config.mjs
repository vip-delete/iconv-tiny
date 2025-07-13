import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  js.configs.all,
  jsdoc.configs["flat/recommended"],
  stylistic.configs.customize({
    quotes: "double",
    semi: true,
  }),
  {
    ignores: ["dist", "static", "src/externs.mjs"],
  },
  {
    languageOptions: {
      globals: {
        process: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        console: "readonly",
        ns: "writable",
      },
    },
    plugins: {
      "@stylistic": stylistic,
      jsdoc,
    },
    rules: {
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "@stylistic/indent": ["error", 2],
      "capitalized-comments": 0,
      "id-length": ["error", { exceptions: ["e", "i", "j", "k"] }],
      "jsdoc/require-param-description": 0,
      "jsdoc/require-returns-description": 0,
      "max-classes-per-file": 0,
      "max-lines": 0,
      "max-lines-per-function": ["error", 100],
      "max-params": ["error", 10],
      "max-statements": ["error", 100],
      "no-bitwise": 0,
      "no-console": 0,
      "no-inline-comments": 0,
      "no-magic-numbers": 0,
      "no-param-reassign": 0,
      "no-plusplus": 0,
      "no-ternary": 0,
      "one-var": 0,
      "prefer-destructuring": 0,
      "prefer-template": 0,
      "sort-keys": 0,
      "sort-imports": 0,
    },
    settings: {
      jsdoc: { mode: "closure" },
    },
  },
];

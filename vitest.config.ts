import { configDefaults, coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      ...configDefaults.include,
      // ignore coverage.mjs, but include if call explicitly
      ...(process.argv.includes('coverage.mjs') ? ['**/coverage.mjs'] : [])
    ],
    coverage: {
      provider: "istanbul",
      reporter: ["text"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "examples",
        "static",
        "scripts",
        "temp",
        "src/exports.mjs",
        "src/externs.mjs",
      ],
    },
  },
});

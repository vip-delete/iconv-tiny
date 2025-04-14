import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html"],
      exclude: [
        "examples",
        "static",
        "scripts",
        "types",
        "temp",
        "src/encodings",
        "src/headers",
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});

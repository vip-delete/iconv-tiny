import { vi } from "vitest";

// use source code runtime to calculate coverage
vi.mock("iconv-tiny", async () => await import("./src.runtime.mjs"));

import "./encodings/index.mjs";

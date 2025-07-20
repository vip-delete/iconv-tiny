import { vi } from "vitest";

if (process.env.NODE_ENV === "development") {
  vi.mock("iconv-tiny", () => import("../dist/main.mjs"));
}

import "./test-iconv-tiny.mjs";
import "./test-sbcs.mjs";
import "./test-unicode.mjs";

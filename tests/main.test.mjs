import { vi } from "vitest";

if (process.env.NODE_ENV === "development") {
  vi.mock("iconv-tiny", () => import("../dist/main.mjs"));
}

import "./test-sbcs-mappings.mjs";
import "./test-dbcs-mappings.mjs";
import "./test-iconv-tiny.mjs";
import "./test-sbcs.mjs";
import "./test-dbcs.mjs";
import "./test-unicode.mjs";

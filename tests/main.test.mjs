import { vi } from "vitest";

if (process.env.NODE_ENV === "development") {
  vi.mock("iconv-tiny", () => import("../dist/main.mjs"));
}

import "./encodings/index.mjs";

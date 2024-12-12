import { mkdirSync, readFileSync } from "./commons.mjs";
import { generateSBE } from "./gen-sbe.mjs";

mkdirSync("src/encodings");
mkdirSync("dist/encodings");
mkdirSync("temp");

const config = JSON.parse(readFileSync("scripts/config.json"));
await generateSBE(config);

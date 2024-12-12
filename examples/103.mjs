const cache = new Map();

/**
 * @param {string} encoding
 * @returns {Promise<import("../types/iconv-tiny.mjs").Encoding>}
 */
async function getEncodingAsync(encoding) {
  let cp = cache.get(encoding);
  if (!cp) {
    console.log("Fetching");
    const module = await import(`iconv-tiny/encodings/${encoding}`);
    cp = module[encoding].create();
    cache.set(encoding, cp);
  }
  return cp;
}

// load encoding on demand
const cp = await getEncodingAsync("CP437"); // Fetching
const cp1 = await getEncodingAsync("CP437"); // Use Cache
console.log(cp === cp1);
const buf = cp.encode("░▒▓█▓▒░");
console.log(buf); // [176, 177, 178, 219, 178, 177, 176]

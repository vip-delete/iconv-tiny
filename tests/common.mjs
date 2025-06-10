const codePointGenerator = function* codePointGenerator() {
  for (let i = 0; i < 0xd800; i++) {
    yield String.fromCodePoint(i);
  }
  for (let i = 0xe000; i < 0x110000; i++) {
    yield String.fromCodePoint(i);
  }
};

const getAllSymbols = () => {
  const chars = [];
  for (const ch of codePointGenerator()) {
    chars.push(ch);
  }
  return chars.join("");
};

export const ALL_SYMBOLS = getAllSymbols();

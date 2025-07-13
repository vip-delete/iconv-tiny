import { CP437, CP864 } from "iconv-tiny";

// A range 0x00..0x1F is mapped to Unicode "as-is":
// 0 (NULL) to U+0000, 9 (TAB) to U+0009, ...
// Sometimes it worth showing them in graphic context:
// 0 to U+0020 (SPACE), 1 to U+263A (☺), 2 to U+263B (☻), ...
// General IBM PC codepage symbols are " ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼"
// see https://www.unicode.org/Public/MAPPINGS/VENDORS/MISC/IBMGRAPH.TXT

// Print the whole codepage
const buf = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  buf[i] = i;
}

/**
 * @param {string} graphics
 * @return {!Array<number|string>}
 */
const createOverrides = (graphics) => {
  const overrides = [];
  for (let i = 0; i < graphics.length; i++) {
    overrides.push(i);
    overrides.push(graphics[i]);
  }
  return overrides;
};

/**
 * Specifies the alternative symbols for the first 32 control bytes.
 *
 * The default is IBM PC memory-mapped symbols: " ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼"
 * - 0x00 maps to U+0020 " " Space
 * - 0x01 maps to U+263A "☺" White Smiling Face
 * - 0x02 maps to 0x263B "☻" Black Smiling Face
 * ...
 */
const cp = CP437.create({ overrides: createOverrides(" ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼") });
const page437 = cp.decode(buf);
console.log(page437.replace(/(?<line>.{32})/gu, "$<line>\n"));

// Output:
//
//  ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼
//  !"#$%&'()*+,-./0123456789:;<=>?
// @ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_
// `abcdefghijklmnopqrstuvwxyz{|}~⌂
// ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒ
// áíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐
// └┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀
// αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■

// CP864 uses different symbols for video graphics
const cp864 = CP864.create({ overrides: createOverrides(" ☺♪♫☼═║╬╣╦╠╩╗╔╚╝►◄↕‼¶§▬↨↑↓→←∟↔▲▼") });
const page864 = cp864.decode(buf);
console.log(page864.replace(/(?<line>.{32})/gu, "$<line>\n"));

// Output:
//
//  ☺♪♫☼═║╬╣╦╠╩╗╔╚╝►◄↕‼¶§▬↨↑↓→←∟↔▲▼
//  !"#$٪&'()*+,-./0123456789:;<=>?
// @ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_
// `abcdefghijklmnopqrstuvwxyz{|}~⌂
// °·∙√▒─│┼┤┬├┴┐┌└┘β∞φ±½¼≈«»ﻷﻸ��ﻻﻼ�
// ­ﺂ£¤ﺄ��ﺎﺏﺕﺙ،ﺝﺡﺥ٠١٢٣٤٥٦٧٨٩ﻑ؛ﺱﺵﺹ؟
// ¢ﺀﺁﺃﺅﻊﺋﺍﺑﺓﺗﺛﺟﺣﺧﺩﺫﺭﺯﺳﺷﺻﺿﻁﻅﻋﻏ¦¬÷×ﻉ
// ـﻓﻗﻛﻟﻣﻧﻫﻭﻯﻳﺽﻌﻎﻍﻡﹽّﻥﻩﻬﻰﻲﻐﻕﻵﻶﻝﻙﻱ■�

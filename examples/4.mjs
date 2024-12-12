import { CP437 } from "iconv-tiny/encodings/CP437";
import { CP864 } from "iconv-tiny/encodings/CP864";

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

// Usually CP437 is used, but it can be any.
const cp = CP437.create({ graphicMode: true });
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
const graphics = " ☺♪♫☼═║╬╣╦╠╩╗╔╚╝►◄↕‼¶§▬↨↑↓→←∟↔▲▼";
const cp864 = CP864.create({ graphicMode: true, graphics });
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

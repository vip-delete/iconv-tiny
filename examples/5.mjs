import fs from "fs";
import { CP437 } from "iconv-tiny/encodings";
import Path from "path";
import { fileURLToPath } from "url";

/**
 * @param {string} rel
 * @returns {string}
 */
export function abs(rel) {
  return Path.resolve(Path.dirname(fileURLToPath(import.meta.url)), rel);
}

// CP437 is also used to decode NFO-files, which are ASCII-art in the CP437 codepage
// find more at http://artscene.textfiles.com/asciiart/NFOS/
const cp = CP437.create();
const buf = fs.readFileSync(abs("legend.nfo"));
const str = cp.decode(buf);
console.log(str);

// Output:
//
//          ▄▄▄▄   ▄▄▀▀▀▀▀▄
//       ▄▀▀    ▀▄▀   ▄   ▀█
//      █ ▄▄▀▀▄▄ █   █▀▀   █
//     ▐▄▀       █   █    ▄█                                         █▄
//     █▌   ▄▀▄  █   █▀▄▄▀                                           █ ▀▄
//     ▐█    ▀▄▌ █   █                                               █ █
//      ▀█▄  ▄▀▄ █   ▀▄    ▄▄▄       ▄▄  ▄     ▄▄▄   ▄▄    ▄▄     ▄▄ █▄█
//         ▀▀    █    ▄▀ ▄█▀ ▀█▄   ▄█▀▄▀█▄█  ▄█▀ ▀█▄ ▀█▄ ▄█▀▄█  ▄█▀▄▀█▄█
//  ▀ ▀▄▀▄▀█████ █▀ ▄█ ▄▐▌█ ▀ █▄█▐▐▌▐ █ █▄█▐▐▌█ ▀ █▄█ █▀█▀▄ ██▐▐▌▐ █▌█ █▐██▄█▀▄▀▀
//    ▀ █▄▀█████ █ ▄ █ █▐▌▐▀▀▀▀▀▀▐▐▌▐ █ █▄█▐▐▌▐▀▀▀▀▀▀ █▄█ █ ██▐▐▌▐ █▌█▄█▐██▄▀▄ ▀
//  ▀  ▀ ▀▀▄▄▄▄▀▐▀▄ ▀█  ▐██▌  ███ ▐██▌  ███▌▐██▌  ███ █▀█   ██ ▐██▌ ▄███ ▀▀▀▀ ▀ ▀
//       ▄█▀ ▀████▄▀██   ▀██▄██▀▄  ▀██▄█▀██▌ ▀██▄██▀  ███   ██  ▀██▄█▀███ Si<ACiD>
//      ▐█▄█▄  ▀▀▀█████▄▄▄▄▄▀▄▄█▀       ▐██▌    ▀    ▀▀▀▀▀ ▐█▌     ▀   ▀▀
// ∙∙─ ──▀██▀──────▀▀██████▀▀▀█▀───────▄██▀───█▀▓─▓▀▀──────█▀────────────── ─ ─∙∙
//                    ▀▀▀▄▄███▄▄▄   ▄▄▀▀      ▓▀▀ ▓▄▄   ▄ ▀
//                      ▀█▀ █▀   ▀▀▀

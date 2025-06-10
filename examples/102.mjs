import { IconvTiny, aliases, encodings } from "iconv-tiny";

// File "iconv-tiny.bundle.mjs" contains everything in ~24KB
// It simplifies integration without the need for build tools.
// You can modify the file by removing the encodings you don't need.
const iconv = new IconvTiny(encodings, aliases);

// get encoding names from aliases:
console.log("Supported encodings: " + aliases.split(",").map((it) => it.split(" ")[0]));

// Let justice be done though the heavens fall.
const buf = iconv.encode("Fīat jūstitia, ruat cælum.", "latin4");
console.log(iconv.decode(buf, "latin4")); // Fīat jūstitia, ruat cælum.

// and love your neighbor as yourself.
const buf2 = iconv.encode("ואהבת לרעך כמוך.", "hebrew");
console.log(iconv.decode(buf2, "hebrew")); // ואהבת לרעך כמוך.

// Seek knowledge from the cradle to the grave.
const buf3 = iconv.encode("اطلب العلم من المهد إلى اللحد.", "arabic");
console.log(iconv.decode(buf3, "arabic")); // اطلب العلم من المهد إلى اللحد.

// Know yourself.
const buf4 = iconv.encode("Γνωθι σεαυτόν.", "greek");
console.log(iconv.decode(buf4, "greek")); // Γνωθι σεαυτόν.

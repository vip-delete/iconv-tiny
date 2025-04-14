import { div, el, $ } from "./el.mjs";
import { IconvTiny, aliases, encodings } from "./iconv-tiny.bundle.mjs";

async function onLoad() {
  const app = $("app");
  const iconvTiny = new IconvTiny(encodings, aliases);
  app.appendChild(
    div().children([
      div().children([
        //
        div().text("Text to Encode"),
        el("textarea").attrs({ id: "text", rows: 5, cols: 30 }),
      ]),
      div()
        .cls("center")
        .children([
          el("button")
            .on("click", () => {
              const encoding = $V("encoding").value;
              const text = $V("text").value;
              const array = iconvTiny.encode(text, encoding);
              $V("array").value = JSON.stringify(Array.from(array));
            })
            .text("Encode >>>"),
          el("select")
            .attrs({ id: "encoding" })
            .children(Object.entries(encodings).map(([key, value]) => el("option").attrs({ value: key }).text(value.name))),
          el("button")
            .on("click", () => {
              const encoding = $V("encoding").value;
              const array = $V("array").value;
              const text = iconvTiny.decode(new Uint8Array(JSON.parse(array)), encoding);
              $V("text").value = text;
            })
            .text("<<< Decode"),
        ]),
      div().children([
        //
        div().text("Array to Decode"),
        el("textarea").attrs({ id: "array", rows: 5, cols: 30 }),
      ]),
    ]).el
  );
  $V("text").value = "Привет!";
  $V("encoding").value = "CP1251";
}

addEventListener("load", onLoad);

/**
 * @param {string} name
 * @returns {HTMLSelectElement|HTMLTextAreaElement}
 */
function $V(name) {
  return /** @type {HTMLSelectElement|HTMLTextAreaElement} */ ($(name));
}

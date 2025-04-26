import { IconvTiny } from "iconv-tiny";
import { aliases } from "iconv-tiny/aliases";
import * as encodings from "iconv-tiny/encodings";
import { $, div, el } from "./el.mjs";

const list = aliases.split(",").map((it) => it.split(" ")[0])
const iconvTiny = new IconvTiny(encodings, aliases);

async function onLoad() {
  const app = $("app");
  app.appendChild(
    el("fieldset").cls("bg-blue").children([
      el("legend").text("Iconv-Tiny"),
      div().html("&nbsp;"),
      div().cls("yellow").text("Encoding:"),
      div().children(el("select").cls("black").attrs({ id: "encoding", style: "max-width: 250px; " })
        .children(list.map(it => el("option").attrs({ value: it }).text(it))),
      ).on("change", encode),
      div().html("&nbsp;"),
      div().cls("yellow").text("Text:"),
      div().children(
        el("textarea").cls("bg-bright-white black").attrs({ id: "text", rows: 5 }).on("input", encode),
      ),
      el("button").text("Copy Text").attrs({ id: "copyText" }).on("click", copyText),
      div().html("&nbsp;"),
      div().cls("yellow").text("Bytes:"),
      div().children(
        el("textarea").cls("bg-bright-white black").attrs({ id: "bytes", rows: 5 }).on("input", decode),
      ),
      el("button").text("Copy Bytes").attrs({ id: "copyBytes" }).on("click", copyBytes),
      div().html("&nbsp;"),
      div().cls("bright-red").attrs({ id: "err" })
    ]).el
  );
  $V("encoding").value = "CP1251";
  $V("text").value = "Привет!";
  $V("text").dispatchEvent(new Event('input', { bubbles: true }));
}

addEventListener("load", onLoad);

/**
 * @param {string} name
 * @returns {HTMLSelectElement|HTMLTextAreaElement}
 */
function $V(name) {
  return /** @type {HTMLSelectElement|HTMLTextAreaElement} */ ($(name));
}

function encode() {
  const encoding = $V("encoding").value;
  const text = $V("text").value;
  const bytes = iconvTiny.encode(text, encoding);
  $V("bytes").value = JSON.stringify(Array.from(bytes));
  $("err").innerText = "";
}

function decode() {
  const encoding = $V("encoding").value;
  const bytes = $V("bytes").value;
  try {
    $V("text").value = iconvTiny.decode(new Uint8Array(JSON.parse(bytes)), encoding);
    $("err").innerText = "";
  } catch (e) {
    // @ts-ignore
    $("err").innerText = e.message;
  }
}

/**
 * @param {!Event} e
 */
async function copyText(e) {
  copy("text", /** @type {HTMLButtonElement} */(e.target));
}

/**
 * @param {!Event} e
 */
async function copyBytes(e) {
  copy("bytes", /** @type {HTMLButtonElement} */(e.target));
}

/**
 * @param {string} id
 * @param {!HTMLButtonElement} btn
 */
async function copy(id, btn) {
  try {
    // @ts-ignore
    if (!btn.originText) {
      // @ts-ignore
      btn.originText = btn.innerText;
    }
    // @ts-ignore
    let timer = btn.timer;
    if (timer) {
      clearTimeout(timer);
    }
    const text = $V(id).value;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      btn.innerText = "Copied!";
      // @ts-ignore
      btn.timer = setTimeout(() => { btn.innerText = btn.originText }, 1000);
    } else {
      $("err").innerText = "No clipboard";
    }
  } catch (e) {
    // @ts-ignore
    $("err").innerText = "Failed to copy: " + e.message;
  }
}

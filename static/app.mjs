// @ts-nocheck
import { IconvTiny } from "iconv-tiny";
import { aliases } from "iconv-tiny/aliases";
import * as encodings from "iconv-tiny/encodings";
import { $, div, el } from "./el.mjs";

const list = aliases.split(",").map((it) => it.split(" ")[0])
const iconvTiny = new IconvTiny(encodings, aliases);

async function onLoad() {
  const app = $("app");
  app.appendChild(
    el("main").children([
      el("article").children(
        el("fieldset").children([
          el("legend").text("Iconv-Tiny"),
          div().html("Encoding............:&nbsp;").attrs({ style: "float:left" }),
          el("select").attrs({ id: "encoding", style: "width: calc(12 * var(--glyph-width));" }).on("change", encode).children(list.map(it => el("option").attrs({ value: it }).text(it))),
          div().html("DefaultCharByte.....:&nbsp;").attrs({ style: "float:left" }),
          el("input").attrs({ id: "defaultCharByte", maxLength: 1, style: "width: var(--glyph-width);", value: "?" }).on("input", encode),
          div().html("DefaultCharUnicode..:&nbsp;").attrs({ style: "float:left" }),
          el("input").attrs({ id: "defaultCharUnicode", maxLength: 1, style: "width: var(--glyph-width);", value: "�" }).on("input", decode),
          div().html("GraphicMode.........:&nbsp;").attrs({ style: "float:left" }),
          el("label").cls("checkbox-container").children([
            el("input").attrs({ id: "graphicMode", type: "checkbox" }).on("input", decode), div(),
          ]),
          div().html("NativeDecode........:&nbsp;").attrs({ style: "float:left" }),
          el("label").cls("checkbox-container").children([
            el("input").attrs({ id: "nativeDecode", type: "checkbox" }).on("input", decode), div(),
          ]),
          div().html("StrictDecode........:&nbsp;").attrs({ style: "float:left" }),
          el("label").cls("checkbox-container").children([
            el("input").attrs({ id: "strictDecode", type: "checkbox" }).on("input", decode), div(),
          ]),
          el("h2").text("Text:"),
          el("textarea").attrs({ id: "text", rows: 2, data: { maxRows: 6 } }).on("input", encode),
          el("button").text("Copy Text").attrs({ id: "copyText" }).on("click", copyText),
          el("h2").text("Bytes:"),
          el("textarea").attrs({ id: "bytes", rows: 2, data: { maxRows: 6 } }).on("input", decode),
          el("button").text("Copy Bytes").attrs({ id: "copyBytes" }).on("click", copyBytes),
          div().cls("bright-red").attrs({ id: "err" })
        ])
      )
    ]).el);
  $V("encoding").value = "CP1251";
  $V("text").value = "Привет!";
  $V("text").dispatchEvent(new Event('input', { bubbles: true }));
}

window.addEventListener("load", onLoad);

function adjustDynamicHeight() {
  for (const it of document.getElementsByTagName("textarea")) {
    if (!it.dataset.rows) {
      it.dataset.rows = it.getAttribute("rows");
    }
    it.setAttribute("rows", it.dataset.rows);
    it.style.height = `auto`;
    it.style.overflow = `hidden`;
    const scrollHeight = it.scrollHeight;
    const scaleFactor = getComputedStyle(document.documentElement).getPropertyValue("--scale-factor");
    const maxHeight = 16 * scaleFactor * it.dataset.maxRows;
    if (scrollHeight < maxHeight) {
      it.setAttribute("rows", Math.floor(scrollHeight / (16 * scaleFactor)));
    } else {
      it.setAttribute("rows", it.dataset.maxRows);
      it.style.overflow = `unset`;
    }
  }
}

window.addEventListener("resize", adjustDynamicHeight);

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
  try {
    const bytes = iconvTiny.encode(text, encoding, options());
    $V("bytes").value = JSON.stringify(Array.from(bytes));
    $("err").innerText = "";
  } catch (e) {
    $("err").innerText = e.message;
  }
  adjustDynamicHeight();
}

function decode() {
  const encoding = $V("encoding").value;
  const bytes = $V("bytes").value;
  try {
    $V("text").value = iconvTiny.decode(new Uint8Array(JSON.parse(bytes)), encoding, options());
    $("err").innerText = "";
  } catch (e) {
    $("err").innerText = e.message;
  }
  adjustDynamicHeight();
}

function options() {
  const defaultCharByte = $V("defaultCharByte").value;
  if (defaultCharByte.length > 0 && defaultCharByte.charCodeAt(0) > 255) {
    throw new Error(`DefaultCharByte code is ${defaultCharByte.charCodeAt(0)} but 0-255 expected.`);
  }
  const defaultCharUnicode = $V("defaultCharUnicode").value;
  const graphicMode = $V("graphicMode").checked;
  return {
    defaultCharByte,
    defaultCharUnicode,
    graphicMode,
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
    if (!btn.originText) {
      btn.originText = btn.innerText;
    }
    let timer = btn.timer;
    if (timer) {
      clearTimeout(timer);
    }
    const text = $V(id).value;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      btn.innerText = "Copied!";
      btn.timer = setTimeout(() => { btn.innerText = btn.originText }, 1000);
    } else {
      $("err").innerText = "No clipboard";
    }
  } catch (e) {
    $("err").innerText = "Failed to copy: " + e.message;
  }
}

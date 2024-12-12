import { IconvTiny, aliases, encodings } from "./iconv-tiny.bundle.mjs";

async function onLoad() {
  const app = $Id("app");
  const iconvTiny = new IconvTiny(encodings, aliases);
  app.appendChild(
    $("div").children([
      $("div").children([
        //
        $("div").text("Text to Encode"),
        $("textarea").attrs({ id: "text", rows: 5, cols: 30 }),
      ]),
      $("div")
        .cls("center")
        .children([
          $("button")
            .on("click", () => {
              const encoding = $V("encoding").value;
              const text = $V("text").value;
              const array = iconvTiny.encode(text, encoding);
              $V("array").value = JSON.stringify(Array.from(array));
            })
            .text("Encode >>>"),
          $("select")
            .attrs({ id: "encoding" })
            .children(Object.entries(encodings).map(([key, value]) => $("option").attrs({ value: key }).text(value.name).el)),
          $("button")
            .on("click", () => {
              const encoding = $V("encoding").value;
              const array = $V("array").value;
              const text = iconvTiny.decode(new Uint8Array(JSON.parse(array)), encoding);
              $V("text").value = text;
            })
            .text("<<< Decode"),
        ]),
      $("div").children([
        //
        $("div").text("Array to Decode"),
        $("textarea").attrs({ id: "array", rows: 5, cols: 30 }),
      ]),
    ]).el,
  );
  $V("text").value = "Привет!"
  $V("encoding").value = "CP1251"
}

addEventListener("load", onLoad);

/**
 * @param {string} name
 * @returns {El}
 */
function $(name) {
  return new El(name);
}

/**
 * @param {string} name
 * @returns {HTMLElement}
 */
function $Id(name) {
  const el = document.getElementById(name);
  if (el === null) {
    throw new Error();
  }
  return el;
}

/**
 * @param {string} name
 * @returns {HTMLSelectElement|HTMLTextAreaElement}
 */
function $V(name) {
  return /** @type {HTMLSelectElement|HTMLTextAreaElement} */ ($Id(name));
}

class El {
  /**
   *
   * @param {string} name
   */
  constructor(name) {
    this.el = document.createElement(name);
  }

  /**
   * @param {!{[key:string]:any}} attrs
   * @returns {El}
   */
  attrs(attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      this.el.setAttribute(key, value);
    }
    return this;
  }

  /**
   * @param {string} event
   * @param {EventListener} listener
   * @returns {El}
   */
  on(event, listener) {
    this.el.addEventListener(event, listener);
    return this;
  }

  /**
   * @param {!Array<string>|string} cls
   * @returns {El}
   */
  cls(cls) {
    if (Array.isArray(cls)) {
      for (const cl of cls) {
        this.el.classList.add(cl);
      }
    } else {
      this.el.classList.add(cls);
    }
    return this;
  }

  /**
   * @param {!Array<HTMLElement|El>} children
   * @returns {El}
   */
  children(children) {
    for (const child of children) {
      this.el.appendChild(child instanceof El ? child.el : child);
    }
    return this;
  }

  /**
   * @param {string} text
   * @returns {El}
   */
  text(text) {
    this.el.innerText = text;
    return this;
  }
}

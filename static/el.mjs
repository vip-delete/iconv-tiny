// EL*

/**
 * @param {string} name
 * @returns {El}
 */
export function el(name) {
  return new El(name);
}

/**
 * @returns {El}
 */
export function div() {
  return el("div");
}

/**
 * @returns {El}
 */
export function span() {
  return el("span");
}

/**
 * @param {string} name
 * @returns {!HTMLElement}
 */
export function $(name) {
  const el = document.getElementById(name);
  if (!el) {
    throw new Error();
  }
  return el;
}

export class El {
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
   * @param {boolean=} condition
   * @returns {El}
   */
  cls(cls, condition) {
    if (condition !== false) {
      if (Array.isArray(cls)) {
        for (const cl of cls) {
          this.el.classList.add(cl);
        }
      } else {
        for (const cl of cls.split(" ")) {
          this.el.classList.add(cl);
        }
      }
    }
    return this;
  }

  /**
   * @param {!Array<HTMLElement|El>|HTMLElement|El} children
   * @returns {El}
   */
  children(children) {
    if (Array.isArray(children)) {
      for (const child of children) {
        this.el.appendChild(child instanceof El ? child.el : child);
      }
    } else {
      this.el.appendChild(children instanceof El ? children.el : children);
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

  /**
   * @param {string} html
   * @returns {El}
   */
  html(html) {
    this.el.innerHTML = html;
    return this;
  }
}

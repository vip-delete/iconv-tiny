import { createIconv, aliases, encodings } from "iconv-tiny";
import { computed, createApp, onBeforeUnmount, onMounted, ref } from "vue";

const iconv = createIconv(encodings, aliases);

/**
 * @param {!Uint8Array} bytes
 * @returns {string}
 */
const toHexDump = (bytes) => Array.from(bytes, (it) => it.toString(16).padStart(2, "0").toUpperCase()).join(" ");

/**
 * @param {string} hex
 * @returns {!Uint8Array<ArrayBuffer>}
 */
const fromHexDump = (hex) => {
  const str = hex.replace(/[^0-9a-fA-F]/gu, "").toLowerCase();
  const bytes = new Uint8Array(Math.floor(str.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(str.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

/**
 * @param {!Uint8Array<ArrayBuffer>} bytes
 * @param {string} filename
 */
const downloadFile = (bytes, filename) => {
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

const App = {
  setup() {
    const encodingNames = aliases.split(",").map((it) => it.split(" ")[0]);
    const encoding = ref("CP437");
    const defaultCharByte = ref("?");
    const defaultCharByteCode = computed(() => (defaultCharByte.value.length > 0 ? "U+" + defaultCharByte.value.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") : ""));
    const defaultCharUnicode = ref("�");
    const defaultCharUnicodeCode = computed(() =>
      defaultCharUnicode.value.length > 0 ? "U+" + defaultCharUnicode.value.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") : "",
    );
    const native = ref(false);
    const text = ref("Hε110! █▓▒░");
    const hexDump = ref("");

    /**
     * @type {import("vue").Ref<?HTMLInputElement>}
     */
    const fileInput = ref(null);
    const error = ref("");

    /**
     * @returns {ns.Options & ns.DecodeOptions & ns.EncodeOptions}
     */
    const options = () => {
      if (defaultCharByte.value.length > 0 && defaultCharByte.value.charCodeAt(0) > 255) {
        throw new Error(`DefaultCharByte code is U+${defaultCharByte.value.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")} but U+00XX expected.`);
      }
      return {
        defaultCharByte: defaultCharByte.value,
        defaultCharUnicode: defaultCharUnicode.value,
        native: native.value,
      };
    };

    const encode = () => {
      try {
        hexDump.value = toHexDump(iconv.encode(text.value, encoding.value, options()));
        error.value = "";
      } catch (e) {
        error.value = String(e);
      }
    };

    const decode = () => {
      try {
        text.value = iconv.decode(new Uint8Array(fromHexDump(hexDump.value)), encoding.value, options());
        error.value = "";
      } catch (e) {
        error.value = String(e);
      }
    };

    const originText = ref("");
    const copyTimer = ref();

    /**
     * @param {Event} e
     */
    const copyText = (e) => {
      const btn = /** @type {!HTMLElement} */ (e.target);
      if (!originText.value) {
        originText.value = btn.innerText;
      }
      if (copyTimer.value) {
        clearTimeout(copyTimer.value);
      }
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(text.value)
          .then(() => {
            const copiedText = "Copied!";
            const padding = originText.value.length - copiedText.length;
            btn.innerHTML = copiedText + (padding > 0 ? "&nbsp;".repeat(padding) : "");
            copyTimer.value = setTimeout(() => {
              btn.innerText = originText.value;
            }, 1000);
          })
          .catch((err) => {
            error.value = err;
          });
      } else {
        error.value = "No clipboard";
      }
    };

    const loadFromFile = () => {
      fileInput.value?.click();
    };

    /**
     * @param {!Event} e
     */
    const handleFileChange = (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && reader.result instanceof ArrayBuffer) {
            hexDump.value = toHexDump(new Uint8Array(reader.result));
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };

    const saveAsFile = () => {
      const bytes = fromHexDump(hexDump.value);
      if (bytes.length) {
        downloadFile(bytes, "output.txt");
      }
    };

    encode();

    // eslint-disable-next-line no-empty-function
    const noopTouchStart = () => {};

    onMounted(() => {
      document.addEventListener("touchstart", noopTouchStart);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("touchstart", noopTouchStart);
    });

    return {
      encodingNames,
      encoding,
      defaultCharByte,
      defaultCharByteCode,
      defaultCharUnicode,
      defaultCharUnicodeCode,
      native,
      text,
      hexDump,
      fileInput,
      error,
      encode,
      decode,
      options,
      copyText,
      loadFromFile,
      handleFileChange,
      saveAsFile,
    };
  },
};

await document.fonts.load("1em 'IBM VGA 8x16'");
createApp(App).mount("#app");

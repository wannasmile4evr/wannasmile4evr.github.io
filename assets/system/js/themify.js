"use strict";

const DEFAULT_THEME    = "redux";
const DEFAULT_GIF_SIZE = 128;

const VALID_THEMES = new Set([
  "wolf", "cherrybomb", "igor", "gn-math", "selenite",
  "slackerish", "classic", "redux", "graduation", "i-am-music",
]);

const _SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbyPkLa-93PUcjMq4lUk2tIkL8DFp5jLTC0zZAXpazZyhJJKzucp1zxZISu-TXUo0PU/exec";

const _COL = {
  name: 0,
  id:   1,
  type: 2,
  vars: [
    "--header-bg",

    "--quote-bg",

    "--main-bg",

    "--footer-bg",

    "--aside-bg",

    "--text-color",

    "--url-color",

    "--quote-color",

    "--accent-color",

    "--search-bg",

    "--search-text",

    "--search-placeholder",

    "--icon-bg",

    "--shadow-color",

    "--trench-color",

  ],
};

const _ROOT_CSS = `:root {
  --header-bg: url("https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/Redux-headerbg.png");
  --quote-bg: url("https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/Redux-quotebg.png");
  --main-bg: url("https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/Redux-mainbg.png");
  --footer-bg: url("../../media/themes/redux/footerbg.png");
  --aside-bg: rgba(0, 0, 0, 0.95);
  --text-color: #000;
  --url-color: #fff;
  --quote-color: #fff;
  --accent-color: #ff4444;
  --search-bg: #f0f0f0;
  --search-text: #333;
  --search-placeholder: #888;
  --icon-bg: #333;
  --shadow-color: rgba(0, 0, 0, 0.3);
  --trench-color: #000;
}`;

const _BG_VAR_NAMES = new Set([
  "--main-bg", "--body-bg", "--bg", "--background",
  "--header-bg", "--footer-bg", "--sidebar-bg",
  "--quote-bg", "--aside-bg",
]);

function _isCSSColor(val) {
  const v = (val || "").trim();
  if (!v || v === "none" || v === "inherit" || v === "transparent") return false;
  return (
    /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ||
    /^rgb[a]?\s*\(/.test(v) ||
    /^hsl[a]?\s*\(/.test(v) ||
    /^(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i.test(v)
  );
}

function _normalizeBgValue(val) {
  const v = (val || "").trim();
  if (!v) return v;
  if (/^url\s*\(\s*['"]{0,1}\s*['"]{0,1}\s*\)$/.test(v)) return "";
  if (/^url\s*\(/.test(v) || /^(linear|radial|conic)-gradient/.test(v)) return v;
  if (_isCSSColor(v)) return v;

  if (v.startsWith("data:")) return `url("${v}")`;
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(v)) return `url("${v}")`;
  if (/^https?:\/\//i.test(v)) return `url("${v}")`;
  return v;
}

function _applyCustomVars(vars) {
  if (!vars || typeof vars !== "object") return;
  for (const [k, v] of Object.entries(vars)) {
    const normalized = _BG_VAR_NAMES.has(k) ? _normalizeBgValue(v) : v;
    document.documentElement.style.setProperty(k, normalized);
  }
}

const _CDURL_PREFIX = "CDURL2:";

const _CDURL_MIME = [
  "data:image/png;base64,",
  "data:image/jpeg;base64,",
  "data:image/gif;base64,",
  "data:image/webp;base64,",
  "data:image/svg+xml;base64,",
  "data:image/avif;base64,",
  "data:image/bmp;base64,",
];

function _isCDURL(v) {
  if (typeof v !== "string") return false;
  if (!v.startsWith(_CDURL_PREFIX)) return false;
  const body = v.slice(_CDURL_PREFIX.length);

  if (body.length < 8) return false;

  const mimeIdx = parseInt(body[0], 16);
  if (isNaN(mimeIdx) || mimeIdx >= _CDURL_MIME.length) return false;

  if (body[1] !== "0") return false;

  if (!/^[A-Za-z0-9\-_]+$/.test(body.slice(2))) return false;
  return true;
}

function _b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function _bytesToB64(arr) {
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

async function _inflate(bytes) {
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const chunks = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

async function _decodeCDURL(token) {
  const body     = token.slice(_CDURL_PREFIX.length);
  const mimeIdx  = parseInt(body[0], 16);
  const payload  = body.slice(2);
  const mime     = _CDURL_MIME[mimeIdx];
  const compressed = _b64urlToBytes(payload);
  const raw        = await _inflate(compressed);
  return mime + _bytesToB64(raw);
}

async function _maybeDecode(val) {
  if (!val || typeof val !== "string") return val;
  const v = val.trim();

  if (
    v.startsWith("https://") ||
    v.startsWith("http://")  ||
    v.startsWith("data:")    ||
    v.startsWith("url(")     ||
    /^(linear|radial|conic)-gradient/.test(v) ||
    _isCSSColor(v)
  ) return v;

  if (v.startsWith(_CDURL_PREFIX)) {
    if (!_isCDURL(v)) {
      console.warn("[themify] CDURL2 token failed validation, skipping decode:", v.slice(0, 32) + "…");
      return v;
    }
    try {
      return await _decodeCDURL(v);
    } catch (err) {
      console.warn("[themify] CDURL2 decode failed, using raw value:", err.message);
      return v;
    }
  }

  return v;
}

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = (url && url.startsWith("http")) ? url : (url ? `assets/system/${url}` : "");
}

(function applyGlobalCloak() {
  if (localStorage.getItem("cloakEnabled") !== "true") return;
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon  = localStorage.getItem("cloakIcon");
  if (savedTitle) document.title = savedTitle;
  if (savedIcon)  setFavicon(savedIcon);
})();

function _resolveTheme(raw) {
  const t = (raw || "").trim().toLowerCase();
  return VALID_THEMES.has(t) ? t : DEFAULT_THEME;
}

(function applyGlobalTheme() {
  const raw   = localStorage.getItem("selectedTheme");
  const theme = raw ? raw.trim() : DEFAULT_THEME;

  if (!raw) localStorage.setItem("selectedTheme", DEFAULT_THEME);

  document.documentElement.setAttribute("theme", theme);

  if (theme === "custom") {
    try {
      _applyCustomVars(JSON.parse(localStorage.getItem("customTheme") || "{}"));
    } catch (_) {}
  }
})();

window.addEventListener("storage", (e) => {
  if (e.key === "cloakTitle") { if (localStorage.getItem("cloakEnabled") === "true") document.title = e.newValue || document.title; }
  if (e.key === "cloakIcon")  { if (localStorage.getItem("cloakEnabled") === "true") setFavicon(e.newValue || ""); }

  if (e.key === "selectedTheme") {
    const t = (e.newValue || "").trim() || DEFAULT_THEME;
    document.documentElement.setAttribute("theme", t);
    if (t !== "custom") document.documentElement.style.cssText = "";
  }

  if (e.key === "customTheme" && e.newValue) {
    try { _applyCustomVars(JSON.parse(e.newValue)); } catch (_) {}
  }
});

function applyTheme(id) {
  const t = (id || "").trim() || DEFAULT_THEME;
  document.documentElement.setAttribute("theme", t);
  try { localStorage.setItem("selectedTheme", t); } catch (_) {}
  if (typeof window.applyThemeGifs === "function") window.applyThemeGifs(t);
}

const ROOT_GIFS = {
  loading: { src: "assets/media/gifs/redux/loading.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  loaded: { src: "assets/media/gifs/redux/loaded.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  searching: { src: "assets/media/gifs/redux/searching.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  held: { src: "assets/media/gifs/redux/held.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  drop: { src: "assets/media/gifs/redux/drop.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  crash: { src: "assets/media/gifs/redux/crash.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  ded: { src: "assets/media/gifs/redux/ded.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
};

const THEME_GIF_SRC = {
  "wolf": {
    loading: "assets/media/gifs/wolf/loading.gif",
    loaded: "assets/media/gifs/wolf/loaded.gif",
    searching: "assets/media/gifs/wolf/searching.gif",
    held: "assets/media/gifs/wolf/held.gif",
    drop: "assets/media/gifs/wolf/drop.gif",
    crash: "assets/media/gifs/wolf/crash.gif",
    ded: "assets/media/gifs/wolf/ded.gif",
  },
  "cherrybomb": {
    loading: "assets/media/gifs/cherrybomb/loading.gif",
    loaded: "assets/media/gifs/cherrybomb/loaded.gif",
    searching: "assets/media/gifs/cherrybomb/searching.gif",
    held: "assets/media/gifs/cherrybomb/held.gif",
    drop: "assets/media/gifs/cherrybomb/drop.gif",
    crash: "assets/media/gifs/cherrybomb/crash.gif",
    ded: "assets/media/gifs/cherrybomb/ded.gif",
  },
  "igor": {
    loading: "assets/media/gifs/igor/loading.gif",
    loaded: "assets/media/gifs/igor/loaded.gif",
    searching: "assets/media/gifs/igor/searching.gif",
    held: "assets/media/gifs/igor/held.gif",
    drop: "assets/media/gifs/igor/drop.gif",
    crash: "assets/media/gifs/igor/crash.gif",
    ded: "assets/media/gifs/igor/ded.gif",
  },
  "gn-math": {
    loading: "assets/media/gifs/gn-math/loading.gif",
    loaded: "assets/media/gifs/gn-math/loaded.gif",
    searching: "assets/media/gifs/gn-math/searching.gif",
    held: "assets/media/gifs/gn-math/held.gif",
    drop: "assets/media/gifs/gn-math/drop.gif",
    crash: "assets/media/gifs/gn-math/crash.gif",
    ded: "assets/media/gifs/gn-math/ded.gif",
  },
  "selenite": {
    loading: "assets/media/gifs/selenite/loading.gif",
    loaded: "assets/media/gifs/selenite/loaded.gif",
    searching: "assets/media/gifs/selenite/searching.gif",
    held: "assets/media/gifs/selenite/held.gif",
    drop: "assets/media/gifs/selenite/drop.gif",
    crash: "assets/media/gifs/selenite/crash.gif",
    ded: "assets/media/gifs/selenite/ded.gif",
  },
  "slackerish": {
    loading: "assets/media/gifs/slackerish/loading.gif",
    loaded: "assets/media/gifs/slackerish/loaded.gif",
    searching: "assets/media/gifs/slackerish/searching.gif",
    held: "assets/media/gifs/slackerish/held.gif",
    drop: "assets/media/gifs/slackerish/drop.gif",
    crash: "assets/media/gifs/slackerish/crash.gif",
    ded: "assets/media/gifs/slackerish/ded.gif",
  },
  "classic": {
    loading: "assets/media/gifs/classic/loading.gif",
    loaded: "assets/media/gifs/classic/loaded.gif",
    searching: "assets/media/gifs/classic/searching.gif",
    held: "assets/media/gifs/classic/held.gif",
    drop: "assets/media/gifs/classic/drop.gif",
    crash: "assets/media/gifs/classic/crash.gif",
    ded: "assets/media/gifs/classic/ded.gif",
  },
  "redux": {
    loading: "assets/media/gifs/redux/loading.gif",
    loaded: "assets/media/gifs/redux/loaded.gif",
    searching: "assets/media/gifs/redux/searching.gif",
    held: "assets/media/gifs/redux/held.gif",
    drop: "assets/media/gifs/redux/drop.gif",
    crash: "assets/media/gifs/redux/crash.gif",
    ded: "assets/media/gifs/redux/ded.gif",
  },
  "graduation": {
    loading: "assets/media/gifs/graduation/loading.gif",
    loaded: "assets/media/gifs/graduation/loaded.gif",
    searching: "assets/media/gifs/graduation/searching.gif",
    held: "assets/media/gifs/graduation/held.gif",
    drop: "assets/media/gifs/graduation/drop.gif",
    crash: "assets/media/gifs/graduation/crash.gif",
    ded: "assets/media/gifs/graduation/ded.gif",
  },
  "i-am-music": {
    loading: "assets/media/gifs/i-am-music/loading.gif",
    loaded: "assets/media/gifs/i-am-music/loaded.gif",
    searching: "assets/media/gifs/i-am-music/searching.gif",
    held: "assets/media/gifs/i-am-music/held.gif",
    drop: "assets/media/gifs/i-am-music/drop.gif",
    crash: "assets/media/gifs/i-am-music/crash.gif",
    ded: "assets/media/gifs/i-am-music/ded.gif",
  },
};

function _gifBlock(folder) {
  const table = THEME_GIF_SRC[folder] || {};
  const out = {};
  for (const key of ["loading","loaded","searching","held","drop","crash","ded"]) {
    out[key] = { src: table[key] || "", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE };
  }
  return out;
}

const THEME_GIFS = {
  wolf:         _gifBlock("wolf"),
  cherrybomb:   _gifBlock("cherrybomb"),
  igor:         _gifBlock("igor"),
  "gn-math":    _gifBlock("gn-math"),
  selenite:     _gifBlock("selenite"),
  slackerish:   _gifBlock("slackerish"),
  classic:      _gifBlock("classic"),
  redux:        _gifBlock("redux"),
  graduation:   _gifBlock("graduation"),
  "i-am-music": _gifBlock("i-am-music"),
};

function getThemeGif(theme, key) {
  const resolved  = _resolveTheme(theme);
  const entry     = (THEME_GIFS[resolved] || {})[key] || {};
  const rootEntry = ROOT_GIFS[key] || {};
  return {
    src: entry.src || rootEntry.src || "",
    w:   entry.w   || rootEntry.w   || DEFAULT_GIF_SIZE,
    h:   entry.h   || rootEntry.h   || DEFAULT_GIF_SIZE,
  };
}

function getThemeGifSrc(theme, key) {
  return getThemeGif(theme, key).src;
}

function applyGifToImg(img, theme, key) {
  if (!img) return;
  const { src, w, h } = getThemeGif(theme, key);
  if (src) img.src = src;
  img.style.setProperty("--gif-w", `${w}px`);
  img.style.setProperty("--gif-h", `${h}px`);
  img.dataset.gifState = key;
}

window.applyThemeGifs = function (theme) {
  const t = _resolveTheme(
    theme || document.documentElement.getAttribute("theme")
  );
  const loaderImg = document.querySelector("#containerLoader img");
  if (loaderImg) {
    const currentState = loaderImg.dataset.gifState || "loading";
    applyGifToImg(loaderImg, t, currentState);
  }
  const searchGif = document.getElementById("noResultsGif");
  if (searchGif) applyGifToImg(searchGif, t, "searching");
};

window.setLoaderState = function (state) {
  const t   = _resolveTheme(document.documentElement.getAttribute("theme"));
  const img = document.querySelector("#containerLoader img");
  applyGifToImg(img, t, state);
};

(function () {
  const theme = _resolveTheme(localStorage.getItem("selectedTheme"));
  const img   = document.querySelector("#containerLoader img");
  if (img) applyGifToImg(img, theme, "loading");
})();

let _themeData = [];
let _styleEl   = null;

function _getStyleEl() {
  if (!_styleEl) {
    _styleEl = document.getElementById("ws-themes");
    if (!_styleEl) {
      _styleEl = document.createElement("style");
      _styleEl.id = "ws-themes";
      document.head.prepend(_styleEl);
    }
  }
  return _styleEl;
}

async function _normalizeSheetVal(raw) {
  const v = (raw || "").toString().trim();
  if (!v) return "";
  const decoded = await _maybeDecode(v);
  return _normalizeBgValue(decoded);
}

async function _buildThemeBlock(row) {
  const id = (row[_COL.id] || "").toString().trim();
  if (!id) return "";

  const declPairs = await Promise.all(
    _COL.vars.map(async (varName, i) => {
      const val = await _normalizeSheetVal(row[3 + i]);
      return val ? `  ${varName}: ${val};` : "";
    })
  );

  const decls = declPairs.filter(Boolean).join("\n");
  if (!decls) return "";
  return `html[theme="${id}"] {\n${decls}\n}`;
}

async function _injectAllThemes(rows) {
  const built = await Promise.all(rows.map(_buildThemeBlock));
  const blocks = built.filter(Boolean).join("\n\n");
  _getStyleEl().textContent = _ROOT_CSS + (blocks ? "\n\n" + blocks : "");
}

async function fetchThemes(forceRefresh) {
  try {
    const res  = await fetch(_SHEETS_URL + (forceRefresh ? "?bust=" + Date.now() : ""));
    const json = await res.json();

    if (!Array.isArray(json)) throw new Error(json.error || "Unexpected API response");

    _themeData = json.slice(0, 10);
    await _injectAllThemes(_themeData);

  } catch (err) {
    console.warn("[themify] Sheets fetch failed:", err.message);

  }
}

function getThemeData() { return _themeData; }

function getThemeId(index) {
  const row = _themeData[index];
  if (!row) return null;
  const id   = (row[_COL.id]   || "").toString().trim();
  const type = (row[_COL.type] || "").toString().trim().toLowerCase();
  return (id && type !== "soon") ? id : null;
}

window.ThemifySheets = { applyTheme, fetchThemes, getThemeData, getThemeId };

(function bootSheets() {
  _getStyleEl().textContent = _ROOT_CSS;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => fetchThemes(false));
  } else {
    fetchThemes(false);
  }
})();
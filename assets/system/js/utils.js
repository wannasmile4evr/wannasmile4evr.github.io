"use strict";

const clamp    = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
const delay    = (ms) => new Promise((r) => setTimeout(r, ms));
const safeStr  = (v) => (v == null ? "" : String(v));
const rafAsync = () => new Promise((r) => requestAnimationFrame(r));

function truncateText(text, max = 26) {
  text = safeStr(text);
  return text.length > max ? text.slice(0, max) + "..." : text;
}

// Reads a field off a sheet-derived row object case/format-insensitively,
// so header text like "Category", "categories", or "Sub-Category" all match
// regardless of exact spelling used in the spreadsheet.
function getFieldCI(row, ...names) {
  if (!row || typeof row !== "object") return "";
  const normalize = (s) => s.toLowerCase().replace(/[\s_-]/g, "");
  const wanted = names.map(normalize);
  for (const key of Object.keys(row)) {
    if (wanted.includes(normalize(key))) {
      const v = row[key];
      if (v != null && String(v).trim()) return String(v);
    }
  }
  return "";
}

function fitInputText(el, text, { max = 14, min = 10, step = 0.5 } = {}) {
  if (!el) return;
  text = safeStr(text);

  if (!text) { el.style.fontSize = max + "px"; return; }

  const canvas = fitInputText._canvas || (fitInputText._canvas = document.createElement("canvas"));
  const ctx    = canvas.getContext("2d");
  const cs     = getComputedStyle(el);
  const available = el.clientWidth
    - (parseFloat(cs.paddingLeft)  || 0)
    - (parseFloat(cs.paddingRight) || 0);

  if (available <= 0) return;

  let size = max;
  while (size > min) {
    ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    if (ctx.measureText(text).width <= available) break;
    size -= step;
  }
  el.style.fontSize = size + "px";
}

function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const _collator   = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const fastCompare = (a, b) => _collator.compare(a, b);

const getSortMode = () => localStorage.getItem("sortMode") || "sheet";

window.showToast = function showToast(message, timeout = 2200) {
  let t = document.getElementById("__ws_toast__");
  if (!t) {
    t = document.createElement("div");
    t.id = "__ws_toast__";
    Object.assign(t.style, {
      position:      "fixed",
      bottom:        "28px",
      left:          "50%",
      transform:     "translateX(-50%)",
      background:    "rgba(0,0,0,0.8)",
      color:         "#fff",
      padding:       "10px 14px",
      borderRadius:  "8px",
      fontFamily:    "monospace",
      zIndex:        "99999",
      opacity:       "0",
      transition:    "opacity 220ms ease",
      pointerEvents: "none",
    });
    document.body.appendChild(t);
  }
  clearTimeout(t.__timer);
  t.textContent   = message;
  t.style.opacity = "1";
  t.__timer = setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, timeout);
};

const showToast = window.showToast;
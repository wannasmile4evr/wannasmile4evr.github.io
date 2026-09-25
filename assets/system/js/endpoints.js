"use strict";

// ── Backend endpoints ──────────────────────────────────────────────────
// The three Apps Script projects (.documentation/api/) and what each serves:
//
//   data  data.gs  assets, devbuild, quotes, sync, tickets
//                  (main.js, quotes.js, ticket.js, devbuild.js, index.html prefetch)
//   cust  cust.gs  themes, widgets, banners, gif packs
//                  (themify.js, widgets.js, profile.js, store.html)
//   mod   mod.gs   word filter, taken usernames — open, no ticket
//                  (wordfilter.js)
//
// Paste each project's /exec URL here after deploying it. This file loads
// first on every page (before wordfilter.js in <head>), so everything else
// can read window.WS_ENDPOINTS.
//
window.WS_ENDPOINTS = Object.freeze({
  data: "https://script.google.com/macros/s/AKfycbzCgvAwo0Z_4Fo-AphXo8OL4-1ELaY8nrH1ScC5wlewb9gA3Kf7gRTl4dksv1Pf8wz1/exec",
  cust: "https://script.google.com/macros/s/AKfycby9ldspfVFZxwR9BxTbh_niAjBhoL0Q8T8V1pN2m85S5NB4EMb84N08YhSlhYsM2TtZ/exec",
  mod:  "https://script.google.com/macros/s/AKfycbyorR1RSI3-aYv91IIobUxMmNv8HKMyYvNKhwgR27AXetGROjkE_eYgBNyW5hwyPh_w/exec",
});

// ── General media (wannabase) ──────────────────────────────────────────
// Banners, profile pics, stickers and theme art live in their own repo,
// github.com/wannasmile4evr/wannabase, not in this site:
//
//   assets/media/banners/         -> banners/
//   assets/media/images/profile/  -> profile/
//   assets/media/stickers/        -> stickers/
//   assets/media/themes/          -> themes/
//
// The code points there directly, but sheet rows and caches saved in
// visitors' browsers can still hold the old in-site paths (…github.io./
// assets/media/…, "site:assets/media/…", ../../media/…). toWannabase() turns
// any of those into the wannabase URL and leaves every other value alone.
window.WS_WANNABASE = "https://raw.githubusercontent.com/wannasmile4evr/wannabase/main/";

window.toWannabase = (() => {
  const host = location.host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const moved = new RegExp(
    String.raw`^(?:site:|(?:https?:)?//(?:wannasmile4evr\.github\.io\.?${host ? "|" + host : ""})/(?:[^?#]*?/)?|/|(?:\.\.?/)*)` +
    String.raw`(?:assets/)?media/(banners|stickers|themes|images/profile)/`, "i");
  return (url) => {
    if (typeof url !== "string") return url;
    const v = url.trim();
    const m = v.match(moved);
    if (!m) return url;
    const dir = m[1].toLowerCase() === "images/profile" ? "profile" : m[1].toLowerCase();
    return window.WS_WANNABASE + dir + "/" + v.slice(m[0].length);
  };
})();

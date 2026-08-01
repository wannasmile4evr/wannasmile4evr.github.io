"use strict";

(function initScrollPersistence() {
  const saveScroll = debounce(() => {
    sessionStorage.setItem("scrollY", String(Math.round(window.scrollY)));
  }, 100);
  window.addEventListener("scroll", saveScroll, { passive: true });

  window._restoreScrollY = function () {
    const saved = parseInt(sessionStorage.getItem("scrollY") || "0", 10);
    if (!saved) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        window.scrollTo({ top: saved, behavior: "instant" })
      )
    );
  };
})();

(() => {
  const PAGE_ACCEL     = 0.9;
  const PAGE_FRICTION  = 0.85;
  const PAGE_THRESHOLD = 1;
  const TAP_COOLDOWN   = 300;

  let velocity = 0, lastFlip = 0;
  const keys = { left: false, right: false };

  const canFlip = () =>
    typeof window.nextPage === "function" &&
    typeof window.prevPage === "function" &&
    performance.now() - lastFlip > TAP_COOLDOWN;

  const flipNext = () => { if (!canFlip()) return; lastFlip = performance.now(); window.nextPage(); };
  const flipPrev = () => { if (!canFlip()) return; lastFlip = performance.now(); window.prevPage(); };

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { keys.right = true; if (!e.repeat) flipNext(); }
    if (e.key === "ArrowLeft")  { keys.left  = true; if (!e.repeat) flipPrev(); }
  });
  document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowLeft")  keys.left  = false;
  });

  (function loop() {
    if (keys.right) velocity += PAGE_ACCEL;
    if (keys.left)  velocity -= PAGE_ACCEL;
    velocity *= PAGE_FRICTION;
    if (velocity >  PAGE_THRESHOLD) { flipNext(); velocity = 0; }
    if (velocity < -PAGE_THRESHOLD) { flipPrev(); velocity = 0; }
    if (Math.abs(velocity) < 0.01) velocity = 0;
    requestAnimationFrame(loop);
  })();
})();

function initGifDrag(gif) {
  const SWAY_STRENGTH = 0.6;
  const RETURN_SPEED  = 0.08;
  const DROP_DURATION = 1600;

  const _getDragTheme = () =>
    document.documentElement.getAttribute("theme") || DEFAULT_THEME;

  let dragging = false, dropping = false;
  let mouseX = 0, mouseY = 0, lastMouseX = 0, rotation = 0;

  new MutationObserver(() => {
    if (gif.style.display !== "none") gif.style.pointerEvents = "auto";
  }).observe(gif, { attributes: true, attributeFilter: ["style"] });

  const _applyDragGif = (key) => {
    const theme = _getDragTheme();
    if (typeof applyGifToImg === "function") {
      applyGifToImg(gif, theme, key);
    } else {
      gif.src = getThemeGifSrc(theme, key) || getThemeGifSrc(theme, "searching");
    }
  };

  gif.addEventListener("mousedown", (e) => {
    if (dropping) return;
    dragging = true;
    _applyDragGif("held");
    gif.style.cursor = "grabbing";
    mouseX = e.clientX; mouseY = e.clientY; lastMouseX = mouseX;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false; dropping = true;
    gif.style.cursor = "grab";
    _applyDragGif("drop");
    gif.style.top = (parseFloat(gif.style.top) || 0) + 6 + "px";
    setTimeout(() => { _applyDragGif("searching"); dropping = false; }, DROP_DURATION);
  });

  (function tick() {
    if (dragging) {
      rotation += (mouseX - lastMouseX) * SWAY_STRENGTH;
      rotation *= 0.9;
      gif.style.left = mouseX + "px";
      gif.style.top  = mouseY + "px";
    } else {
      rotation *= (1 - RETURN_SPEED);
    }
    gif.style.transform = `translate(-50%, 0) rotate(${rotation}deg)`;
    lastMouseX = mouseX;
    requestAnimationFrame(tick);
  })();
}

window.addEventListener("load", () => {
  if (typeof Crate !== "undefined") {
    new Crate({ server: "1451796462517096642", channel: "1451796463368667218" });
  }
});

(() => {

  function initElements() {
    const $ = (sel) => {
      try {
        if (!sel) return null;
        return /^[A-Za-z0-9\-_]+$/.test(sel)
          ? document.getElementById(sel)
          : document.querySelector(sel) || null;
      } catch { return null; }
    };

    // ── Container mode detection ────────────────────────────────────────────
    // Resolve which container div is present and set the page mode accordingly.
    // Modes:
    //   "favorites"  → #favorites-container  (only favorited assets, 75/page, order-added)
    //   "dev"        → #dev-build-container  (all assets from devBuildUrl, normal paging)
    //   "default"    → #container            (normal production load)
    const favContainer  = document.getElementById("favorites-container");
    const devContainer  = document.getElementById("dev-build-container");
    const mainContainer = document.getElementById("container");

    let resolvedContainer, containerMode;
    if (favContainer) {
      resolvedContainer = favContainer;
      containerMode     = "favorites";
    } else if (devContainer) {
      resolvedContainer = devContainer;
      containerMode     = "dev";
    } else {
      resolvedContainer = mainContainer;
      containerMode     = "default";
    }

    window._containerMode = containerMode;

    window.dom = {
      container:          resolvedContainer,
      pageIndicator:      $(".page-indicator") || $("#page-indicator"),
      searchInput:        $("#searchInputHeader"),
      searchBtn:          $("#searchBtnHeader"),
      updatePopup:        $("#updatePopup"),
      updatePopupContent: $(".update-popup-content"),
      viewUpdateBtn:      $("#viewUpdateBtn"),
      viewUpdateInfoBtn:  $("#viewUpdateInfoBtn"),
      closeUpdateBtn:     $("#closeUpdateBtn"),
      dontShowBtn:        $("#dontShowBtn"),
      updateVideo:        $("#updateVideo"),
    };

    window.config = {
      fallbackImage:    "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/404_blank.png",
      fallbackLink:     "https://wnasmile.github.io./source/dino/",
      sheetUrl:         "https://script.google.com/macros/s/AKfycbz7hAe-haYE3Gqer2EV8KS08pRubT88N9jtv6MipPw352Ba9VtT0bkpvplFbB_v5ttIjQ/exec",
      devBuildUrl:      "https://script.google.com/macros/s/AKfycbyUORWmL21snkt5vIAkVJrJC_MF6s2wHopXofW8HdckC-5KsZO2slKFi_105Oz0e4MDmA/exec",
    };

    window.stickerPacksLibrary = [
      {
        name:    "legacy",
        dynamic: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/stickers/",
        static:  "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/stickers/",
      },
      {
        name:    "wnasmile",
        dynamic: "https://cdn.jsdelivr.net/gh/wnasmile/stickpack@main/dynamic/",
        static:  "https://cdn.jsdelivr.net/gh/wnasmile/stickpack@main/static/",
      },
    ];

    // Dev mode uses the dev build API; all other modes use production.
    if (!window._activeFetchUrl) {
      window._activeFetchUrl = (containerMode === "dev")
        ? window.config.devBuildUrl
        : window.config.sheetUrl;
    }
  }

  function initFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(stored.map(s => safeStr(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () =>
      localStorage.setItem("favorites", JSON.stringify([...window.favorites]));

    window.refreshCards = () => {
      if (!window.assetsData || typeof createAssetCards !== "function") return [];
      const savedY    = window.scrollY;
      const promises  = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
      Promise.all(promises.map(p => p.promise ?? p).filter(Boolean))
        .finally(() => window.scrollTo({ top: savedY, behavior: "instant" }));
      return promises;
    };
  }

  const _gifDurationCache = new Map();

  const _getLoadedGifUrl = () => getThemeGifSrc(_getTheme(), "loaded");

  function parseGifDuration(buf) {
    const b = new Uint8Array(buf);
    let ms = 0, i = 13;
    if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 0x07) + 1));
    while (i < b.length) {
      const block = b[i];
      if (block === 0x3B) break;
      if (block === 0x2C) {
        i += 10;
        if (b[i - 1] & 0x80) i += 3 * (1 << ((b[i - 1] & 0x07) + 1));
        i++;
        while (i < b.length) { const len = b[i++]; if (!len) break; i += len; }
      } else if (block === 0x21) {
        if (b[i + 1] === 0xF9) ms += (b[i + 4] | (b[i + 5] << 8)) * 10;
        i += 2;
        while (i < b.length) { const len = b[i++]; if (!len) break; i += len; }
      } else { i++; }
    }
    return ms > 0 ? ms : 2000;
  }

  function getLoadedGifDuration() {
    const url = _getLoadedGifUrl();
    if (_gifDurationCache.has(url)) return Promise.resolve(_gifDurationCache.get(url));
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.arrayBuffer(); })
      .then(buf => {
        const ms = parseGifDuration(buf);
        _gifDurationCache.set(url, ms);
        return ms;
      });
  }

  function getGifDuration(url) {
    if (_gifDurationCache.has(url)) return Promise.resolve(_gifDurationCache.get(url));
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.arrayBuffer(); })
      .then(buf => {
        const ms = parseGifDuration(buf);
        _gifDurationCache.set(url, ms);
        return ms;
      });
  }

  window._loaderSequenceRunning = false;

  function _getTheme() {
    return document.documentElement.getAttribute("theme") || DEFAULT_THEME;
  }

  function runLoaderSequence() {
    if (window._loaderSequenceRunning) return;
    const loader = document.getElementById("containerLoader");
    if (!loader) return;
    window._loaderSequenceRunning = true;

    const img = loader.querySelector("img");
    if (!img) { loader.remove(); return; }

    const finish = () => { loader.remove(); document.body.classList.remove("ws-loading"); };

    getLoadedGifDuration()
      .then(ms => {

        applyGifToImg(img, _getTheme(), "loaded");
        setTimeout(finish, ms);
      })
      .catch(() => {
        applyGifToImg(img, _getTheme(), "loaded");
        setTimeout(finish, 2000);
      });
  }

  function runCrashSequence() {
    if (window._loaderSequenceRunning) return;
    const loader = document.getElementById("containerLoader");
    if (!loader) return;
    window._loaderSequenceRunning = true;

    const img = loader.querySelector("img");
    if (!img) return;

    document.body.classList.remove("ws-loading");

    const crashSrc = getThemeGifSrc(_getTheme(), "crash");
    getGifDuration(crashSrc)
      .catch(() => 2000)
      .then(ms => {
        applyGifToImg(img, _getTheme(), "crash");
        setTimeout(() => { applyGifToImg(img, _getTheme(), "ded"); }, ms);
      });
  }

  function _dismissPageLoader(pageNum) {
    if (+window.currentPage !== pageNum) return;

    runLoaderSequence();
  }

  function buildEmbedShell(embedSrc, title, fav) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="icon" href="${fav}" crossorigin="anonymous" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    embed { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; display: block; }
    #refreshBtn {
      position: fixed; top: 8px; right: 8px; z-index: 9999;
      background: rgba(0,0,0,0.6); color: #fff; border: none;
      border-radius: 6px; padding: 4px 10px; font-family: monospace;
      font-size: 13px; cursor: pointer; opacity: 0.4; transition: opacity 0.2s;
    }
    #refreshBtn:hover { opacity: 1; }
  </style>
</head>
<body>
  <embed id="frame" src="${embedSrc}" />
  <button id="refreshBtn" title="Refresh"
    onclick="document.getElementById('frame').src=document.getElementById('frame').src">↺</button>
</body>
</html>`;
  }

  async function fetchAndOpenHTML(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw     = await res.text();
    const pageURL = URL.createObjectURL(
      new Blob([sanitizeHTML(raw)], { type: "text/html;charset=utf-8" })
    );
    window.open(pageURL, "_blank");
  }

  (function injectIgnoreGuardCSS() {
    if (document.getElementById("__ws_ignore_guard__")) return;
    const s = document.createElement("style");
    s.id = "__ws_ignore_guard__";
    s.textContent = [
      `.asset-card[data-ignore="true"]{display:none!important;opacity:0!important;width:0!important;height:0!important;margin:0!important;padding:0!important;pointer-events:none!important;overflow:hidden!important;}`,
    ].join("");
    document.head.appendChild(s);
  })();

  // Mirror every #container rule from main.css onto #favorites-container and
  // #dev-build-container so asset cards render identically on all pages.
  (function injectContainerAliasCSS() {
    if (document.getElementById("__ws_container_alias__")) return;
    const s = document.createElement("style");
    s.id = "__ws_container_alias__";
    s.textContent = `
      /* Grid layout — mirrors #container in main.css */
      #favorites-container,
      #dev-build-container {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        justify-items: center;
        gap: 15px;
        padding: 20px;
        background: transparent;
        flex-grow: 1;
        min-height: 0;
        align-content: start;
      }
      @media (max-width: 800px) {
        #favorites-container,
        #dev-build-container {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Card div — mirrors #container div */
      #favorites-container div,
      #dev-build-container div {
        width: 100%;
        max-width: 220px;
        padding: 15px 10px;
        background: none;
        text-align: center;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
      }
      #favorites-container div:hover,
      #dev-build-container div:hover {
        transform: scale(1.03);
      }

      /* Card images — mirrors #container div img */
      #favorites-container div img,
      #dev-build-container div img {
        width: 120px;
        height: 120px;
        display: block;
        border-radius: 14px;
        object-fit: contain;
        transition: transform 0.3s ease;
      }
      #favorites-container div img:hover,
      #dev-build-container div img:hover {
        transform: scale(1.05);
      }

      /* Card text — mirrors #container div h3 / p */
      #favorites-container div h3,
      #favorites-container div p,
      #dev-build-container div h3,
      #dev-build-container div p {
        color: var(--url-color);
        font-family: monospace;
        font-size: 0.9rem;
        transition: color 0.3s, text-decoration 0.3s;
      }
      #favorites-container div h3:hover,
      #favorites-container div p:hover,
      #dev-build-container div h3:hover,
      #dev-build-container div p:hover {
        color: var(--accent-color);
        text-decoration: underline;
      }
    `;
    document.head.appendChild(s);
  })();

  (function injectAssetActionStyles() {
    if (document.getElementById("__ws_asset_actions__")) return;

    if (!document.querySelector("link[href*='font-awesome']")) {
      const fa = document.createElement("link");
      fa.rel  = "stylesheet";
      fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
      document.head.appendChild(fa);
    }

    const s = document.createElement("style");
    s.id = "__ws_asset_actions__";
    s.textContent = `
      .card-actions {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 2px;
        margin-top: 4px;
        padding: 0 2px;
        line-height: 1;
        width: 100%;
      }
      .favorite-star {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 3px;
        font-size: 16px;
        line-height: 1;
        color: inherit;
        flex-shrink: 0;
        transition: transform 0.15s ease;
      }
      .asset-download-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 3px;
        font-size: 14px;
        line-height: 1;
        color: inherit;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        transition: transform 0.15s ease;
      }
      .asset-download-btn .fa { pointer-events: none; }
      .asset-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 3px;
        font-size: 14px;
        line-height: 1;
        color: var(--trench-color, #000) !important;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        transition: transform 0.15s ease;
      }
      .asset-action-btn i { pointer-events: none; }

      /* Each button grows on its own hover — the card itself no longer
         scales while the cursor is anywhere over this row (see main.css). */
      .card-actions .favorite-star:hover,
      .card-actions .asset-download-btn:hover,
      .card-actions .asset-action-btn:hover {
        transform: scale(1.3);
      }

      .description-panel {
        position: fixed;
        left: -340px;
        top: 85%;
        transform: translateY(-50%);
        width: 300px;
        transition: left .35s ease;
        z-index: 999999;
        pointer-events: none;
        background: rgba(0,0,0,0.3);
        border-left: 6px solid red;
        border-radius: 10px;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        box-shadow: none;
        padding: 12px 16px;
      }
      .description-panel.desc-visible {
        left: 20px;
        pointer-events: all;
      }
      .description-panel .alert-text {
        color: white;
        font-family: monospace;
        text-align: left;
        white-space: normal;
        word-wrap: break-word;
        line-height: 1.5;
        font-size: 13px;
      }
    `;
    document.head.appendChild(s);
  })();

  // ── Mirror #container CSS rules for the alternate container IDs ─────────────
  // main.css only targets #container and #container-discov by ID, so
  // #favorites-container and #dev-build-container inherit none of those styles.
  // We inject them here so the alternate containers look identical to #container
  // without requiring any edits to main.css.
  (function injectAltContainerCSS() {
    if (document.getElementById("__ws_alt_containers__")) return;
    const s = document.createElement("style");
    s.id = "__ws_alt_containers__";
    s.textContent = `
      /* ── Grid layout (mirrors #container) ── */
      #favorites-container,
      #dev-build-container {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        justify-items: center;
        gap: 15px;
        padding: 20px;
        background: transparent;
        flex-grow: 1;
        min-height: 0;
        align-content: start;
      }

      @media (max-width: 800px) {
        #favorites-container,
        #dev-build-container {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* ── Card box (mirrors #container div) ── */
      #favorites-container div,
      #dev-build-container div {
        width: 100%;
        max-width: 220px;
        padding: 15px 10px;
        background: none;
        text-align: center;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
      }

      #favorites-container div:hover,
      #dev-build-container div:hover {
        transform: scale(1.03);
      }

      /* ── Card images ── */
      #favorites-container div img,
      #dev-build-container div img {
        width: 120px;
        height: 120px;
        display: block;
        border-radius: 14px;
        object-fit: contain;
        transition: transform 0.3s ease;
      }

      #favorites-container div img:hover,
      #dev-build-container div img:hover {
        transform: scale(1.05);
      }

      /* ── Card text ── */
      #favorites-container div h3,
      #favorites-container div p,
      #dev-build-container div h3,
      #dev-build-container div p {
        color: var(--url-color);
        font-family: monospace;
        font-size: 0.9rem;
        transition: color 0.3s, text-decoration 0.3s;
      }

      #favorites-container div h3:hover,
      #favorites-container div p:hover,
      #dev-build-container div h3:hover,
      #dev-build-container div p:hover {
        color: var(--accent-color);
        text-decoration: underline;
      }

      /* ── version-pending pointer block ── */
      #favorites-container.version-pending,
      #dev-build-container.version-pending {
        pointer-events: none;
      }

      /* ── Hide container while the loader GIF is active ── */
      body.ws-loading #favorites-container,
      body.ws-loading #dev-build-container {
        visibility: hidden;
        height: 0;
        min-height: 0;
        overflow: hidden;
        padding: 0;
        gap: 0;
      }
    `;
    document.head.appendChild(s);
  })();

  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];

    container.innerHTML = "";
    const imagePromises = [];
    const frag          = document.createDocumentFragment();
    const sortMode      = getSortMode();
    const isFav         = (t) => window.favorites.has(safeStr(t).toLowerCase());
    const activePage    = +window.currentPage || +sessionStorage.getItem("currentPage") || 1;

    const isFavPage = window._containerMode === "favorites";
    const isDevPage = window._containerMode === "dev";
    const FAV_PAGE_SIZE = 75;
    const pageBuckets = new Map();
    // For favorites mode: maps asset object to computed fav page so the
    // card loop uses internally-counted pages, NOT asset.page from the sheet.
    const _favPageMap = new Map();
    let favPageCounter = 0;

    // For favorites mode: re-order data so favorited items appear in the order
    // they were added to the favorites Set (Set preserves insertion order).
    let orderedData = Array.isArray(data) ? data.slice() : [];
    if (isFavPage) {
      const favOrder = [...window.favorites]; // insertion-ordered keys
      const byKey    = new Map(orderedData.map(a => [safeStr(a.title).toLowerCase(), a]));
      const favItems = favOrder.map(k => byKey.get(k)).filter(Boolean);
      orderedData = favItems; // favorites page only renders favorited items
    } else if (sortMode === "alphabetical") {
      orderedData.sort((a, b) => fastCompare(safeStr(a.title), safeStr(b.title)));
    }

    for (const asset of orderedData) {
      const statusRaw = safeStr(asset.status).toLowerCase();
      const typeRaw   = safeStr(asset.type).toLowerCase();

      if (statusRaw === "hide" || statusRaw === "hidden") continue;
      if (statusRaw.split("|").map(s => s.trim()).includes("ignore")) continue;
      if (typeRaw.split("|").map(s => s.trim()).includes("ignore")) continue;

      let p;
      if (isFavPage) {
        // 75 favorited assets per page, in insertion order — completely independent
        // of the sheet's own "page" field.
        p = Math.floor(favPageCounter / FAV_PAGE_SIZE) + 1;
        _favPageMap.set(asset, p);
        favPageCounter++;
      } else {
        p = Number(asset.page) || 1;
      }
      if (!pageBuckets.has(p)) pageBuckets.set(p, []);
      pageBuckets.get(p).push(asset);
    }

    const domOrdered = [];
    for (const p of [...pageBuckets.keys()].sort((a, b) => a - b)) {
      domOrdered.push(...pageBuckets.get(p));
    }

    const badgeMap = {
      featured: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/featured-cover.png",
      new:      "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/new-cover.png",
      fixed:    "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/fixed-cover.png",
      fix:      "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/fixing.png",
    };

    const addOverlay = (wrapper, src, alt, cls, fullCover = false) => {
      const o = document.createElement("img");
      o.src = src; o.alt = alt; o.className = `status-overlay ${cls}`;
      Object.assign(o.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%", objectFit: "cover",
        pointerEvents: "none", zIndex: fullCover ? "10" : "5",
      });
      wrapper.appendChild(o);
    };

    for (const asset of domOrdered) {
      const title      = safeStr(asset.title).trim();
      const author     = safeStr(asset.author).trim();
      const imageSrc   = safeStr(asset.image) || config.fallbackImage;
      const link       = safeStr(asset.link)  || config.fallbackLink;
      // For favorites, use the internally-computed page (from _favPageMap),
      // NOT asset.page from the sheet, so fav paging is 100% independent.
      const pageNum    = isFavPage
        ? (_favPageMap.get(asset) || 1)
        : (Number(asset.page) || 1);
      const isActivePage = pageNum === activePage;

      const parseStack = (raw) => new Set(
        safeStr(raw).toLowerCase().split("|").map(s => s.trim()).filter(Boolean)
      );
      const statusSet = parseStack(asset.status);
      const typeSet   = parseStack(asset.type);

      if (statusSet.has("ignore")) continue;

      for (const t of ["shiny","disco","animated","grail"]) {
        if (statusSet.has(t)) { typeSet.add(t); statusSet.delete(t); }
      }

      if (typeSet.has("cooked")) { statusSet.add("cooked"); typeSet.delete("cooked"); }

      const card = document.createElement("div");
      card.className = "asset-card" + (isFav(title) ? " ws-favorited" : "");

      card.style.display = "none";
      Object.assign(card.dataset, {
        title:       title.toLowerCase(),
        author:      author.toLowerCase(),
        page:        String(pageNum),
        filtered:    "true",
        category:    safeStr(asset.category).toLowerCase().trim(),
        subcategory: safeStr(asset["sub-category"]).toLowerCase().trim(),
      });

      const a   = document.createElement("a");
      a.href    = link;
      a.className = "asset-link";
      a.title   = `Click to open "${title || "this asset"}" in a new tab!`;

      a.addEventListener("click", async (e) => {
        e.preventDefault();

        const incognitoMode = localStorage.getItem("incognitoMode") || "off";
        const matched       = window.assetsData?.find(row => safeStr(row.link).trim() === link);
        const resolvedLink  = matched ? safeStr(matched.link).trim()  : link;
        const renderTitle   = matched ? safeStr(matched.title).trim() || "Embed" : "Embed";
        const renderFav     = matched ? safeStr(matched.image).trim() || "" : "";

        if (
          /^https:\/\/cdn\.jsdelivr\.net\/.+\.html$/i.test(resolvedLink) ||
          /\.html\.txt$|\.txt$/.test(resolvedLink)
        ) {
          try { await fetchAndOpenHTML(resolvedLink); }
          catch (err) { console.error("[html/txt loader] fetch failed:", err); }
          return;
        }

        if (incognitoMode === "blob" && matched) {
          window.open(
            URL.createObjectURL(
              new Blob([buildEmbedShell(resolvedLink, renderTitle, renderFav)], { type: "text/html;charset=utf-8" })
            ), "_blank"
          );
        } else if (incognitoMode === "about" && matched) {
          const tab = window.open("about:blank", "_blank");
          if (tab) { tab.document.open("text/html", "replace"); tab.document.write(buildEmbedShell(resolvedLink, renderTitle, renderFav)); tab.document.close(); }
        } else {
          window.open(resolvedLink, "_blank");
        }
      });

      const wrapper = document.createElement("div");
      wrapper.className = "asset-img-wrapper";
      Object.assign(wrapper.style, { position: "relative", display: "inline-block", borderRadius: "14px" });

      const img = document.createElement("img");
      img.alt           = title;
      img.className     = "asset-img";
      img.fetchPriority = isActivePage ? "high" : "auto";

      const imgPromise = new Promise((resolve) => {
        const onLoad  = () => resolve();
        const onError = () => { img.src = config.fallbackImage; img.onload = onLoad; img.onerror = resolve; };
        img.onload  = onLoad;
        img.onerror = onError;
        img.src = imageSrc;
      });
      imagePromises.push({ promise: imgPromise, page: pageNum, card });
      wrapper.appendChild(img);

      if (typeSet.has("featured")) addOverlay(wrapper, badgeMap.featured, "featured badge", "overlay-featured");
      if (typeSet.has("new"))      addOverlay(wrapper, badgeMap.new,      "new badge",      "overlay-new");
      if (typeSet.has("fixed"))    addOverlay(wrapper, badgeMap.fixed,    "fixed badge",    "overlay-fixed");

      if (typeSet.has("grail")) {
        const grailEl = document.createElement("img");
        grailEl.src = "data:image/png;base64,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";
        grailEl.alt = "";
        grailEl.className = "grail-bg";
        wrapper.insertBefore(grailEl, wrapper.firstChild);
        wrapper.classList.add("has-grail");
      }

      if (typeSet.has("disco"))     img.classList.add("img-disco");
      if (typeSet.has("shiny"))     wrapper.classList.add("img-shiny");
      if (typeSet.has("pixelated")) img.style.imageRendering = "pixelated";
      if (typeSet.has("cover")) {

        Object.assign(wrapper.style, {
          overflow: "hidden",
          maxHeight: "250px",
          height:    "250px",
          width:     "100%",
          display:   "block",
        });
        Object.assign(img.style, {
          width:      "100%",
          height:     "var(--asset-img-size, 120px)",
          objectFit:  "cover",

          objectPosition: "center top",
          display:    "block",
        });
      }

      if (statusSet.has("fix"))  { addOverlay(wrapper, badgeMap.fix, "fixing overlay", "overlay-fix", true); card.classList.add("fix"); }
      if (statusSet.has("soon"))   card.classList.add("soon");
      if (statusSet.has("cooked")) {
        const isDmca    = typeSet.has("dmca") || statusSet.has("dmca");
        const isBlocked = typeSet.has("blocked") || statusSet.has("blocked");
        if (isDmca || isBlocked) {
          img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAADaUlEQVR42u2cy3XrIBCGFR0aoQk1oR0tqC63wM5NqAlKuVnhg7kI8ZgXCrNK7EQDn/4ZmBH2j3Pu3zKt2daJYAKcAEc2JXlwxpj/XrPWToA14MKfpcETCdADi9VnrZ0AW8DNReTB8EQALIEnNXxZARpjwJTHqdyVW30Q8CCuM8wiApnvYhUbY75C/coHZDpQo8IrUbTWOjsOCJBqpHAt2SuG4Jxzyf/370OAVE+CF4O7AmOMWbTWXyBbISqqsKVKAc65LAwPb4hVGHrByDUYtNbN8LTWzWNUI8HrvUYKnnOuS5HrKOGbq1Lu1JeDZ639QGwZ74oFTkpdewdPXA78S/DEdGNGhQcOUIr6qOA9UoGU8EABcinPGPO1itbC8//TChg8hDmNUnmgALnBeRXWKq9XfaTdGGpr2Vi32A/E4SIpq29tO+uua/PnFBj3965UFoLtzY/qKerLgax9nyyER36eGyqwB+QKdbehByYNFHklUhomEJMq9YERKSu08mogQirizgdWmlkxwrdmwpAd65Yb0rsIojcTUpPDUAWVH5ZuTDg5zElR+ekG2CL7q1OnWBBr/PSEMVk/MBVaI/shBRiGE2QVwOWnC2Ct1FO5CGNyEH7IHmuWOsolckiIEH7E5cDSVZDi5AJmOLOeTMDYB1L4Iq2FJZmoWnjaBDgBToAPMFEPlWq3GRIWKiUNWsmG11pb/JmQxwKsBRdD3Lbt8/t5nmwwVevkWwZ5Ba32WiG81Gst1yU72tECzw8Oo5Q6zzM7TmyIK1WoQsCLQzenSO9TXDtLivJy6hO/D6y5s9gKuFJf6vkIxHzmRlpSCOfuGrTyrvJfiSpzCusd54oBjyp87/JgbeecJYQpDxDFsHKKLFEr+yeVKOFd+dq27VaFd98IwlrK7ft+ubmu2cT2lF8eYkp1ueN3+77z18LHcSQrFKx61CsmhlW6wITw/NjZN9LHcXyUiG3+xtxtonMlHhS8ZQE6pe/t9Xot7/ebrBty9+n01N9CwgMH6CEuy0IKsjRkw5QjFmAMETMflioUCx7IIpJbWFKhRvU1ANjgUBWYUmOoSGiYcS4MtyeY8EgAxhBDgwjx3H4OGx4ZwBzIUJUttWsKHgU4FoClIEsrIE5wrABzYQ21cD0eIARMLmjiAI5ss6U/AfLaL2oEmU0eRi4uAAAAAElFTkSuQmCC";
          img.style.imageRendering = "pixelated";
        }
        card.classList.add("cooked");
      }

      const animatedSrc = safeStr(asset.animated || "").trim();
      const animatedSwapAllowed = typeof window.WS_Grid?.animatedSwapEnabled === "function"
        ? window.WS_Grid.animatedSwapEnabled()
        : true;
      if (typeSet.has("animated") && animatedSrc && animatedSwapAllowed) {
        const isVideo = /\.(mp4|webm|ogg)([?]|$)/i.test(animatedSrc);
        let animEl = null, animTimeout = null, isAnimating = false;

        const scheduleNext = () => {
          animTimeout = setTimeout(playAnim, (3 + Math.random() * 57) * 1000);
        };
        const playAnim = () => {
          if (isAnimating) return;
          isAnimating = true;
          animEl = document.createElement(isVideo ? "video" : "img");
          animEl.src = animatedSrc;
          if (isVideo) Object.assign(animEl, { autoplay: true, muted: true, loop: false, playsInline: true });
          animEl.className = "animated-swap";
          wrapper.insertBefore(animEl, wrapper.firstChild);
          setTimeout(() => { animEl?.remove(); animEl = null; isAnimating = false; scheduleNext(); },
            (3 + Math.random() * 5) * 1000);
        };

        if (img.complete && img.naturalWidth) scheduleNext();
        else img.addEventListener("load", scheduleNext, { once: true });

        const obs = new MutationObserver(() => {
          if (!document.contains(card)) { clearTimeout(animTimeout); animEl?.remove(); obs.disconnect(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }

      a.appendChild(wrapper);
      const titleEl  = document.createElement("h3"); titleEl.textContent  = title  || "Untitled";
      const authorEl = document.createElement("p");  authorEl.textContent = author || "";

      if (statusSet.has("cooked")) {
        const isDmca    = typeSet.has("dmca") || statusSet.has("dmca");
        const isBlocked = typeSet.has("blocked") || statusSet.has("blocked");
        if (isDmca || isBlocked) {
          a.title              = isDmca ? "DMCA Takedown — unavailable" : "Blocked — unavailable";
          authorEl.textContent = isDmca ? "DMCA TAKEDOWN" : "BLOCKED D:";
        }
      }

      const star = document.createElement("button");
      star.className = "favorite-star";
      star.innerHTML = isFav(title)
        ? `<i class="fa-solid fa-star" aria-hidden="true"></i>`
        : `<i class="fa-regular fa-star" aria-hidden="true"></i>`;
      star.title     = "Favourite";
      star.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:16px!important;line-height:1!important;color:var(--trench-color,#000)!important;display:inline-flex!important;align-items:center!important;";
      star.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.innerHTML = window.favorites.has(key)
          ? `<i class="fa-solid fa-star" aria-hidden="true"></i>`
          : `<i class="fa-regular fa-star" aria-hidden="true"></i>`;

        if (window.favorites.has(key)) {
          card.classList.add("ws-favorited");
        } else {
          card.classList.remove("ws-favorited");

          if (window._containerMode === "favorites") {
            card.style.transition = "opacity 0.22s";
            card.style.opacity    = "0";
            setTimeout(() => {
              card.style.display = "none";
              if (typeof window.renderPage === "function") window.renderPage();
            }, 230);
          }
        }
      });

      const dlBtn = document.createElement("button");
      dlBtn.className = "asset-download-btn";
      dlBtn.title     = `Download "${title || "asset"}" as HTML`;
      dlBtn.innerHTML = `<i class="fa-solid fa-download" aria-hidden="true"></i>`;
      dlBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:var(--trench-color,#000)!important;display:inline-flex!important;align-items:center!important;";
      dlBtn.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
          const assetTitle = title    || "Untitled";
          const assetUrl   = link     || "";
          const assetFav   = imageSrc || "";

          let favIconBase64 = "";
          try {
            const imgRes  = await fetch(assetFav, { mode: "cors" });
            const imgBlob = await imgRes.blob();
            favIconBase64 = await new Promise((res) => {
              const reader  = new FileReader();
              reader.onload = () => res(reader.result);
              reader.readAsDataURL(imgBlob);
            });
          } catch (_) {  }

          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${assetTitle}</title>
  <link rel="icon" type="image/png" href="${favIconBase64}" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    embed {
      position: absolute;
      top: 0; left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      display: block;
    }
  </style>
</head>
<body>
  <embed id="frame" src="${assetUrl}" />
</body>
</html>`;

          const safeFilename = assetTitle.replace(/[^a-z0-9_\-\. ]/gi, "_").trim() || "asset";
          const blob   = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href     = blobUrl;
          anchor.download = `${safeFilename}.html`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (err) {
          console.error("[asset-download] failed:", err);
        }
      });

      const descText = safeStr(asset.description || "").trim();
      const descMsg  = descText || `No description available for "${title || "this asset"}".`;

      const descBtn = document.createElement("button");
      descBtn.className = "asset-action-btn asset-desc-btn";
      descBtn.innerHTML = `<i class="fa-solid fa-circle-question" aria-hidden="true"></i>`;
      descBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:var(--trench-color,#000)!important;display:inline-flex!important;align-items:center!important;";
      descBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });

      const descPanel = document.createElement("div");
      descPanel.className = "description-panel";

      const descAlertText = document.createElement("div");
      descAlertText.className = "alert-text";
      descAlertText.textContent = descMsg;

      descPanel.appendChild(descAlertText);
      document.body.appendChild(descPanel);

      descBtn.addEventListener("mouseenter", () => descPanel.classList.add("desc-visible"));
      descBtn.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (!descPanel.matches(":hover")) descPanel.classList.remove("desc-visible");
        }, 80);
      });
      descPanel.addEventListener("mouseleave", () => descPanel.classList.remove("desc-visible"));

      const bugBtn = document.createElement("button");
      bugBtn.className = "asset-action-btn asset-bug-btn";
      bugBtn.title     = `Report a bug for "${title || "asset"}"`;
      bugBtn.innerHTML = `<i class="fa-solid fa-biohazard" aria-hidden="true"></i>`;
      bugBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:var(--trench-color,#000)!important;display:inline-flex!important;align-items:center!important;";
      bugBtn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const padletUrl = "https://padlet.com/rhap5ody/wannasmile-suggestion-report-page-t8t6pg32hl71ri9m";
        window.open(padletUrl, "_blank");
      });

      const actionsRow = document.createElement("div");
      actionsRow.className = "card-actions";
      actionsRow.style.cssText = "display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:2px!important;width:100%!important;";
      actionsRow.appendChild(star);
      actionsRow.appendChild(dlBtn);
      actionsRow.appendChild(descBtn);
      actionsRow.appendChild(bugBtn);

      card.append(a, titleEl, authorEl, actionsRow);
      frag.appendChild(card);

      if (!window._cardIndex.has(pageNum)) window._cardIndex.set(pageNum, []);
      window._cardIndex.get(pageNum).push(card);
      window._allCards.push(card);
    }

    container.appendChild(frag);
    if (window.WS_Grid) window.WS_Grid.refresh();

    if (!window._pageLoadState) window._pageLoadState = new Map();

    const pagePromiseMap = new Map();
    for (const { promise, page, card } of imagePromises) {
      if (!pagePromiseMap.has(page)) pagePromiseMap.set(page, { promises: [], cards: [] });
      pagePromiseMap.get(page).promises.push(promise);
      pagePromiseMap.get(page).cards.push(card);
    }

    for (const [pageNum, { promises, cards }] of pagePromiseMap) {
      const isActive = pageNum === activePage;

      let settled = 0;
      const total = cards.length;
      cards.forEach((card, i) => {
        promises[i].finally(() => {
          setTimeout(() => {
            card.classList.add("ready");
            settled++;
            if (settled === total && typeof window.renderPage === "function") {
              window.renderPage();
            }
          }, isActive ? i * 30 : i * 60);
        });
      });

      const pageSettled = Promise.allSettled(promises).then(() => {
        window._pageLoadState.set(pageNum, "loaded");

        if (+window.currentPage === pageNum) {
          if (isActive) {
            runLoaderSequence();
          } else {

            _dismissPageLoader(pageNum);
          }
        }
      });

      if (!window._pageLoadState.has(pageNum)) {
        window._pageLoadState.set(pageNum, pageSettled);
      }

      if (isActive) {
        pageSettled.then(() => {});

      }
    }

    if (!pagePromiseMap.has(activePage)) {
      window._pageLoadState.set(activePage, "loaded");
      runLoaderSequence();
      if (typeof window.renderPage === "function") window.renderPage();
    }

    return imagePromises;
  }

  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    window._cardIndex = new Map();
    window._allCards  = [];

    const getFilteredCards = () => window._allCards.filter(c => c.dataset.filtered === "true");
    const getPages         = () => [...window._cardIndex.keys()].sort((a, b) => a - b);

    let errorGif = document.getElementById("noResultsGif");
    if (!errorGif) {
      errorGif = document.createElement("img");
      errorGif.id        = "noResultsGif";

      if (typeof applyGifToImg === "function") {
        applyGifToImg(errorGif, _getTheme(), "searching");
      } else {
        errorGif.src = getThemeGifSrc(_getTheme(), "searching");
        errorGif.dataset.gifState = "searching";
      }
      errorGif.draggable = false;
      Object.assign(errorGif.style, {
        display: "none", position: "absolute",
        top: "50%", left: "50%", transform: "translate(-50%, 0)",
        transformOrigin: "50% 0%", width: "128px", height: "128px",
        opacity: "0", transition: "opacity 0.25s ease",
        pointerEvents: "auto", cursor: "grab", zIndex: "1000",
        imageRendering: "pixelated",
      });
      container.parentElement.appendChild(errorGif);
      initGifDrag(errorGif);
    }

    const updateVisibility = () => {
      const visible = getFilteredCards().length;
      if (visible === 0) {
        errorGif.style.display = "block";
        requestAnimationFrame(() => (errorGif.style.opacity = "1"));
      } else {
        errorGif.style.opacity = "0";
        setTimeout(() => { if (parseFloat(errorGif.style.opacity) === 0) errorGif.style.display = "none"; }, 250);
      }
    };

    const _isFavPage = window._containerMode === "favorites";

    window.renderPage = () => {
      const pages = getPages();

      if (!pages.length) {
        // Only touch the UI once a fetch has actually resolved
        // (window.assetsData is set, even to []). Before that, 0 pages just
        // means data hasn't loaded yet — do nothing, same as before, since
        // the loading screen covers that state.
        //
        // Note: the searching/no-results gif is intentionally NOT shown here.
        // It's reserved for "actively searching and found nothing" — zero
        // total assets just means a plain empty page.
        if (Array.isArray(window.assetsData)) {
          if (pageIndicator) pageIndicator.textContent = "Page 1/1";
          sessionStorage.setItem("currentPage", 1);
        }
        return;
      }

      if (!window._pageRestored) {
        const saved = +sessionStorage.getItem("currentPage") || pages[0];
        window.currentPage = pages.includes(saved) ? saved : pages[0];
        window._pageRestored = true;
      }

      const cur = +window.currentPage;
      const pageState = window._pageLoadState?.get(cur);
      const pageFullyLoaded = pageState === "loaded";

      for (const [pageNum, cards] of window._cardIndex) {
        const onThisPage = pageNum === cur;
        for (const c of cards) {
          const isReady   = c.classList.contains("ready");

          const isFavOK   = !_isFavPage || c.classList.contains("ws-favorited");

          const want = onThisPage && isReady && pageFullyLoaded && c.dataset.filtered === "true" && isFavOK ? "flex" : "none";
          if (c.style.display !== want) c.style.display = want;
        }
      }

      if (pageIndicator) {
        const idx = pages.indexOf(cur);
        pageIndicator.textContent = `Page ${idx + 1}/${pages.length}`;
      }

      sessionStorage.setItem("currentPage", cur);
      updateVisibility();
    };

    window.filterAssets = (q) => {
      const query      = safeStr(q).toLowerCase().trim();
      const words      = query.length ? query.split(/\s+/) : null;
      const isSearching = query.length > 0;

      for (const c of window._allCards) {
        if (!words) { c.dataset.filtered = "true"; continue; }
        const haystack = c.dataset.title + " " + c.dataset.author;
        let hit = haystack.includes(query);
        if (!hit) for (const w of words) if (haystack.includes(w)) { hit = true; break; }
        c.dataset.filtered = hit ? "true" : "false";
      }

      if (isSearching) {
        for (const c of window._allCards) {

          const show = c.classList.contains("ready") && c.dataset.filtered === "true";
          c.style.display = show ? "flex" : "none";
        }
        if (pageIndicator) pageIndicator.textContent = "Searching all pages…";
        const pagesAnchor = document.querySelector(".pages-anchor");
        if (pagesAnchor) pagesAnchor.style.visibility = "hidden";
      } else {
        const pagesAnchor = document.querySelector(".pages-anchor");
        if (pagesAnchor) pagesAnchor.style.visibility = "";
        renderPage();
      }

      updateVisibility();
    };

    window.prevPage = () => {
      if (window._reloading) return;
      const pages = getPages();
      const i     = pages.indexOf(+window.currentPage);
      window.currentPage = i <= 0 ? pages[pages.length - 1] : pages[i - 1];
      _handlePageNavigation(+window.currentPage);
      renderPage();
    };

    window.nextPage = () => {
      if (window._reloading) return;
      const pages = getPages();
      const i     = pages.indexOf(+window.currentPage);
      window.currentPage = i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      _handlePageNavigation(+window.currentPage);
      renderPage();
    };

    function _handlePageNavigation(pageNum) {
      const pageState = window._pageLoadState?.get(pageNum);
      if (pageState === "loaded" || pageState === undefined) {

        return;
      }

      const loader = document.getElementById("containerLoader");
      if (!loader) {

        const newLoader = document.createElement("div");
        newLoader.id = "containerLoader";
        const loaderImg = document.createElement("img");
        loaderImg.alt = "";
        applyGifToImg(loaderImg, _getTheme(), "loading");
        newLoader.appendChild(loaderImg);
        document.body.appendChild(newLoader);
        window._loaderSequenceRunning = false;
        document.body.classList.add("ws-loading");
      } else {

        const img = loader.querySelector("img");
        if (img) applyGifToImg(img, _getTheme(), "loading");
        window._loaderSequenceRunning = false;
        document.body.classList.add("ws-loading");
        loader.style.display = "";
      }

      Promise.resolve(pageState).then(() => {
        _dismissPageLoader(pageNum);
      });
    }

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));

    // Named paging buttons used by favorites.html and dev.html (no inline JS in HTML).
    const favPrev = document.getElementById("favPrevBtn");
    const favNext = document.getElementById("favNextBtn");
    const devPrev = document.getElementById("devPrevBtn");
    const devNext = document.getElementById("devNextBtn");
    if (favPrev) favPrev.addEventListener("click", () => window.prevPage?.());
    if (favNext) favNext.addEventListener("click", () => window.nextPage?.());
    if (devPrev) devPrev.addEventListener("click", () => window.prevPage?.());
    if (devNext) devNext.addEventListener("click", () => window.nextPage?.());

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage();

    (function initSubHeaderFilter() {
      // Category comes from each button's data-category attribute (falling
      // back to its label text), so new categories can be added purely in
      // HTML — no JS changes needed.
      let activeCategory = null;
      const subBtns = document.querySelectorAll(".sub-header button");
      if (!subBtns.length) return;

      function applySubHeaderFilter() {
        const pagesAnchor = document.querySelector(".pages-anchor");

        for (const c of window._allCards || []) {
          if (!activeCategory) {
            c.dataset.filtered = "true";
            continue;
          }
          const cat = c.dataset.category    || "";
          const sub = c.dataset.subcategory || "";
          c.dataset.filtered = (cat === activeCategory || sub === activeCategory)
            ? "true"
            : "false";
        }

        if (!activeCategory) {

          if (pagesAnchor) pagesAnchor.style.visibility = "";
          if (pageIndicator) {
            const pages = getPages();
            const idx   = pages.indexOf(+window.currentPage);
            pageIndicator.textContent = idx >= 0 ? `Page ${idx + 1}/${pages.length}` : `Page 1/${pages.length}`;
          }
          if (typeof renderPage === "function") renderPage();
        } else {

          if (pagesAnchor) pagesAnchor.style.visibility = "hidden";
          if (pageIndicator) pageIndicator.textContent = "Browsing all pages…";
          for (const c of window._allCards || []) {
            const show = c.classList.contains("ready") && c.dataset.filtered === "true";
            c.style.display = show ? "flex" : "none";
          }
          if (typeof updateVisibility === "function") updateVisibility();
        }
      }

      subBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const cat = (btn.dataset.category || btn.textContent).trim().toLowerCase();
          if (!cat) return;

          if (activeCategory === cat) {
            activeCategory = null;
            btn.classList.remove("active");
          } else {
            activeCategory = cat;
            subBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
          }
          applySubHeaderFilter();
        });
      });
    })();
  }

  const SEARCH_QUOTES_URL = "system/json/searchQuotes.json";
  let _searchQuotes     = null;
  let _searchQuotesIdx  = 0;

  async function _loadSearchQuotes() {
    if (_searchQuotes !== null) return _searchQuotes;
    try {
      const res = await fetch(SEARCH_QUOTES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      _searchQuotes = Array.isArray(data) ? data.filter(q => typeof q === "string" && q.trim()) : [];
    } catch {
      _searchQuotes = [];
    }
    return _searchQuotes;
  }

  function _nextSearchQuote() {
    if (!_searchQuotes || !_searchQuotes.length) return "Search assets...";
    const q = _searchQuotes[_searchQuotesIdx % _searchQuotes.length];
    _searchQuotesIdx++;
    return q;
  }

  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;

    const FADE = 450, HOLD = 4000;

    // Fades the input out, swaps the placeholder text, then fades it back
    // in. The actual visual smoothing lives in main.css (.fade-out/.fade-in
    // transition opacity+transform); this just drives the class swap on a
    // timeline that matches the CSS transition duration.
    const fadePlaceholder = (input, text, cb) => {
      input.classList.remove("fade-in");
      // Force reflow so re-adding fade-out always restarts the transition,
      // even if called back-to-back.
      void input.offsetWidth;
      input.classList.add("fade-out");
      setTimeout(() => {
        input.placeholder = text;
        input.classList.remove("fade-out");
        void input.offsetWidth;
        input.classList.add("fade-in");
        setTimeout(() => { input.classList.remove("fade-in"); cb?.(); }, FADE);
      }, FADE);
    };

    window.startPlaceholderCycle = () => {
      if (window._placeholderRunning) return;
      window._placeholderRunning = true;

      _loadSearchQuotes();

      const loop = async () => {
        // 1. A quote/alt phrase (falls back to "Search assets..." if the
        //    quotes file hasn't loaded or is empty).
        await new Promise(r => fadePlaceholder(searchInput, _nextSearchQuote(), r));
        await delay(HOLD);

        // 2. The live asset count for the current page.
        const curPageCards = window._cardIndex?.get(+window.currentPage) || [];
        const visible = curPageCards.filter(c => c.dataset.filtered === "true").length;
        await new Promise(r => fadePlaceholder(searchInput, `${visible} assets on this page`, r));
        await delay(HOLD);

        if (window._placeholderRunning) loop();
      };
      loop();
    };
  }

  // _versionReady resolves with the raw sheet data so version.js can call
  // applyVersionUI without a second network round-trip.
  let _resolveVersionReady;
  window._versionReady = new Promise(res => { _resolveVersionReady = res; });

  // NOTE: applyVersionUI has been moved to version.js.
  // version.js awaits window._versionReady (resolved with raw data by loadAssets)
  // and handles all version display logic independently.

  const ASSETS_CACHE_KEY = "__ws_assetsCache__";

  // Structural check only — an empty array is a legitimate "no assets yet"
  // response, not a corrupt one, so it's still treated as valid data.
  function _isValidAssetsShape(data) {
    return Array.isArray(data);
  }

  async function loadAssets() {
    const fetchUrl = window._activeFetchUrl || config.sheetUrl;
    let raw;

    // Network-first: every page load (including a plain browser refresh)
    // hits the sheet directly, so sheet edits show up immediately without
    // needing to clear sessionStorage or hit the in-app reload button.
    // The sessionStorage cache is kept purely as an offline/error fallback —
    // it's read only if the live fetch fails, never used to skip a fetch.
    const readCache = () => {
      try { return JSON.parse(sessionStorage.getItem(ASSETS_CACHE_KEY) || "null"); }
      catch { return null; }
    };

    try {
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      raw = await res.json();
      if (!_isValidAssetsShape(raw)) {
        console.error("[loadAssets] Network response is not a valid array:", raw);
        throw new Error("Invalid data from network");
      }
      try { sessionStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(raw)); } catch {  }
    } catch (err) {
      const cached = readCache();
      if (cached !== null && _isValidAssetsShape(cached)) {
        console.warn("[loadAssets] Live fetch failed — falling back to last cached data.", err);
        raw = cached;
      } else {
        console.error("[loadAssets] fetch failed and no valid cache to fall back to:", err);
        _resolveVersionReady();
        runCrashSequence();
        throw err;
      }
    }

    // Resolve the _versionReady promise so version.js can display the version UI.
    // version.js is responsible for calling applyVersionUI; we just pass it the raw data
    // via the resolved promise value so it can skip a second network round-trip.
    _resolveVersionReady(raw);

    // A row only counts as a real asset if it has a title or a link — matches
    // the check used on the discovery page. Rows that merely have *some*
    // stray value (a default status, a page number, etc.) but no title/link
    // are blank placeholder rows and must not be rendered as empty cards.
    const data = raw.filter(i => i && (safeStr(i.title).trim() || safeStr(i.link).trim()));
    window.assetsData = data;

    const savedPage = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage   = savedPage;
    window._pageRestored = true;

    const earlyIndicator = window.dom?.pageIndicator;
    if (earlyIndicator) earlyIndicator.textContent = `Page ${savedPage}`;

    getLoadedGifDuration().catch(() => {});

    const promises = createAssetCards(data);

    const activePromises = promises.filter(p => p.page === savedPage).map(p => p.promise);
    const settle         = activePromises.length ? Promise.all(activePromises) : Promise.resolve();
    settle.finally(() => {
      if (typeof window._restoreScrollY === "function") window._restoreScrollY();
    });

    return true;
  }

  window._reloading           = false;
  window._reloadCooldownUntil = 0;
  const RELOAD_COOLDOWN_MS    = 15000;

  window.reloadAssets = async function () {
    if (window._reloading) return;
    window._reloading          = true;
    window._pageRestored       = false;
    window._placeholderRunning = false;

    sessionStorage.removeItem(ASSETS_CACHE_KEY);
    sessionStorage.removeItem("scrollY");

    window._cardIndex = new Map();
    window._allCards  = [];
    window._pageLoadState = new Map();

    document.body.classList.add("ws-loading");

    document.getElementById("containerLoader")?.remove();
    const loader = document.createElement("div");
    loader.id = "containerLoader";

    const loaderImg = document.createElement("img");
    loaderImg.alt = "";
    applyGifToImg(loaderImg, _getTheme(), "loading");
    loader.appendChild(loaderImg);
    document.body.appendChild(loader);
    window._loaderSequenceRunning = false;

    window._versionReady = Promise.resolve();
    _resolveVersionReady = () => {};

    try {
      await loadAssets();
      window._reloadCooldownUntil = Date.now() + RELOAD_COOLDOWN_MS;
      if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
      return true;
    } catch {
      throw new Error("reload failed");
    } finally {
      window._reloading = false;
    }
  };

  function initMuteButton() {
    const MUTE_KEY = "ws_muted";

    window._quotesMuted = localStorage.getItem(MUTE_KEY) === "true";

    function _applyAudioMute(muted) {
      document.querySelectorAll("audio, video").forEach(a => { a.muted = muted; });
    }

    _applyAudioMute(window._quotesMuted);

    const _audioObserver = new MutationObserver(() => {
      _applyAudioMute(window._quotesMuted);
    });
    _audioObserver.observe(document.body, { childList: true, subtree: true });

    window.WS_Audio = {
      setMuted: function (value) {
        window._quotesMuted = !!value;
        _applyAudioMute(window._quotesMuted);
      },
      isMuted: function () {
        return window._quotesMuted;
      }
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    initPaging();
    initPlaceholders();
    initMuteButton();

    window.applyThemeGifs?.(_getTheme());

    await loadAssets().catch(() => {});

    if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
    console.log("Ready :)");
  });
})();

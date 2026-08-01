"use strict";

/* ==========================================================
   Asset Grid Settings
   ----------------------------------------------------------
   Replaces the old single hard breakpoint (5 cols -> 2 cols
   at 800px) with a smoothly graduated, container-width-aware
   column/image-size calculation. This fixes the "looks
   terrible when you ctrl +/- zoom" issue, since browser page
   zoom changes the effective CSS width available to each
   grid container, which we now react to continuously via
   ResizeObserver instead of jumping between two fixed states.

   Also exposes window.WS_Grid = { setPerRow(n), setImgScale(n),
   setOverlaysVisible(bool), setAnimatedSwapEnabled(bool), reset() }
   so the Settings page can let a user pin a specific number of
   assets per row, scale image size independently of column count,
   and hide status badges / disable animated hover-swap previews.
   All of it is persisted in localStorage ("assetsPerRow" absent
   means "auto", the responsive default) and applies on every page
   that renders asset cards, not just the Settings page itself.
   ========================================================== */

const WS_GRID_SELECTORS = [
  "#container",
  "#container-discov",
  "#favorites-container",
  "#dev-build-container",
];

const WS_GRID_KEY = "assetsPerRow";
const WS_GRID_MIN = 1;
const WS_GRID_MAX = 8;
const WS_GRID_DEFAULT_MAX_COLS = 5; // cap for auto/responsive mode
const WS_GRID_GAP = 15;
const WS_GRID_PAD = 20;
const WS_GRID_TARGET_CARD = 220; // desired card width when auto-sizing

// Independent "how big are the images" control. This is a scale factor
// applied on TOP of whatever size the column math above already picked —
// it doesn't change how many columns there are, just how large the
// image within each card renders (card size grows a little too, just
// enough that a bigger image never spills out of its card).
const WS_IMG_SCALE_KEY = "assetImgScale";
const WS_IMG_SCALE_MIN = 0.5;
const WS_IMG_SCALE_MAX = 1.5;

// Toggle keys for the extra visual flourishes on asset cards.
const WS_HIDE_OVERLAYS_KEY = "wsHideOverlays";       // "1" = hide status badges
const WS_DISABLE_ANIM_KEY  = "wsDisableAnimatedSwap"; // "1" = disable hover-swap previews

function _getOverride() {
  const raw = localStorage.getItem(WS_GRID_KEY);
  if (raw === null || raw === "") return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  return Math.max(WS_GRID_MIN, Math.min(WS_GRID_MAX, n));
}

function _getImgScale() {
  const raw = localStorage.getItem(WS_IMG_SCALE_KEY);
  if (raw === null || raw === "") return 1;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(WS_IMG_SCALE_MIN, Math.min(WS_IMG_SCALE_MAX, n));
}

function _computeAutoColumns(width) {
  const cols = Math.round((width + WS_GRID_GAP) / (WS_GRID_TARGET_CARD + WS_GRID_GAP));
  return Math.max(1, Math.min(WS_GRID_DEFAULT_MAX_COLS, cols));
}

function _applyToContainer(el) {
  if (!el) return;
  const width = el.clientWidth || el.getBoundingClientRect().width;
  if (!width) return;

  const override = _getOverride();
  const cols = override || _computeAutoColumns(width);

  const cardWidth = (width - WS_GRID_PAD * 2 - WS_GRID_GAP * (cols - 1)) / cols;
  const autoImgSize = Math.max(56, Math.min(260, Math.round(cardWidth * 0.72)));
  const scale = _getImgScale();
  const imgSize = Math.max(40, Math.min(320, Math.round(autoImgSize * scale)));
  const cardSize = Math.max(90, Math.round(cardWidth), imgSize + 40);

  el.style.setProperty("--assets-per-row", String(cols));
  el.style.setProperty("--asset-img-size", imgSize + "px");
  el.style.setProperty("--asset-card-size", cardSize + "px");
}

function _findContainers() {
  return WS_GRID_SELECTORS
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);
}

function applyGridSettings() {
  _findContainers().forEach(_applyToContainer);
}

function _observeContainers() {
  const containers = _findContainers();
  if (!containers.length) return;

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => applyGridSettings());
    containers.forEach((el) => ro.observe(el));
  }

  // Belt-and-suspenders for browsers/edge-cases where ResizeObserver
  // doesn't fire on a pure page-zoom change.
  window.addEventListener("resize", applyGridSettings);

  applyGridSettings();
}

function _applyVisualToggles() {
  document.body.classList.toggle("ws-hide-overlays", localStorage.getItem(WS_HIDE_OVERLAYS_KEY) === "1");
}

/* ── public API for the Settings page ─────────────────────── */
window.WS_Grid = {
  getOverride: _getOverride,
  setPerRow(n) {
    const clamped = Math.max(WS_GRID_MIN, Math.min(WS_GRID_MAX, parseInt(n, 10) || WS_GRID_MIN));
    localStorage.setItem(WS_GRID_KEY, String(clamped));
    applyGridSettings();
    return clamped;
  },
  reset() {
    localStorage.removeItem(WS_GRID_KEY);
    localStorage.removeItem(WS_IMG_SCALE_KEY);
    applyGridSettings();
  },
  refresh: applyGridSettings,

  getImgScale: _getImgScale,
  setImgScale(n) {
    const clamped = Math.max(WS_IMG_SCALE_MIN, Math.min(WS_IMG_SCALE_MAX, parseFloat(n) || 1));
    localStorage.setItem(WS_IMG_SCALE_KEY, String(clamped));
    applyGridSettings();
    return clamped;
  },

  // Read elsewhere (main.js) to decide whether to skip the animated
  // hover-swap preview entirely for a given asset.
  animatedSwapEnabled() {
    return localStorage.getItem(WS_DISABLE_ANIM_KEY) !== "1";
  },
  setOverlaysVisible(visible) {
    if (visible) localStorage.removeItem(WS_HIDE_OVERLAYS_KEY);
    else localStorage.setItem(WS_HIDE_OVERLAYS_KEY, "1");
    _applyVisualToggles();
  },
  setAnimatedSwapEnabled(enabled) {
    if (enabled) localStorage.removeItem(WS_DISABLE_ANIM_KEY);
    else localStorage.setItem(WS_DISABLE_ANIM_KEY, "1");
  },
};

/* ── init ──────────────────────────────────────────────────── */
function _init() {
  _observeContainers();
  _applyVisualToggles(); // runs on every page — overlays/animation prefs apply site-wide

  // The asset grid is populated asynchronously (fetch + render), so
  // containers may not exist yet, or may still be empty (clientWidth
  // can be 0 before content lays out). Re-apply a few times shortly
  // after load to catch that, on top of the ResizeObserver.
  let tries = 0;
  const retry = setInterval(() => {
    applyGridSettings();
    if (++tries >= 10) clearInterval(retry);
  }, 300);

  /* ── Settings page wiring ── */
  const perRowInput  = document.getElementById("assetsPerRowInput");
  const perRowValue  = document.getElementById("assetsPerRowValue");
  const resetBtn     = document.getElementById("assetsPerRowReset");
  const imgScaleInput = document.getElementById("assetImgScaleInput");
  const imgScaleValue = document.getElementById("assetImgScaleValue");
  const overlaysToggle = document.getElementById("showOverlaysToggle");
  const animToggle      = document.getElementById("animatedSwapToggle");

  if (!perRowInput && !resetBtn && !imgScaleInput && !overlaysToggle && !animToggle) return;

  const current = _getOverride();
  if (perRowInput) {
    perRowInput.value = current || perRowInput.value || 5;
    if (perRowValue) {
      perRowValue.textContent = current ? String(current) : "Auto (default)";
    }
    perRowInput.addEventListener("input", () => {
      const val = window.WS_Grid.setPerRow(perRowInput.value);
      if (perRowValue) perRowValue.textContent = String(val);
      applyGridSettings();
    });
  }

  if (imgScaleInput) {
    const currentScale = _getImgScale();
    imgScaleInput.value = Math.round(currentScale * 100);
    if (imgScaleValue) imgScaleValue.textContent = `${imgScaleInput.value}%`;
    imgScaleInput.addEventListener("input", () => {
      const pct = window.WS_Grid.setImgScale(imgScaleInput.value / 100) * 100;
      if (imgScaleValue) imgScaleValue.textContent = `${Math.round(pct)}%`;
    });
  }

  if (overlaysToggle) {
    overlaysToggle.checked = localStorage.getItem(WS_HIDE_OVERLAYS_KEY) !== "1";
    overlaysToggle.addEventListener("change", () => {
      window.WS_Grid.setOverlaysVisible(overlaysToggle.checked);
    });
  }

  if (animToggle) {
    animToggle.checked = window.WS_Grid.animatedSwapEnabled();
    animToggle.addEventListener("change", () => {
      window.WS_Grid.setAnimatedSwapEnabled(animToggle.checked);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      window.WS_Grid.reset();
      if (perRowInput) perRowInput.value = 5;
      if (perRowValue) perRowValue.textContent = "Auto (default)";
      if (imgScaleInput) imgScaleInput.value = 100;
      if (imgScaleValue) imgScaleValue.textContent = "100%";
      if (typeof showToast === "function") showToast("Asset grid layout reset to default.");
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _init);
} else {
  _init();
}

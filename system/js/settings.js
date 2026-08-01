"use strict";

const _REAL_TITLE   = (function() {
  // If cloak is on, restore real title from a temp storage trick —
  // but simplest: capture before cloak mutates title (themify runs first,
  // so if cloak is active this will already be the cloaked title).
  // We store the original on first non-cloaked load.
  const stored = localStorage.getItem("_realTitle");
  if (!isCloakOnRaw()) {
    // Not cloaked — record the real title now
    localStorage.setItem("_realTitle", document.title);
    return document.title;
  }
  return stored || document.title;
})();

const _REAL_FAVICON = (function() {
  const stored = localStorage.getItem("_realFavicon");
  if (!isCloakOnRaw()) {
    const href = (document.querySelector("link[rel~='icon']") || {}).href || "";
    localStorage.setItem("_realFavicon", href);
    return href;
  }
  return stored || "";
})();

function isCloakOnRaw() {
  return localStorage.getItem("cloakEnabled") === "true";
}

function isCloakOn() {
  return localStorage.getItem("cloakEnabled") === "true";
}

function applyCloak() {
  if (!isCloakOn()) return;
  const title = localStorage.getItem("cloakTitle");
  const icon  = localStorage.getItem("cloakIcon");
  if (title) document.title = title;
  if (icon && typeof setFavicon === "function") setFavicon(icon);
}

function _removeCloak() {
  // Restore real title
  document.title = _REAL_TITLE;
  // Restore real favicon via setFavicon helper if available
  if (typeof setFavicon === "function") setFavicon(_REAL_FAVICON);
  // Also directly reset favicon link tags as a reliable fallback
  const realFav = _REAL_FAVICON || localStorage.getItem("_realFavicon") || "";
  document.querySelectorAll("link[rel~='icon']").forEach(el => {
    if (realFav) el.href = realFav;
  });
  // Force title reset in next tick to override any delayed mutations
  setTimeout(() => { document.title = _REAL_TITLE; }, 0);
}

function toggleCloak() {
  const nowOn = !isCloakOn();
  localStorage.setItem("cloakEnabled", String(nowOn));

  if (nowOn) {
    if (!localStorage.getItem("cloakTitle")) {
      localStorage.setItem("cloakTitle", "Google");
      localStorage.setItem("cloakIcon",  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/3840px-Google_Favicon_2025.svg.png");
    }
    applyCloak();
    showToast("🔒 Cloak ON");
  } else {
    _removeCloak();
    showToast("🔓 Cloak OFF");
  }

  _syncCloakBtn();
}

function _syncCloakBtn() {
  const btn = document.getElementById("cloak-btn");
  if (!btn) return;
  const img = btn.querySelector("img");
  if (img) {
    img.src = isCloakOn() ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABHUlEQVR42u2ZSQ7CMAxFscX9rxw2sEBqogwekva9ZVUc+3tqy+sFAAAAAAAAAAAAAABPQa4ullLK300icmJwPXHojKETg6+hT28BtVb0pOxXBTi155vDrhKTeil7QvabAtQU21mEmm+titYIlXfM/I/3XdZejzhXlSArge8yLFf81oyy26H0uwWQLyeuvR6/xUrpaJGs/FGrfo9sB8tk6E79mHGGjvZVpgg9tkdbUWeGS4YIHsEPDcHZIFeHo/c5EtWPow562g6tgOzXXZctcKeXIbU6KOqJsXXOjAhiFbxnpYzaH0mErJaX9XCztNdjS6MHT+s31vZMZoBFmWVtgJ4W1KjM32YN7vxtIPRR2GNnZ4jLX2MIAAAAAPBQPsY6uD6oVnNjAAAAAElFTkSuQmCC" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABlUlEQVR42u1ayw7DIAwbiP//5e46TR2QYBum2uctDiYvCq+XYRiGYRhPRdlBel3XdetMKXJ/6tMjwAI8XYAWzdcdebpSX0b+1lWCkxdPS4ETRcj6NBTgVwidJMJKW61q1Xv/QduDD0JRpVFRErUfKdQFHW7s1BjxRLtUURacnqMMm9SzQNThqHNs+5DD0MhJ1NDE5KFEAGtaZHBCa4BqTEbyl13kq2eMLV1glXS2sK3ao80B2V3Ltris/YgAFVGAWDODgnM4jPyavGZURo3OGa7exPhprzF3MLoQ5Dg9a6OychMp3IytbAuu30Zmd4k5p7M47tZXZ3+o7PHow1JvPY21iyxhZnyMiOV7AfZuLZ3UQJy9iNgWAafcLzSls8pFz9aCx9cAyYeL7M4ruoa7gKLAIS48WPVDFgEREZTXbk6Bf+jzzPZJjYBMLVA/yGjqkDvtbQG9Buw4C8gGoUi4Iu/6kGkCvxtkfCxFcMoEYIUvi6swHcs6yrBJPwypqzsqwuppDsmHrNP7/ukvUw3DMAzDMP4Wb7ZTRIWrphYgAAAAAElFTkSuQmCC";
  }
}

applyCloak();

window.addEventListener("storage", (e) => {
  if (e.key === "cloakEnabled" || e.key === "cloakTitle" || e.key === "cloakIcon") {
    isCloakOn() ? applyCloak() : _removeCloak();
    _syncCloakBtn();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("cloak-btn");
  if (!btn) return;

  // Set initial image state
  const img = btn.querySelector("img");
  if (img) {
    img.src = isCloakOn() ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABHUlEQVR42u2ZSQ7CMAxFscX9rxw2sEBqogwekva9ZVUc+3tqy+sFAAAAAAAAAAAAAABPQa4ullLK300icmJwPXHojKETg6+hT28BtVb0pOxXBTi155vDrhKTeil7QvabAtQU21mEmm+titYIlXfM/I/3XdZejzhXlSArge8yLFf81oyy26H0uwWQLyeuvR6/xUrpaJGs/FGrfo9sB8tk6E79mHGGjvZVpgg9tkdbUWeGS4YIHsEPDcHZIFeHo/c5EtWPow562g6tgOzXXZctcKeXIbU6KOqJsXXOjAhiFbxnpYzaH0mErJaX9XCztNdjS6MHT+s31vZMZoBFmWVtgJ4W1KjM32YN7vxtIPRR2GNnZ4jLX2MIAAAAAPBQPsY6uD6oVnNjAAAAAElFTkSuQmCC" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABlUlEQVR42u1ayw7DIAwbiP//5e46TR2QYBum2uctDiYvCq+XYRiGYRhPRdlBel3XdetMKXJ/6tMjwAI8XYAWzdcdebpSX0b+1lWCkxdPS4ETRcj6NBTgVwidJMJKW61q1Xv/QduDD0JRpVFRErUfKdQFHW7s1BjxRLtUURacnqMMm9SzQNThqHNs+5DD0MhJ1NDE5KFEAGtaZHBCa4BqTEbyl13kq2eMLV1glXS2sK3ao80B2V3Ltris/YgAFVGAWDODgnM4jPyavGZURo3OGa7exPhprzF3MLoQ5Dg9a6OychMp3IytbAuu30Zmd4k5p7M47tZXZ3+o7PHow1JvPY21iyxhZnyMiOV7AfZuLZ3UQJy9iNgWAafcLzSls8pFz9aCx9cAyYeL7M4ruoa7gKLAIS48WPVDFgEREZTXbk6Bf+jzzPZJjYBMLVA/yGjqkDvtbQG9Buw4C8gGoUi4Iu/6kGkCvxtkfCxFcMoEYIUvi6swHcs6yrBJPwypqzsqwuppDsmHrNP7/ukvUw3DMAzDMP4Wb7ZTRIWrphYgAAAAAElFTkSuQmCC";
  }
  btn.title = "Toggle tab cloak";
  btn.addEventListener("click", toggleCloak);
});

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  // Escape = panic redirect
  if (e.key === "Escape") {
    const url = localStorage.getItem("panicURL");
    if (url) window.location.replace(url);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".settings-page")) return;

  const webnameInput   = document.getElementById("webname");
  const webiconInput   = document.getElementById("webicon");
  const presetCloakSel = document.getElementById("presetCloaks");
  const panicInput     = document.getElementById("panicURL");
  const panicPresetSel = document.getElementById("presetPanic");
  const passInput      = document.getElementById("pass");

  // Populate fields from storage
  if (webnameInput) webnameInput.value = localStorage.getItem("cloakTitle") || "";
  if (webiconInput) webiconInput.value = localStorage.getItem("cloakIcon")  || "";
  if (panicInput)   panicInput.value   = localStorage.getItem("panicURL")   || "";

  // Cloak presets
  const CLOAK_PRESETS = {
    google:    { title: "Google",                           icon: "icons/google.png"    },
    drive:     { title: "My Drive - Google Drive",          icon: "icons/drive.png"     },
    classroom: { title: "Classes",                          icon: "icons/classroom.png" },
    newtab:    { title: "New Tab",                          icon: "icons/newtab.png"    },
    docs:      { title: "Untitled document - Google Docs",  icon: "icons/docs.png"      },
    schoology: { title: "Schoology",                        icon: "icons/schoology.png" },
    outlook:   { title: "Outlook – Mail",                   icon: "icons/outlook.png"   },
    canvas:    { title: "Dashboard – Canvas",               icon: "icons/canvas.png"    },
  };

  presetCloakSel?.addEventListener("change", () => {
    const p = CLOAK_PRESETS[presetCloakSel.value];
    if (!p) return;
    if (webnameInput) webnameInput.value = p.title;
    if (webiconInput) webiconInput.value = p.icon;
  });

  // Panic presets
  const PANIC_PRESETS = {
    google:    "https://www.google.com",
    drive:     "https://drive.google.com",
    classroom: "https://classroom.google.com",
    docs:      "https://docs.google.com",
    canvas:    "https://canvas.instructure.com",
    schoology: "https://app.schoology.com",
    outlook:   "https://outlook.office.com",
    bing:      "https://www.bing.com",
    wikipedia: "https://www.wikipedia.org",
  };

  panicPresetSel?.addEventListener("change", () => {
    const url = PANIC_PRESETS[panicPresetSel.value];
    if (url && panicInput) panicInput.value = url;
  });

  window.setCloakCookie = function (e) {
    e?.preventDefault();
    const title = webnameInput?.value.trim() || "";
    const icon  = webiconInput?.value.trim() || "";
    if (!title && !icon) return showToast("Enter a title or icon URL first.");
    if (title) localStorage.setItem("cloakTitle", title);
    if (icon)  localStorage.setItem("cloakIcon",  icon);
    localStorage.setItem("cloakEnabled", "true");
    applyCloak();
    _syncCloakBtn();
    showToast("Cloak set and enabled!");
  };

  window.clearCloak = function () {
    localStorage.removeItem("cloakTitle");
    localStorage.removeItem("cloakIcon");
    localStorage.setItem("cloakEnabled", "false");
    _removeCloak();
    if (webnameInput)   webnameInput.value   = "";
    if (webiconInput)   webiconInput.value   = "";
    if (presetCloakSel) presetCloakSel.value = "";
    _syncCloakBtn();
    showToast("Cloak cleared.");
  };

  window.setPanicMode = function (e) {
    e?.preventDefault();
    const url = panicInput?.value.trim();
    if (!url) return showToast("Enter a panic URL first.");
    try { new URL(url); } catch { return showToast("Invalid URL — include https://"); }
    localStorage.setItem("panicURL", url);
    showToast("Panic URL saved! Press ESC to trigger.");
  };

  window.clearPanicMode = function () {
    localStorage.removeItem("panicURL");
    if (panicInput)     panicInput.value     = "";
    if (panicPresetSel) panicPresetSel.value = "";
    showToast("Panic URL cleared.");
  };

  window.setPassword = function (e) {
    e?.preventDefault();
    const pw = passInput?.value.trim();
    if (!pw) return showToast("Enter a password first.");
    localStorage.setItem("accessPassword", pw);
    showToast("Access password set!");
  };

  window.delPassword = function () {
    localStorage.removeItem("accessPassword");
    if (passInput) passInput.value = "";
    showToast("Password cleared.");
  };
});
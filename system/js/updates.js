"use strict";

// "Updates & changes" announcement modal. It opens by itself whenever the
// site has a new update, meaning the latest commit on the live repo's main
// branch is not the one this visitor last dismissed or read (ws_updates_seen
// holds that commit's full sha, see data.js). So every new commit brings it
// back, and one visitor dismissing it never hides the next update.
//   - "Don't show again" / "Tell me all about it!" mark the current commit
//     as seen ("Tell me all about it!" also opens the news page).
//   - The backdrop and Escape close it for this viewing only.
//   - The commit comes from window.WS_LatestCommit (ui.js, shared with the
//     footer label). If GitHub can't be reached (offline, rate limit) the
//     modal only opens for a visitor who has never seen one, so a flaky
//     connection doesn't nag people on every page.
// Update the list in the modal (index.html) and the news page with each
// release; the modal itself needs nothing else.
(() => {
  const SEEN_KEY = "ws_updates_seen";

  const overlay = document.getElementById("updatesOverlay");
  const panel   = document.getElementById("updatesPanel");
  if (!overlay || !panel) return;

  // Site root from this script's own URL, so the news-page link resolves
  // the same whether this runs from the root page or a nested one.
  const root     = new URL("../../", document.querySelector("script[src*='js/updates.js']")?.src || location.href);
  const newsHref = new URL("system/pages/news/index.html", root).href;

  const seen = () => { try { return localStorage.getItem(SEEN_KEY) || ""; } catch (_) { return ""; } };
  let currentId = "";   // sha of the commit being announced ("" = unknown)
  const markSeen = () => { try { localStorage.setItem(SEEN_KEY, currentId || "offline"); } catch (_) {} };

  function close() {
    overlay.classList.remove("visible");
    setTimeout(() => { overlay.hidden = true; }, 200);
  }

  function open() {
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add("visible");
      panel.focus({ preventScroll: true });
    });
  }

  document.getElementById("updatesBackdrop")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("visible")) close();
  });

  document.getElementById("updatesDismiss")?.addEventListener("click", () => {
    markSeen();
    close();
  });

  document.getElementById("updatesReadMore")?.addEventListener("click", () => {
    markSeen();
    window.location.href = newsHref;
  });

  // The menu entry always opens it, whether or not the commit is known yet.
  document.getElementById("openUpdates")?.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  const lookup = typeof window.WS_LatestCommit === "function" ? window.WS_LatestCommit() : Promise.resolve(null);
  lookup.then((c) => {
    currentId = c && c.sha ? c.sha : "";
    const last = seen();
    if (currentId ? last !== currentId : !last) open();
  });
})();

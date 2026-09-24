"use strict";

// ── Dev tools access ───────────────────────────────────────────────────
// Typing "debugplz!" anywhere on the site opens the debug panel
// (tools/debug.html) in a new tab, for tickets listed in tools/list.json
// only. Everyone else gets nothing: no pop-up, no message.
//
// Access = this browser's ticket id AND its username both match an entry
// in list.json, AND the server confirms the ticket (with this browser's
// secret key) is approved, so copying someone's ticket id isn't enough.
// This only guards the shortcut and the panel's listing: the tool pages
// themselves are ordinary pages anyone could open by their URL.
//
// window.WS_Dev = { check() -> Promise<boolean>, open() }
(() => {
  const CODE  = "debugplz!";
  const BASE  = new URL("../tools/", document.currentScript?.src || location.href);
  const LIST  = new URL("list.json", BASE).href;
  const PANEL = new URL("debug.html", BASE).href;

  const read = (k) => { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } };

  let checking = null;

  function check() {
    if (checking) return checking;
    checking = (async () => {
      const id = read("ws_ticket_id").trim();
      const user = read("ws_username").trim().replace(/^@/, "").toLowerCase();
      if (!id || !user) return false;
      try {
        const res = await fetch(`${LIST}?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return false;
        const list = (await res.json())?.devtools;
        const listed = Array.isArray(list) && list.some((e) =>
          String(e?.ticket || "").trim() === id &&
          String(e?.username || "").trim().replace(/^@/, "").toLowerCase() === user);
        if (!listed || !window.WS_Ticket?.verify) return false;
        return (await window.WS_Ticket.verify(id, read("ws_ticket_key"))) === "approved";
      } catch (_) {
        return false;
      }
    })();
    // A failed check (e.g. offline) can be tried again next time.
    checking.then((ok) => { if (!ok) checking = null; });
    return checking;
  }

  function open() { window.open(PANEL, "_blank", "noopener"); }

  // Check early, so the tab can open straight from the keystroke (a
  // pop-up opened after waiting on the network may get blocked).
  let allowed = false;
  const warm = () => check().then((ok) => { allowed = ok; });
  if (read("ws_ticket_id")) setTimeout(warm, 1500);

  let typed = "";
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-CODE.length);
    if (typed !== CODE) return;
    typed = "";
    if (allowed) { open(); return; }
    check().then((ok) => { allowed = ok; if (ok) open(); });
  }, true);

  window.WS_Dev = { check, open };
})();

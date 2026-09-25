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
// Speed: the server verify is an Apps Script round trip (redirect + cold
// start, often seconds). A passing verify is remembered in localStorage
// (ws_dev_ok, tied to this ticket id + username) for TRUST_MS, so the panel
// opens instantly from the homepage's early check. list.json is still read
// every time; the server is re-asked in the background once the memory is
// older than REVALIDATE_MS, and a definite "no" there forgets it and fires
// "ws:dev-revoked" on document (debug.html locks itself again).
//
// window.WS_Dev = { check() -> Promise<boolean>, open(), reason() -> why the last check said no }
(() => {
  const CODE  = "debugplz!";
  const BASE  = new URL("../tools/", document.currentScript?.src || location.href);
  const LIST  = new URL("list.json", BASE).href;
  const PANEL = new URL("debug.html", BASE).href;
  const OK_KEY        = "ws_dev_ok";
  const TRUST_MS      = 30 * 60 * 1000;
  const REVALIDATE_MS = 2 * 60 * 1000;

  const read = (k) => { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } };
  const write = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (_) {} };

  // Age in ms of the remembered pass for this id+user, or -1 if none/stale.
  function passAge(id, user) {
    try {
      const m = JSON.parse(read(OK_KEY) || "null");
      if (!m || m.id !== id || m.user !== user) return -1;
      const age = Date.now() - Number(m.at);
      return age >= 0 && age < TRUST_MS ? age : -1;
    } catch (_) { return -1; }
  }
  const remember = (id, user) => write(OK_KEY, JSON.stringify({ id, user, at: Date.now() }));

  // Why the last check() said no, for debug.html to show:
  //   { code: "no-ticket" | "no-username" | "list-unreachable" | "not-listed"
  //           | "server-status" | "server-unreachable", id, user, status? }
  let reason = null;
  const fail = (code, extra) => { reason = { code, ...extra }; return false; };

  // The server's normalized status ("approved", "pending", "unknown", …),
  // or null if it couldn't be reached.
  async function serverStatus(id) {
    try { return await window.WS_Ticket.verify(id, read("ws_ticket_key")); }
    catch (_) { return null; }
  }

  let revalidating = false;
  function revalidate(id, user) {
    if (revalidating) return;
    revalidating = true;
    serverStatus(id).then((st) => {
      if (st === "approved") remember(id, user);
      else if (st) {
        write(OK_KEY, "");
        allowed = false;
        checking = null;
        fail("server-status", { id, user, status: st });
        document.dispatchEvent(new CustomEvent("ws:dev-revoked"));
      }
    });
  }

  // ticket.js changed the ticket (new id, revoked, pending): forget the pass.
  document.addEventListener("ws:ticket-change", (e) => {
    if (e.detail?.status !== "approved") { write(OK_KEY, ""); allowed = false; checking = null; }
  });

  let checking = null;

  function check() {
    if (checking) return checking;
    checking = (async () => {
      reason = null;
      const id = read("ws_ticket_id").trim();
      const user = read("ws_username").trim().replace(/^@/, "").toLowerCase();
      if (!id) return fail("no-ticket", { id, user });
      if (!user) return fail("no-username", { id, user });
      let list;
      try {
        const res = await fetch(`${LIST}?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        list = (await res.json())?.devtools;
      } catch (_) {
        return fail("list-unreachable", { id, user });
      }
      const listed = Array.isArray(list) && list.some((e) =>
        String(e?.ticket || "").trim() === id &&
        String(e?.username || "").trim().replace(/^@/, "").toLowerCase() === user);
      if (!listed || !window.WS_Ticket?.verify) { write(OK_KEY, ""); return fail("not-listed", { id, user }); }
      const age = passAge(id, user);
      if (age >= 0) {
        if (age > REVALIDATE_MS) revalidate(id, user);
        return true;
      }
      const st = await serverStatus(id);
      if (st === "approved") { remember(id, user); return true; }
      if (!st) return fail("server-unreachable", { id, user });
      write(OK_KEY, "");
      return fail("server-status", { id, user, status: st });
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

  window.WS_Dev = { check, open, reason: () => reason };
})();

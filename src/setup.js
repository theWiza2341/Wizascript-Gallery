// src/setup.js
//
// Runs before any of Wizascript's gallery code (it's main.js's first import).
// Wizascript keeps its data in Tampermonkey's storage (GM_getValue/GM_setValue)
// and reaches the gallery server with GM_xmlhttpRequest. A website has neither,
// so these stand-ins keep the same calls working:
//  - GM storage -> this site's localStorage, under "wzg:" + the same key names;
//  - GM_xmlhttpRequest -> fetch (the gallery server and raw.githubusercontent
//    both allow requests from web pages).
// The gallery's install credentials, draft and redeemed key live here, so
// they belong to this browser, like Wizascript's belong to one Tampermonkey.

const PREFIX = "wzg:";

function store() {
  try { return window.localStorage; } catch (e) { return null; }
}
const memory = new Map(); // if localStorage is blocked (private windows on some browsers)

window.GM_getValue = (key, fallback) => {
  const ls = store();
  let raw = null;
  try { raw = ls ? ls.getItem(PREFIX + key) : null; } catch (e) { raw = null; }
  if (raw === null) return memory.has(key) ? memory.get(key) : fallback;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
};
window.GM_setValue = (key, value) => {
  memory.set(key, value);
  const ls = store();
  try { if (ls) ls.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* full or blocked: memory only */ }
};
window.GM_deleteValue = (key) => {
  memory.delete(key);
  const ls = store();
  try { if (ls) ls.removeItem(PREFIX + key); } catch (e) { /* none */ }
};

window.GM_xmlhttpRequest = (o) => {
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  let timer = null;
  if (o.timeout && ctl) timer = setTimeout(() => { ctl.abort(); if (o.ontimeout) o.ontimeout(); }, o.timeout);
  // Wizascript labels every request as JSON. A browser treats a labelled
  // request as one that needs the other site's OK first (a CORS preflight);
  // raw.githubusercontent.com never gives it, so its files would be blocked.
  // Only requests that send a body (to the gallery server, which allows it)
  // keep the label.
  const headers = { ...(o.headers || {}) };
  if (o.data === undefined || o.data === null) Object.keys(headers).forEach((k) => { if (k.toLowerCase() === "content-type") delete headers[k]; });
  fetch(o.url, { method: o.method || "GET", headers, body: o.data, signal: ctl ? ctl.signal : undefined })
    .then(async (r) => {
      clearTimeout(timer);
      const text = await r.text();
      if (o.onload) o.onload({ status: r.status, responseText: text });
    }, (e) => {
      clearTimeout(timer);
      if (e && e.name === "AbortError") return; // the timeout already reported it
      if (o.onerror) o.onerror(e);
    });
};

// The card tiles use the game's frames, rarity icons and font. On
// undercards.net those are same-site paths; from here they're the game's
// own files on undercards.net (UC Editor's copies are the fallback).
window.WZ_ASSET_ORIGIN = "https://undercards.net";

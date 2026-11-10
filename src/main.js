// src/main.js
//
// The Card Gallery website: the same gallery as Wizascript's Card Maker
// (Browse, Contest, Submit, Review, and both card editors), for players
// without the userscript. Everything inside the gallery panel is
// Wizascript's own code (packages/card-maker/gallery/), bundled from the
// Wizascript repo by build.mjs, so the two stay 1:1: same server, same
// gallery branch, same votes and uploads.
//
// What this file adds around it (the page itself):
//  - the top bar: Editor | Browse | Contest | Submit | Review, and ? (help);
//  - the editors, framed like the Card Maker does (with their authors' OK);
//  - the key button at the bottom left (Redeem Key, Wizascript's own box from
//    gallery/keybox.js: gallery keys, and device codes WZL-… that link this
//    browser to an account linked elsewhere);
//  - linking through the console (link-steps.js), checked automatically.

import "./setup.js"; // must stay first: storage + asset origin for the code below
import { buildGalleryPanel } from "@wz/card-maker/gallery/panel.js";
import { reviewerKey, reviewerWho, keyLabel, keyBox, forgetKey as dropKey, recheckKey, onKeyChange, deviceBox, DEVICE_TITLE } from "@wz/card-maker/gallery/keybox.js";
import { checkFrameImages, CARD_FONT } from "@wz/card-maker/gallery/render.js";
import { h, button } from "@wz/card-maker/gallery/dom.js";
import { EDITORS, FRAME_MESSAGE } from "@wz/card-maker/editors.js";
import { linkSteps } from "./link-steps.js";
import { SITE_CSS } from "./style.js";

const VIEWS = [["editor", "Editor", "✎"], ["browse", "Browse", "▤"], ["contest", "Contest", "★"], ["submit", "Submit", "⬆"], ["review", "Review", "✓"]];
const EDITOR_KEY = "wizascript.site.editor";
const CREDIT = { feildmaster: "by feildmaster", sernon: "by sernon158" };
const SHORT = { feildmaster: "feildmaster's Template Editor", sernon: "UC Editor" };

const style = document.createElement("style");
style.textContent = SITE_CSS.replace(/\$FONT/g, CARD_FONT);
document.head.appendChild(style);

// ---- keys (review and judging) ------------------------------------------------------
// Wizascript's own key box (gallery/keybox.js): the server checks every request
// against the key, so a revoked or expired key stops working at once and is
// forgotten here. It also takes device codes (WZL-…), which link this browser.
let gallery = null;
function keyChanged() {
  syncKeyButton();
  if (gallery) gallery.reviewerChanged();
  syncNav();
}
onKeyChange(keyChanged);
function forgetKey(message) {
  if (dropKey() && message) toast(message);
}

// ---- a small dialog --------------------------------------------------------------------
let openDialog = null;
function dialog(title, body) {
  closeDialog();
  const close = button("Close", () => closeDialog(), { cls: "wz-site-dclose" });
  const box = h("div", { class: "wz-site-dialog", role: "dialog", "aria-label": title },
    h("div", { class: "wz-site-dhead" }, h("b", { text: title })), body, h("div", { class: "wz-site-dfoot" }, close));
  const back = h("div", { class: "wz-site-dback", onclick: (e) => { if (e.target === back) closeDialog(); } }, box);
  document.body.appendChild(back);
  openDialog = back;
  return box;
}
function closeDialog() { if (openDialog) { openDialog.remove(); openDialog = null; } }
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openDialog) closeDialog(); });

let toastTimer = null;
const toastEl = h("div", { class: "wz-site-toast" });
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("on"), 5000);
}

function openKeyDialog() {
  dialog("Redeem Key", keyBox({ reviewWhere: "in the top bar" }));
}
function openDeviceDialog() {
  dialog(DEVICE_TITLE, deviceBox({ notLinked: "Link your account first (Link my account in Browse or Submit), or redeem a code from a linked device." }));
}

function openHelp() {
  dialog("Card Gallery", h("div", { class: "wz-site-help" },
    h("p", { text: "Custom Undercards cards made by players, the same gallery as Wizascript's Card Maker." }),
    h("ul", {},
      h("li", {}, h("b", { text: "Browse" }), ": everyone's approved cards. Vote with ▲ ▼ once your account is linked."),
      h("li", {}, h("b", { text: "Contest" }), ": the running contest and past results. The organizers judge entries."),
      h("li", {}, h("b", { text: "Editor" }), ": make cards in either community editor."),
      h("li", {}, h("b", { text: "Submit" }), ": add your cards (UC Editor's .uceditor download, or a card PNG), then upload them for approval.")),
    h("p", { class: "dim", text: "Posting and voting need your Undercards account linked once (Link my account). Your link, draft and votes are kept in this browser." }),
    h("p", { class: "dim" }, "Card editors by feildmaster and sernon158, shown with their permission. Made by Wiza; not an official Undercards site.")));
}

// ---- the page -----------------------------------------------------------------------------
const nav = h("nav", { class: "wz-site-nav" }, VIEWS.map(([v, label, icon]) =>
  h("button", { type: "button", "data-view": v, onclick: () => go(v) },
    h("span", { class: "ic", text: icon }), h("span", { text: label }), v === "review" ? h("span", { class: "count" }) : null)));
const top = h("header", { class: "wz-site-top" },
  h("a", { class: "wz-site-brand", href: "#browse", onclick: (e) => { e.preventDefault(); go("browse"); } },
    h("img", { src: "pack.png", alt: "" }), h("span", { text: "Card Gallery" })),
  nav, h("span", { class: "wz-site-grow" }),
  button("?", openHelp, { cls: "wz-site-help-btn", title: "What is this?" }));
const editorPane = h("section", { class: "wz-site-editors" });
const main = h("main", { class: "wz-site-main" }, editorPane);
const keyBtn = h("button", { type: "button", class: "wz-site-keybtn", onclick: openKeyDialog, "aria-label": "Redeem Key" }, h("span", { text: "⚿" }));
function syncKeyButton() {
  keyBtn.title = keyLabel();
  keyBtn.classList.toggle("on", !!(reviewerKey() && reviewerWho()));
}
const devBtn = h("button", { type: "button", class: "wz-site-keybtn wz-site-devbtn", onclick: openDeviceDialog, title: DEVICE_TITLE, "aria-label": DEVICE_TITLE }, h("span", { text: "📱" }));
document.body.append(top, main, keyBtn, devBtn, toastEl);
syncKeyButton();

// ---- editors ---------------------------------------------------------------------------------
// Framed like the Card Maker frames them. Each loads the first time it's
// shown, then stays loaded (both save as you go). Players with Wizascript get
// its small editor helper inside the frame (frame.js), which reports here and
// can read their cards ("Read from this editor"); without it, files work.
const frames = {}; // key -> { el, status: "loading" | "ready" | "ok" | "broken", helper: bool }
let editorKey = EDITORS[GM_getValue(EDITOR_KEY, "")] ? GM_getValue(EDITOR_KEY, "") : "sernon";
const editorTabs = h("div", { class: "wz-site-etabs" });
const editorNote = h("div", { class: "wz-site-enote", hidden: true });
const editorHost = h("div", { class: "wz-site-ehost" });
editorPane.append(h("div", { class: "wz-site-ebar" }, editorTabs, h("span", { class: "wz-site-grow" }), h("span", { class: "wz-site-credit" }),
  button("Open in its own tab ↗", () => window.open(EDITORS[editorKey].url, "_blank", "noopener"), { title: "The editor on its own site" })), editorNote, editorHost);
function drawEditorBar() {
  editorTabs.replaceChildren(...Object.keys(EDITORS).map((k) =>
    button(SHORT[k], () => showEditor(k), { cls: k === editorKey ? "wz-gl-on" : "", title: EDITORS[k].label })));
  editorPane.querySelector(".wz-site-credit").textContent = CREDIT[editorKey] || "";
}
function showEditor(key) {
  editorKey = key;
  GM_setValue(EDITOR_KEY, key);
  if (!frames[key]) {
    const el = h("iframe", { src: EDITORS[key].url, title: EDITORS[key].label, allow: "clipboard-write" });
    const f = frames[key] = { el, status: "loading", helper: false };
    el.addEventListener("load", () => { if (f.status === "loading") f.status = "ready"; updateEditorNote(); });
    editorHost.appendChild(el);
  }
  Object.entries(frames).forEach(([k, f]) => { f.el.hidden = k !== key; });
  drawEditorBar();
  updateEditorNote();
}
function updateEditorNote() {
  const f = frames[editorKey];
  editorNote.replaceChildren();
  editorNote.hidden = true;
  if (!f || editorKey !== "feildmaster") return;
  // Only Wizascript's helper inside the editor can tell (frame.js), as in the Card Maker.
  if (f.status === "broken") {
    editorNote.append(h("span", { text: "feildmaster's editor didn't start inside this page." }),
      button("Open its site ↗", () => window.open(EDITORS.feildmaster.url, "_blank", "noopener")));
    editorNote.hidden = false;
  }
}
window.addEventListener("message", (e) => {
  if (!e.data || e.data.tag !== FRAME_MESSAGE) return;
  const key = Object.keys(frames).find((k) => frames[k].el.contentWindow === e.source);
  if (!key || e.origin !== EDITORS[key].origin) return;
  const f = frames[key];
  f.helper = true;
  if (e.data.type === "cards") { if (gallery) gallery.receiveCards({ ...e.data, source: key }); return; }
  if (e.data.status) { f.status = e.data.status; updateEditorNote(); }
});

// ---- the gallery (Wizascript's own panel) ------------------------------------------------------
gallery = buildGalleryPanel({
  requestRead: () => {
    const f = frames[editorKey];
    if (!f) return "Open an editor first (Editor, in the top bar).";
    if (f.status === "loading") return "The editor is still loading.";
    if (!f.helper) return "Reading straight from an editor needs Wizascript. Without it, use Add files…: UC Editor's group download (.uceditor) or a card PNG.";
    f.el.contentWindow.postMessage({ tag: FRAME_MESSAGE, type: "read" }, EDITORS[editorKey].origin);
    return null;
  },
  editorLabel: (key) => EDITORS[key || editorKey].label,
  wheelPages: () => true,
  reviewerKey,
  onKeyRejected: (code) => forgetKey(code === "key_expired" ? "Your gallery key has expired, so it was removed." : "Your gallery key was revoked, so it was removed."),
  linkSteps,
  watchLink: true,
  submitNote: "Make cards in an editor (Editor, in the top bar) and save them to a file: UC Editor's group download (.uceditor), or feildmaster's Export → Download (.json). Then Add files…. With Wizascript installed, Read from this editor works too."
});
gallery.el.classList.add("wz-site-panel");
main.appendChild(gallery.el);
gallery.onChange(syncNav);

function syncNav() {
  // The panel can change view itself (See my posts, Enter cards, a removed
  // key leaving Review): follow it in the address and the top bar.
  if (gallery && current && current !== "editor") {
    const v = gallery.view();
    if (v !== current && v !== "editor") {
      current = v;
      document.body.dataset.view = v;
      if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
    }
  }
  const view = current;
  nav.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  const review = nav.querySelector('[data-view="review"]');
  review.style.display = gallery && gallery.isReviewer() ? "" : "none";
  const n = gallery ? gallery.pendingCount() : 0;
  const count = review.querySelector(".count");
  count.textContent = n ? String(n) : "";
  count.style.display = n ? "" : "none";
}

// ---- views, kept in the address (#browse, #contest, …) so links and Back work ----
let current = null;
function go(view, { replace = false } = {}) {
  if (!VIEWS.some(([v]) => v === view)) view = "browse";
  if (view === "review" && !gallery.isReviewer()) view = "browse";
  if (view === current) return;
  current = view;
  const hash = "#" + view;
  if (location.hash !== hash) history[replace ? "replaceState" : "pushState"](null, "", hash);
  document.body.dataset.view = view;
  if (view === "editor") { gallery.setView("editor"); showEditor(editorKey); }
  else gallery.setView(view);
  syncNav();
}
window.addEventListener("popstate", () => go(location.hash.slice(1)));
// Votes still queued when the page is left are sent on the way out.
window.addEventListener("pagehide", () => gallery.flush());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") gallery.flush(); });

checkFrameImages();
go(location.hash.slice(1) || "browse", { replace: true });
gallery.opened();
// A stored key is checked once per visit, so a revoked one is forgotten.
recheckKey(toast);
// The dev builds' Samples switch (removed for 1.0.0) left a value behind.
GM_deleteValue("wizascript.site.samples");

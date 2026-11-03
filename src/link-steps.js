// src/link-steps.js
//
// How a player without Wizascript sends the link line. Wizascript types it
// into void (chat room 0) for them; here nothing can reach undercards.net,
// and void is only reachable from the browser console (the game's own
// openRoom(0)). So: open Undercards, open the console, type openRoom(0),
// then send the line in void's chat box. The player presses Enter, as the
// mods OK'd. The gallery panel adds the last step (this page checks by itself).

import { h, button } from "@wz/card-maker/gallery/dom.js";

const UC_URL = "https://undercards.net/";
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || "");

function copy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => false);
  return Promise.resolve(false);
}

export function linkSteps({ line, say }) {
  const lineEl = h("code", { class: "wz-gl-line", text: line });
  const copyBtn = button("Copy", () => copy(line).then((ok) => say(ok ? "Copied. Paste it in void's chat box." : "Select the line and copy it (Ctrl+C).")), { primary: true, title: "Copy the line" });
  const keys = isMac ? "⌘ + Option + J" : "F12 (or Ctrl + Shift + J)";
  return [
    h("li", {}, "Open ", h("a", { href: UC_URL, target: "_blank", rel: "noopener", text: "undercards.net" }),
      " in another tab, logged in as the account you want to post and vote as.",
      isMobile ? h("div", { class: "dim", text: "Linking needs a computer: phone browsers have no console." }) : null),
    h("li", {}, "There, open the browser console: press ", h("b", { text: keys }), " and pick the ", h("b", { text: "Console" }), " tab."),
    h("li", {}, "Type ", h("code", { class: "wz-gl-line", text: "openRoom(0)" }), " and press Enter. Void (chat room 0) opens.",
      h("div", { class: "dim", text: "Type it yourself. Never paste code someone sends you into the console." })),
    h("li", {}, "Copy this line and send it in void's chat box (not the console): ", lineEl, " ", copyBtn)
  ];
}

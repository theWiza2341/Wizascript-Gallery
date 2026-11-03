// src/samples.js — DEV BUILDS ONLY. To remove for release: delete this file
// and the two lines in main.js that mention it (the import and initSamples).
//
// Fills the gallery with made-up entries so layouts can be judged before
// there are many real posts. It works by answering the gallery's own
// requests with real data PLUS samples, so none of the gallery code knows:
//   - index.json (gallery branch): + ~44 sample posts;
//   - /v1/totals: + made-up scores for them;
//   - contests.json and /v1/contests: + 4 past sample contests with results,
//     and sample entries in the running contest;
//   - /v1/votes: votes on samples stay on this page (never sent).
// Samples reuse art already on the gallery branch, and every sample author
// starts with "(sample)". A "Samples" switch in the top bar turns them off.

import { h } from "@wz/card-maker/gallery/dom.js";
import { GALLERY_RAW } from "@wz/card-maker/gallery/api.js";

const KEY = "wizascript.site.samples";
const PREFIX = "zzs"; // sample post ids: zzs00 … (real ids are base36 from 100)
const isSample = (id) => typeof id === "string" && id.startsWith(PREFIX);
const DAY = 864e5;

// A fixed random sequence, so samples look the same on every load.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const AUTHORS = ["(sample) Dustpile", "(sample) Froggit_Fan", "(sample) Tem", "(sample) RoyalGuard", "(sample) Spamton_G", "(sample) moldsmal", "(sample) Lancer99", "(sample) Annoying_Dog"];
const MONSTERS = [["Sleepy Froggit", "Turn start: Heal 1 HP to this monster."], ["Pebble Collector", "Magic: Draw a card. If it costs 2 or less, give it +1 ATK."],
  ["Tiny Knight", "Taunt. Dust: Summon a 1/1 Squire."], ["Lost Balloon", "Haste. Turn end: Deal 1 DMG to this monster."], ["Hotdog Vendor", "Magic: Give a random ally +1/+1."],
  ["Glyph Reader", "Your spells cost 1 less."], ["Snowy Sentry", "Paralyze an enemy monster with 3 ATK or less."], ["Mirror Mage", "Magic: Copy the stats of an enemy monster."],
  ["Moss Golem", "Armor. Can't attack the turn it's played."], ["Echo Bird", "Each time you cast a spell, deal 1 DMG to the enemy."], ["Clockwork Mouse", "Dodge. Loop 2."],
  ["Garden Guardian", "Support: Give adjacent allies Taunt."], ["Lantern Ghost", "Transparency. Dust: Draw a card."], ["Kettle Knight", "Burn 2. Taunt."],
  ["Starfall Wisp", "Magic: Deal 2 DMG to a random enemy monster."], ["Vending Bot", "Turn start: Gain 1 G."], ["Bramble Fox", "Charge. Dust: Give an ally +2 ATK."],
  ["Puddle Slime", "When this takes DMG, summon a 1/1 copy of it."], ["Chess Pawn", "Magic: If you control a King, gain +3/+3."], ["Cardboard Castle", "Taunt. Invulnerable for one turn."]];
const SPELLS = [["Quick Nap", "Heal 4 HP to an ally monster."], ["Spaghetti Toss", "Deal 3 DMG to an enemy monster. Draw a card."], ["Sudden Storm", "Deal 1 DMG to all monsters."],
  ["Second Wind", "Give an ally monster +2/+2 and Haste."], ["Pocket Sand", "Silence an enemy monster."], ["Lucky Coin", "Gain 2 G. Draw a card."]];
const ARTIFACTS = [["Rusty Locket", "Your first monster each turn costs 1 less."], ["Bag of Glue", "Your monsters with Taunt have +0/+2."], ["Old Compass", "At the start of the match, draw an extra card."]];
const ENCHANTS = [["Overgrowth", "At the end of each turn, the monster here gains +1 HP."], ["Frozen Floor", "Monsters played here are Paralyzed for one turn."]];
const RARITIES = ["BASE_COMMON", "BASE_COMMON", "BASE_RARE", "BASE_EPIC", "BASE_LEGENDARY", "DELTARUNE_COMMON", "DELTARUNE_RARE", "DELTARUNE_EPIC", "DELTARUNE_LEGENDARY"];
const MONSTER_ART = ["art/10e-0.png", "art/10f-0.png", null];
const ENCHANT_ART = ["art/10e-1.png"];

function build() {
  const r = rng(2341);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const now = Date.now();
  let n = 0;
  const id = (p) => `${p}${(n++).toString(36).padStart(2, "0")}`;
  const monster = ([name, desc]) => { const cost = 1 + Math.floor(r() * 8); return { type: "Monster", name, desc, cost, atk: Math.max(0, cost + Math.floor(r() * 3) - 1), hp: 1 + Math.floor(r() * (cost + 2)), rarity: pick(RARITIES), art: pick(MONSTER_ART) }; };
  const spell = ([name, desc]) => ({ type: "Spell", name, desc, cost: 1 + Math.floor(r() * 5), rarity: pick(RARITIES), art: pick(MONSTER_ART) });
  const artifact = ([name, desc]) => ({ type: "Artifact", name, desc, rarity: r() < .2 ? "BASE_LEGENDARY" : "BASE_COMMON" });
  const enchant = ([name, desc]) => ({ type: "Enchantment", name, desc, art: pick(ENCHANT_ART) });
  const single = (part, p = PREFIX) => ({ id: id(p), kind: "single", title: part.name, author: pick(AUTHORS), parts: [part] });
  const posts = [];
  MONSTERS.forEach((m) => posts.push(single(monster(m))));
  SPELLS.forEach((s) => posts.push(single(spell(s))));
  ARTIFACTS.forEach((a) => posts.push(single(artifact(a))));
  ENCHANTS.forEach((e) => posts.push(single(enchant(e))));
  // sets: 2–5 cards each
  [["The Kitchen Crew", 3], ["Snowdin Patrol", 4], ["Garden Party", 2], ["Clockwork Court", 5], ["Lantern Festival", 3], ["Tiny Army", 2], ["Royal Scientists", 4], ["Junk Pile", 3]].forEach(([title, k]) => {
    const parts = [];
    for (let i = 0; i < k; i++) parts.push(i === k - 1 && r() < .3 ? spell(pick(SPELLS)) : monster(pick(MONSTERS)));
    if (r() < .3) parts.push(enchant(pick(ENCHANTS)));
    posts.push({ id: id(PREFIX), kind: "set", title, author: pick(AUTHORS), parts });
  });
  posts.forEach((p) => { p.postedAt = now - Math.floor(r() * 75 * DAY); p.approvedAt = p.postedAt + Math.floor(r() * DAY); });
  posts.sort((a, b) => b.approvedAt - a.approvedAt);
  const totals = {};
  posts.forEach((p) => { const up = Math.floor(r() * 40), down = Math.floor(r() * 12); totals[p.id] = [up, down]; });

  // Past contests, with results; and entries for the running one.
  const THEMES = [["Heart of the Underground", "Make a card about a place in the Underground."], ["One-Cost Wonders", "Cards that cost exactly 1."],
    ["Dark World Rejects", "Deltarune monsters that never made it into the game."], ["Artifact Swap", "A new artifact for any soul."]];
  const archived = THEMES.map(([title, rules], i) => {
    const closesAt = now - (14 + i * 30) * DAY;
    const entries = [];
    const count = 9 + Math.floor(r() * 7);
    for (let j = 0; j < count; j++) {
      const e = r() < .2 ? { ...single(artifact(pick(ARTIFACTS)), "zzc"), kind: "single" } : single(monster(pick(MONSTERS)), "zzc");
      e.postedAt = closesAt - Math.floor(r() * 20 * DAY);
      entries.push(e);
    }
    const scores = {};
    entries.forEach((e) => { const nJ = 2 + Math.floor(r() * 3); scores[e.id] = { avg: Math.round((1 + r() * 4) * 4) / 4, n: nJ }; });
    const order = entries.map((e) => e.id).sort((a, b) => scores[b].avg - scores[a].avg);
    return { id: `czzs${i}`, title: `${title} (sample)`, rules, closesAt, maxEntries: 3, status: "archived", createdAt: closesAt - 30 * DAY, archivedAt: closesAt + 3 * DAY,
      entries, results: { order, scores, manualTop: false } };
  });
  const running = [];
  for (let j = 0; j < 9; j++) { const e = single(monster(pick(MONSTERS)), "zzc"); e.postedAt = now - Math.floor(r() * 5 * DAY); running.push(e); }
  return { posts, totals, archived, running };
}

let on = false;
let data = null;
const jsonResponse = (obj) => new Response(JSON.stringify(obj), { status: 200, headers: { "Content-Type": "application/json" } });

export function initSamples({ gallery, toast }) {
  try { on = GM_getValue(KEY, "1") === "1"; } catch (e) { on = true; }
  data = build();
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const method = (init.method || "GET").toUpperCase();
    if (!on) return realFetch(input, init);
    const path = url.split("?")[0];
    // Votes on samples stay here.
    if (method === "POST" && /\/v1\/votes$/.test(path)) {
      let body = {};
      try { body = JSON.parse(init.body || "{}"); } catch (e) { /* send as is */ }
      const votes = body.votes || {};
      const real = Object.fromEntries(Object.entries(votes).filter(([id]) => !isSample(id)));
      if (!Object.keys(real).length) return jsonResponse({ ok: true });
      return realFetch(input, { ...init, body: JSON.stringify({ ...body, votes: real }) });
    }
    if (method !== "GET") return realFetch(input, init);
    const merge = async (fn) => {
      const res = await realFetch(input, init);
      let obj = null;
      try { obj = res.ok ? await res.json() : null; } catch (e) { obj = null; }
      return jsonResponse(fn(obj || {}));
    };
    if (path === GALLERY_RAW + "index.json") return merge((o) => ({ format: 1, ...o, posts: (o.posts || []).concat(data.posts) }));
    if (path === GALLERY_RAW + "contests.json") return merge((o) => {
      const list = (o.contests || []).map((c) => (c.status === "archived" ? c : { ...c, entries: (c.entries || []).concat(data.running) }));
      return { format: 1, ...o, contests: list.concat(data.archived) };
    });
    if (/\/v1\/totals$/.test(path)) return merge((o) => ({ ...o, totals: { ...(o.totals || {}), ...data.totals } }));
    if (/\/v1\/contests$/.test(path)) return merge((o) => {
      const list = (o.contests || []).map((c) => (c.status === "archived" ? c : { ...c, entries: (c.entries || 0) + data.running.length }));
      return { ...o, contests: list.concat(data.archived.map(({ entries, results, ...c }) => ({ ...c, entries: entries.length }))) };
    });
    return realFetch(input, init);
  };

  // The switch, in the top bar (dev builds only).
  const sw = h("button", { type: "button", class: "wz-cm-btn wz-site-samples", title: "Dev builds only: made-up entries mixed in, so layouts can be judged. Never sent anywhere." });
  const draw = () => { sw.textContent = on ? "Samples: on" : "Samples: off"; sw.classList.toggle("wz-gl-on", on); };
  sw.addEventListener("click", () => {
    on = !on;
    GM_setValue(KEY, on ? "1" : "0");
    draw();
    toast(on ? "Sample entries on. Reloading…" : "Sample entries off. Reloading…");
    setTimeout(() => location.reload(), 600);
  });
  draw();
  const help = document.querySelector(".wz-site-help-btn");
  if (help) help.before(sw);
}

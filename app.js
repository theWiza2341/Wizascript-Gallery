// Wizascript Card Gallery website 0.1.0-dev3 (gallery code from Wizascript 1.8.0). Built by build.mjs from src/; edit src/, not this file.
(() => {
  // ../wz/packages/core/privacy.js
  var PRIVACY_URL = "https://github.com/theWiza2341/Wizascript/blob/main/legal/PRIVACY.md";

  // src/setup.js
  var PREFIX = "wzg:";
  function store() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }
  var memory = /* @__PURE__ */ new Map();
  window.GM_getValue = (key, fallback) => {
    const ls = store();
    let raw = null;
    try {
      raw = ls ? ls.getItem(PREFIX + key) : null;
    } catch (e) {
      raw = null;
    }
    if (raw === null) return memory.has(key) ? memory.get(key) : fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  };
  window.GM_setValue = (key, value) => {
    memory.set(key, value);
    const ls = store();
    try {
      if (ls) ls.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
    }
  };
  window.GM_deleteValue = (key) => {
    memory.delete(key);
    const ls = store();
    try {
      if (ls) ls.removeItem(PREFIX + key);
    } catch (e) {
    }
  };
  window.GM_xmlhttpRequest = (o) => {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    let timer = null;
    if (o.timeout && ctl) timer = setTimeout(() => {
      ctl.abort();
      if (o.ontimeout) o.ontimeout();
    }, o.timeout);
    const headers = { ...o.headers || {} };
    if (o.data === void 0 || o.data === null) Object.keys(headers).forEach((k) => {
      if (k.toLowerCase() === "content-type") delete headers[k];
    });
    fetch(o.url, { method: o.method || "GET", headers, body: o.data, signal: ctl ? ctl.signal : void 0 }).then(async (r) => {
      clearTimeout(timer);
      const text = await r.text();
      if (o.onload) o.onload({ status: r.status, responseText: text });
    }, (e) => {
      clearTimeout(timer);
      if (e && e.name === "AbortError") return;
      if (o.onerror) o.onerror(e);
    });
  };
  window.WZ_ASSET_ORIGIN = "https://undercards.net";

  // ../wz/packages/card-maker/gallery/dom.js
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === void 0 || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    kids.flat(Infinity).forEach((c) => {
      if (c !== null && c !== void 0 && c !== false) el.append(c);
    });
    return el;
  }
  var esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function button(label, onclick, { title, primary, cls } = {}) {
    return h("button", { type: "button", class: `wz-cm-btn${primary ? " wz-gl-primary" : ""}${cls ? " " + cls : ""}`, title, onclick }, label);
  }

  // ../wz/packages/card-maker/gallery/artpic.js
  var ONE = 176;
  var TWO = 176 * 2 + 3;
  var H = 246;
  var BORDER = 2;
  var PAD = 8;
  var cache = /* @__PURE__ */ new Map();
  var ready = /* @__PURE__ */ new Map();
  var listeners = [];
  var notifyTimer = 0;
  function onArtPicsChange(f) {
    listeners.push(f);
  }
  function changed() {
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => listeners.forEach((f) => {
      try {
        f();
      } catch (e) {
      }
    }), 30);
  }
  function load(src) {
    return new Promise((ok) => {
      const img = new Image();
      if (!/^(data|blob):/.test(src)) img.crossOrigin = "anonymous";
      img.onload = () => ok(img);
      img.onerror = () => ok(null);
      img.src = src;
    });
  }
  function stripPieces(px, w, h2) {
    const at = (x, y) => (y * w + x) * 4;
    const counts = /* @__PURE__ */ new Map();
    for (let i = 0; i < px.length; i += 16) {
      const k = px[i] >> 4 << 8 | px[i + 1] >> 4 << 4 | px[i + 2] >> 4;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    let bk = 0, best = -1;
    for (const [k, n] of counts) if (n > best) {
      best = n;
      bk = k;
    }
    let bg = [(bk >> 8 & 15) * 16 + 8, (bk >> 4 & 15) * 16 + 8, (bk & 15) * 16 + 8];
    for (let i = 0; i < px.length; i += 16) {
      if ((px[i] >> 4 << 8 | px[i + 1] >> 4 << 4 | px[i + 2] >> 4) === bk) {
        bg = [px[i], px[i + 1], px[i + 2]];
        break;
      }
    }
    const ink = new Uint8Array(w * h2);
    for (let p = 0, i = 0; p < ink.length; p++, i += 4) {
      if (px[i + 3] >= 40 && Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > 60) ink[p] = 1;
    }
    const colShare = (x, y0, y1) => {
      let n = 0;
      for (let y = y0; y <= y1; y++) n += ink[y * w + x];
      return n / (y1 - y0 + 1);
    };
    const rowShare = (y, x0, x1) => {
      let n = 0;
      for (let x = x0; x <= x1; x++) n += ink[y * w + x];
      return n / (x1 - x0 + 1);
    };
    if (w < 120 || h2 < 20 || w / h2 < 2.2) return null;
    let l = 0, r = w - 1, t = 0, b = h2 - 1;
    const midY0 = Math.floor(h2 * 0.2), midY1 = Math.ceil(h2 * 0.8);
    while (l < 8 && colShare(l, midY0, midY1) > 0.9) l++;
    while (r > w - 9 && colShare(r, midY0, midY1) > 0.9) r--;
    while (t < 8 && rowShare(t, l, r) > 0.9) t++;
    while (b > h2 - 9 && rowShare(b, l, r) > 0.9) b--;
    if (l === 0 || t === 0) return null;
    const border = [px[at(0, h2 >> 1)], px[at(0, h2 >> 1) + 1], px[at(0, h2 >> 1) + 2]];
    const run = (x) => {
      let best2 = 0, n = 0;
      for (let y = t; y <= b; y++) {
        n = ink[y * w + x] ? n + 1 : 0;
        if (n > best2) best2 = n;
      }
      return best2;
    };
    const tall = Math.max(16, Math.round((b - t + 1) * 0.6));
    let dividers = [];
    for (let x = l + 3; x <= r - 3; x++) {
      if (run(x) >= tall) {
        const last = dividers[dividers.length - 1];
        if (last && x - last[1] <= 1) last[1] = x;
        else dividers.push([x, x]);
      }
    }
    dividers = dividers.filter(([a, z]) => z - a >= 1);
    if (!dividers.length || dividers.length > 3) return null;
    const bounds = [l, ...dividers.flatMap(([a, z]) => [a - 1, z + 1]), r];
    const trim = (x0, x1) => {
      let y0 = t, y1 = b;
      const rowHas = (y) => {
        for (let x = x0; x <= x1; x++) if (ink[y * w + x]) return true;
        return false;
      };
      const colHas = (x) => {
        for (let y = y0; y <= y1; y++) if (ink[y * w + x]) return true;
        return false;
      };
      while (y0 < y1 && !rowHas(y0)) y0++;
      while (y1 > y0 && !rowHas(y1)) y1--;
      while (x0 < x1 && !colHas(x0)) x0++;
      while (x1 > x0 && !colHas(x1)) x1--;
      return x1 - x0 < 2 || y1 - y0 < 2 ? null : { x0, y0, x1, y1 };
    };
    const pieces = [];
    for (let i = 0; i < bounds.length; i += 2) pieces.push(trim(bounds[i], bounds[i + 1]));
    const desc = pieces.pop();
    const head = pieces.filter(Boolean);
    if (!desc || !head.length) return null;
    return { ink, border, bg, head, desc, lines: textLines(ink, w, desc) };
  }
  function textLines(ink, w, box) {
    const rowHas = (y) => {
      for (let x = box.x0; x <= box.x1; x++) if (ink[y * w + x]) return true;
      return false;
    };
    const rows = [];
    let s = -1;
    for (let y = box.y0; y <= box.y1 + 1; y++) {
      const on = y <= box.y1 && rowHas(y);
      if (on && s < 0) s = y;
      else if (!on && s >= 0) {
        rows.push([s, y - 1]);
        s = -1;
      }
    }
    if (!rows.length) return null;
    const heights = rows.map(([a, z]) => z - a + 1).sort((a, b) => a - b);
    const lineH = heights[heights.length >> 1];
    const gap = Math.max(5, Math.round(lineH * 0.38));
    const lines = rows.map(([y0, y1]) => {
      const colHas = (x) => {
        for (let y = y0; y <= y1; y++) if (ink[y * w + x]) return true;
        return false;
      };
      const words = [];
      let ws = -1, empty = 0;
      for (let x = box.x0; x <= box.x1 + gap; x++) {
        if (x <= box.x1 && colHas(x)) {
          if (ws < 0) ws = x;
          empty = 0;
        } else if (ws >= 0 && (++empty >= gap || x > box.x1)) {
          words.push([ws, x - empty]);
          ws = -1;
          empty = 0;
        }
      }
      const ends = /* @__PURE__ */ new Map();
      for (let x = box.x0; x <= box.x1; x++) {
        for (let y = y1; y >= y0; y--) if (ink[y * w + x]) {
          ends.set(y, (ends.get(y) || 0) + 1);
          break;
        }
      }
      let base = y1, most = 0;
      for (const [y, n] of ends) if (n > most || n === most && y < base) {
        most = n;
        base = y;
      }
      return { y0, y1, base, words };
    });
    const gaps = [];
    lines.forEach((ln) => {
      for (let i = 1; i < ln.words.length; i++) gaps.push(ln.words[i][0] - ln.words[i - 1][1] - 1);
    });
    gaps.sort((a, b) => a - b);
    const space = gaps.length ? gaps[gaps.length >> 1] : gap + 2;
    lines.forEach((ln, i) => {
      const next = lines[i + 1];
      ln.forced = !!next && next.words.length > 0 && ln.words.length > 0 && ln.words[ln.words.length - 1][1] + space + (next.words[0][1] - next.words[0][0] + 1) <= box.x1 - 2;
    });
    const pitches = [];
    for (let i = 1; i < lines.length; i++) pitches.push(lines[i].y0 - lines[i - 1].y0);
    pitches.sort((a, b) => a - b);
    return { lines, space, pitch: pitches.length ? pitches[pitches.length >> 1] : lineH + 4 };
  }
  function flow(text, width) {
    const out = [];
    let x = 0, y = 0;
    const asc = Math.max(...text.lines.map((ln) => ln.base - ln.y0));
    const offset = (ln) => asc - (ln.base - ln.y0);
    const wide = Math.max(...text.lines.flatMap((ln) => ln.words.map(([a, z]) => z - a + 1)), 0);
    if (wide > width) return null;
    text.lines.forEach((ln) => {
      ln.words.forEach(([a, z]) => {
        const ww = z - a + 1;
        if (x > 0 && x + text.space + ww > width) {
          x = 0;
          y += text.pitch;
        } else if (x > 0) x += text.space;
        out.push({ src: [a, z, ln.y0, ln.y1], x, y: y + offset(ln) });
        x += ww;
      });
      if (ln.forced) {
        x = 0;
        y += text.pitch;
      }
    });
    if (text.lines[text.lines.length - 1].forced) y -= text.pitch;
    const bottom = Math.max(0, ...out.map((o) => o.y + o.src[3] - o.src[2] + 1));
    return { words: out, height: Math.max(bottom, y + text.pitch) };
  }
  function layoutStrip(p) {
    if (!p.lines) return null;
    for (const tw of [ONE, TWO]) {
      const inner = tw - 2 * (BORDER + PAD);
      const heads = [];
      let x = 0, y = 0, rowH = 0, fits = true;
      for (const b of p.head) {
        const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
        if (bw > inner) {
          fits = false;
          break;
        }
        if (x > 0 && x + 10 + bw > inner) {
          x = 0;
          y += rowH + 6;
          rowH = 0;
        } else if (x > 0) x += 10;
        heads.push({ b, x, y });
        x += bw;
        rowH = Math.max(rowH, bh);
      }
      if (!fits) continue;
      heads.forEach((hd) => {
        const rowItems = heads.filter((o) => o.y === hd.y);
        const tall = Math.max(...rowItems.map((o) => o.b.y1 - o.b.y0 + 1));
        hd.dy = Math.floor((tall - (hd.b.y1 - hd.b.y0 + 1)) / 2);
      });
      const headH = y + rowH;
      const text = flow(p.lines, inner);
      if (!text) continue;
      const need = BORDER + PAD + headH + 9 + text.height + PAD + BORDER;
      if (tw === ONE && need > H) continue;
      return { w: tw, h: Math.max(H, need), heads, headH, text };
    }
    return null;
  }
  function draw(img, p, lay) {
    const c = document.createElement("canvas");
    c.width = lay.w;
    c.height = lay.h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.fillStyle = `rgb(${p.bg.join(",")})`;
    g.fillRect(0, 0, lay.w, lay.h);
    g.fillStyle = `rgb(${p.border.join(",")})`;
    g.fillRect(0, 0, lay.w, BORDER);
    g.fillRect(0, lay.h - BORDER, lay.w, BORDER);
    g.fillRect(0, 0, BORDER, lay.h);
    g.fillRect(lay.w - BORDER, 0, BORDER, lay.h);
    const ox = BORDER + PAD, oy = BORDER + PAD;
    lay.heads.forEach(({ b, x, y, dy }) => {
      const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
      g.drawImage(img, b.x0, b.y0, bw, bh, ox + x, oy + y + dy, bw, bh);
    });
    const ty = oy + lay.headH + 3;
    g.fillRect(BORDER, ty, lay.w - 2 * BORDER, 1);
    lay.text.words.forEach(({ src: [x0, x1, y0, y1], x, y }) => {
      g.drawImage(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1, ox + x, ty + 6 + y, x1 - x0 + 1, y1 - y0 + 1);
    });
    return c.toDataURL("image/png");
  }
  function restackArtifact(src) {
    if (!src) return Promise.resolve(null);
    if (!cache.has(src)) {
      cache.set(src, load(src).then((img) => {
        if (!img) return null;
        const w = img.naturalWidth, h2 = img.naturalHeight;
        let px;
        try {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h2;
          const g = c.getContext("2d");
          g.drawImage(img, 0, 0);
          px = g.getImageData(0, 0, w, h2).data;
        } catch (e) {
          return { w, h: h2, url: null };
        }
        const pieces = stripPieces(px, w, h2);
        const lay = pieces && layoutStrip(pieces);
        return lay ? { url: draw(img, pieces, lay), w: lay.w, h: lay.h, restacked: true } : { w, h: h2, url: null };
      }).catch(() => null).then((r) => {
        ready.set(src, r);
        return r;
      }));
    }
    return cache.get(src);
  }
  var plainWidth = (w) => Math.min(w || ONE, w > ONE * 1.15 ? TWO : ONE);
  function artPicTile(h2, src) {
    const img = h2("img", { class: "wz-gl-artpic", src, alt: "", style: { width: ONE + "px" } });
    const apply = (r) => {
      if (!r) return false;
      if (r.url) {
        img.src = r.url;
        img.style.width = r.w + "px";
        img.classList.add("wz-gl-restacked");
      } else img.style.width = plainWidth(r.w) + "px";
      return true;
    };
    if (ready.has(src)) apply(ready.get(src));
    else restackArtifact(src).then((r) => {
      if (apply(r)) changed();
    });
    return img;
  }

  // ../wz/packages/card-maker/gallery/render.js
  var CARD_W = 176;
  var CARD_H = 246;
  var UCE = "https://sernon158.github.io/uc-editor/";
  var UC = typeof globalThis !== "undefined" && typeof globalThis.WZ_ASSET_ORIGIN === "string" ? globalThis.WZ_ASSET_ORIGIN : "";
  var ASSET_BASES = [`${UC}/images/`, `${UCE}images/`];
  var assetBase = null;
  var FRAME = (kind) => `${assetBase || ASSET_BASES[0]}frameSkins/Undertale/frame_${kind}.png`;
  var KEYWORDS = ["Flowery Power", "Turn start", "Turn end", "Magic", "Dust", "Charge", "Haste", "Armor", "Disarmed", "Candy", "Fatigue", "Turbo", "Support", "Paralyze", "Silence", "Transparency", "Invulnerable", "Taunt", "Dodge", "Burn", "Synergy", "Shock", "Delay", "Generated", "Need", "Loop", "Program", "Switch", "Catch", "Bullseye", "Wanted", "Erase", "Darkspawn", "Goal", "Reward", "Quest"];
  var SPECIAL = { cost: "#00d0ff", ATK: "#f0003c", HP: "#0dd000", DMG: "gold", G: "gold", KR: "#d535d9", KINDNESS: "#00c000", DETERMINATION: "red", DT: "red", PATIENCE: "#41fcff", BRAVERY: "#fca500", INTEGRITY: "#0064ff", PERSEVERANCE: "#d535d9", JUSTICE: "#ffff00", TOKEN: "#00c800", BASE: "gray", COMMON: "#fff", RARE: "#00b8ff", EPIC: "#d535d9", LEGENDARY: "gold" };
  var kwRe = new RegExp(`(^|[^\\w])(${KEYWORDS.map((k) => k.replace(/ /g, "\\s")).join("|")})(?=[^\\w]|$)`, "g");
  var spRe = new RegExp(`(^|[^\\w{"#])(${Object.keys(SPECIAL).join("|")})(?![\\w}])`, "g");
  function formatText(desc) {
    const t = esc(desc).replace(/\{\{stats:([^}]*)\}\}/gi, (_, a) => a.split("|").join("/")).replace(/\{\{[^}]*\}\}/g, "").replace(/\[\[([^\]]*)\]\]/g, "$1").replace(/(?<!\\)_([^_]+)_/g, "<u>$1</u>").replace(/\{(#?[\w]+)[;|]([^}]*)\}/g, '<span style="color:$1">$2</span>').replace(/\{([^{}]+)\}/g, '<span style="color:#41fcff">$1</span>').replace(/\\/g, "").replace(/\n/g, "<br>");
    return t.split(/(<[^>]+>)/).map((seg, i) => i % 2 ? seg : seg.replace(kwRe, "$1<u>$2</u>").replace(spRe, (_, pre, k) => `${pre}<span style="color:${SPECIAL[k]}">${k}</span>`)).join("");
  }
  var rarityColor = (r) => SPECIAL[(r || "").split("_").pop()] || "#fff";
  var soulColor = (s) => SPECIAL[s] || (/^#[0-9a-f]{3,8}$/i.test(s || "") ? s : "");
  var frameImages = null;
  var checking = null;
  function checkFrameImages() {
    if (frameImages !== null) return Promise.resolve(frameImages);
    if (checking) return checking;
    const tryBase = (i) => new Promise((ok) => {
      if (i >= ASSET_BASES.length) return ok(false);
      const img = new Image();
      img.onload = () => {
        assetBase = ASSET_BASES[i];
        ok(true);
      };
      img.onerror = () => tryBase(i + 1).then(ok);
      img.src = `${ASSET_BASES[i]}frameSkins/Undertale/frame_monster.png`;
    });
    checking = tryBase(0).then((found) => frameImages = found);
    return checking;
  }
  function rarityImage(name) {
    if (!/^[A-Za-z0-9_]{1,40}$/.test(String(name || ""))) return null;
    const tries = [assetBase, ...ASSET_BASES.filter((b) => b !== assetBase)].filter(Boolean).map((b) => `${b}rarity/${name}.png`);
    const img = h("img", { class: "wz-gl-rar", alt: "" });
    let n = 0;
    img.addEventListener("error", () => {
      if (++n < tries.length) img.src = tries[n];
      else img.remove();
    });
    img.src = tries[0];
    return img;
  }
  function tile(p) {
    if (p.picture && p.type === "Artifact") return artPicTile(h, p.picture);
    if (p.picture) return h("div", { class: "wz-gl-card wz-gl-pic" }, h("img", { src: p.picture, alt: "" }));
    if (p.type === "Artifact") {
      const colour = rarityColor(p.rarity);
      const icon = h("img", { class: "wz-gl-icon", src: p.art || "", alt: "" });
      icon.addEventListener("error", () => {
        icon.style.visibility = "hidden";
      }, { once: true });
      return h(
        "div",
        { class: "wz-gl-artifact", style: { borderColor: colour } },
        h(
          "div",
          { class: "wz-gl-arthead" },
          icon,
          h("div", { class: "wz-gl-artname", style: { color: colour } }, h("span", { text: p.name || "(no name)" }))
        ),
        h("div", { class: "wz-gl-rarity", text: (p.rarity || "").split("_").pop(), style: { color: colour } }),
        h("div", { class: "wz-gl-arttext" }, h("div", { html: formatText(p.desc) }))
      );
    }
    const kind = p.type === "Enchantment" ? "enchant" : p.type.toLowerCase();
    const name = h("div", { class: "wz-gl-name" }, h("span", { text: p.name || "(no name)", style: { color: p.type === "Spell" ? soulColor(p.soul) : "" } }));
    const tribes = h("div", { class: "wz-gl-tribes" }, (p.tribes || []).map((t, i) => h("img", { src: t.icon, title: t.name || "", alt: "", style: { right: i * 17 + "px" } })));
    let rarity = null;
    if (p.type !== "Enchantment") {
      if (p.rarityIcon) {
        rarity = h("img", { class: "wz-gl-rar", src: p.rarityIcon, alt: "" });
        rarity.addEventListener("error", () => rarity.remove(), { once: true });
      } else if (p.rarity) rarity = rarityImage(p.rarity);
    }
    const framed = frameImages && kind !== "enchant";
    return h(
      "div",
      { class: `wz-gl-card t-${kind}${framed ? " framed" : ""}` },
      h("div", { class: "wz-gl-bg" }),
      p.art ? h("img", { class: "wz-gl-art", src: p.art, alt: "" }) : null,
      h("div", { class: "wz-gl-shade" }),
      h("div", { class: "wz-gl-frame", style: framed ? { backgroundImage: `url(${FRAME(kind)})` } : {} }),
      ["l1", "l2", "l3", "v1", "v2", "v3"].map((c) => h("i", { class: c })),
      name,
      h("div", { class: "wz-gl-cost", text: p.type === "Enchantment" ? "" : String(p.cost ?? "") }),
      tribes,
      h("div", { class: "wz-gl-text" }, h("div", { html: formatText(p.desc) })),
      p.type === "Monster" ? h("div", { class: "wz-gl-atk", text: String(p.atk ?? "") }) : null,
      rarity,
      p.type === "Monster" ? h("div", { class: "wz-gl-hp", text: String(p.hp ?? "") }) : null
    );
  }
  var FIT_STEPS = 12;
  var fitCache = /* @__PURE__ */ new Map();
  var measureHost = null;
  function host() {
    if (!measureHost || !measureHost.isConnected) {
      measureHost = h("div", { "aria-hidden": "true", style: { position: "fixed", left: "-10000px", top: "0", visibility: "hidden", pointerEvents: "none", zoom: "1" } });
      (document.body || document.documentElement).appendChild(measureHost);
    }
    return measureHost;
  }
  function shrink(sizeEl, measureEl, start, max, wide) {
    let size = start, i = 0;
    sizeEl.style.fontSize = size + "px";
    const over = () => measureEl.offsetHeight >= max || wide && measureEl.scrollWidth > measureEl.clientWidth + 1;
    while (i < FIT_STEPS && over()) {
      size -= 0.5;
      sizeEl.style.fontSize = size + "px";
      i++;
    }
    return size;
  }
  var fontsReady = false;
  var fontListeners = [];
  function onFontsChange(f) {
    fontListeners.push(f);
  }
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.addEventListener("loadingdone", () => {
      fitCache.clear();
      fontListeners.forEach((f) => f());
    });
  }
  function whenFontsReady() {
    if (fontsReady || !document.fonts) return Promise.resolve();
    return Promise.all([document.fonts.load('12px "DTM-Mono"'), document.fonts.load('12px "WZ DTM Mono"')].map((p) => p.catch(() => null))).then(() => document.fonts.ready).then(() => {
      fontsReady = true;
      fitCache.clear();
    });
  }
  function fitCard(card) {
    const name = card.querySelector(".wz-gl-name"), text = card.querySelector(".wz-gl-text > div"), art = card.querySelector(".wz-gl-arttext");
    const isArt = card.classList.contains("wz-gl-artifact");
    const key = card.className.replace(" wz-gl-wide", "") + "" + (name ? name.innerHTML : "") + "" + (text ? text.innerHTML : "") + "" + (art ? art.innerHTML : "");
    let r = fitCache.get(key);
    if (!r) {
      const c = card.cloneNode(true);
      c.style.zoom = "1";
      c.classList.remove("wz-gl-wide");
      host().appendChild(c);
      r = {};
      const n = c.querySelector(".wz-gl-name");
      if (n) r.name = shrink(n, n.firstElementChild || n, 14, 25, n);
      const t = c.querySelector(".wz-gl-text > div");
      if (t) r.text = shrink(t, t, 12, card.classList.contains("t-enchant") ? 184 : 81);
      if (isArt) {
        const an = c.querySelector(".wz-gl-artname");
        r.artName = shrinkBox(an, 14, 8);
        const a = c.querySelector(".wz-gl-arttext");
        r.art = shrinkBox(a, 12, 9);
        if (a.scrollHeight > a.clientHeight + 1) {
          c.classList.add("wz-gl-wide");
          r.wide = true;
          r.artName = shrinkBox(an, 14, 8);
          r.art = shrinkBox(a, 12, 7);
        }
      }
      c.remove();
      if (fontsReady) {
        if (fitCache.size > 2e3) fitCache.clear();
        fitCache.set(key, r);
      }
    }
    if (name && r.name) name.style.fontSize = r.name + "px";
    if (text && r.text) text.style.fontSize = r.text + "px";
    if (isArt) {
      card.classList.toggle("wz-gl-wide", !!r.wide);
      const an = card.querySelector(".wz-gl-artname");
      if (an && r.artName) an.style.fontSize = r.artName + "px";
      if (art && r.art) art.style.fontSize = r.art + "px";
    }
  }
  function shrinkBox(el, start, min) {
    let size = start;
    el.style.fontSize = size + "px";
    while (size > min && el.scrollHeight > el.clientHeight + 1) {
      size -= 0.5;
      el.style.fontSize = size + "px";
    }
    return size;
  }
  function fitText(root) {
    root.querySelectorAll(".wz-gl-card:not(.wz-gl-pic), .wz-gl-artifact").forEach(fitCard);
  }
  var CARD_FONT = `"DTM-Mono", "DTM Mono", "WZ DTM Mono", monospace`;
  var TILE_CSS = `
@font-face { font-family: "WZ DTM Mono"; src: ${UC ? "" : `url("/fonts/DTM-Mono.otf") format("opentype"), `}url("${UCE}images/fonts/DTM-Mono.otf") format("opentype"); font-display: swap; }
.wz-gl-card, .wz-gl-artifact { font-family: ${CARD_FONT}; }
/* Like the game (Bootstrap): sizes include padding and borders, inside or outside the window. */
.wz-gl-card, .wz-gl-card *, .wz-gl-artifact, .wz-gl-artifact * { box-sizing: border-box; }
.wz-gl-card { position: relative; width: ${CARD_W}px; height: ${CARD_H}px; color: #fff; font-size: 12px; line-height: 1.42857; text-align: center; overflow: hidden; flex: none; }
.wz-gl-card > * { position: absolute; }
.wz-gl-bg { left: 8px; top: 8px; width: 160px; height: 230px; background: #000; }
.wz-gl-art { left: 8px; top: 36px; width: 160px; height: 90px; image-rendering: pixelated; }
.t-enchant .wz-gl-art { top: 54px; height: 183px; }
.wz-gl-shade { left: 8px; top: 54px; width: 160px; height: 183px; background: rgba(0,0,0,.6); display: none; }
.t-enchant .wz-gl-shade { display: block; }
.wz-gl-frame { left: 0; top: 0; width: 176px; height: 246px; background-repeat: no-repeat; z-index: 3; }
.wz-gl-card:not(.framed) .wz-gl-frame { left: 6px; top: 6px; width: 164px; height: 234px; border: 2px solid #fff; }
.wz-gl-card i { background: #fff; z-index: 3; display: none; }
.wz-gl-card:not(.framed) i { display: block; }
.wz-gl-card .l1 { left: 6px; top: 34px; width: 164px; height: 2px; }
.t-monster .l2, .t-spell .l2 { left: 6px; top: 126px; width: 164px; height: 2px; }
.t-monster .l3, .t-spell .l3 { left: 6px; top: 210px; width: 164px; height: 2px; }
.t-monster .v1, .t-spell .v1 { left: 125px; top: 6px; width: 2px; height: 30px; }
.t-monster .v2 { left: 49px; top: 210px; width: 2px; height: 30px; }
.t-monster .v3 { left: 125px; top: 210px; width: 2px; height: 30px; }
.t-enchant .l2 { left: 6px; top: 52px; width: 164px; height: 2px; }
.wz-gl-name { left: 8px; top: 9px; width: 116px; height: 24px; line-height: 24px; font-size: 14px; padding: 0 5px; overflow: hidden; text-align: left; z-index: 5; }
.wz-gl-name > span { display: block; min-height: 100%; overflow-wrap: normal; }
.t-enchant .wz-gl-name { width: 160px; }
.wz-gl-cost { left: 128px; top: 9px; width: 40px; height: 24px; line-height: 24px; font-size: 20px; color: #00d0ff; z-index: 5; }
.wz-gl-tribes { right: 12px; top: 106px; height: 16px; width: 80px; z-index: 6; }
.wz-gl-tribes img { position: absolute; top: 0; max-width: 16px; max-height: 16px; }
.wz-gl-text { left: 8px; top: 129px; width: 160px; height: 80px; display: table; z-index: 5; font-size: 12px; }
.t-enchant .wz-gl-text { top: 54px; height: 183px; }
.wz-gl-text > div { display: table-cell; vertical-align: middle; }
.wz-gl-atk, .wz-gl-hp { top: 213px; width: 40px; height: 24px; line-height: 24px; font-size: 20px; z-index: 5; }
.wz-gl-atk { left: 8px; color: #f0003c; } .wz-gl-hp { left: 128px; color: #0dd000; }
.wz-gl-rar { left: 76px; top: 213px; width: 24px; height: 24px; z-index: 5; image-rendering: pixelated; }
.wz-gl-pic img { left: 0; top: 0; width: 176px; height: 246px; }
.wz-gl-artpic { display: block; width: 176px; height: auto; flex: none; }
.wz-gl-restacked { image-rendering: pixelated; }
.wz-gl-artifact { width: ${CARD_W}px; height: ${CARD_H}px; border: 2px solid #fff; background: #000; padding: 8px; color: #fff; font-size: 12px; line-height: 1.42857; text-align: left; flex: none; display: flex; flex-direction: column; overflow: hidden; }
.wz-gl-artifact.wz-gl-wide { width: ${CARD_W * 2 + 3}px; }
.t-enchant i { display: none !important; }
.wz-gl-arthead { display: flex; align-items: center; gap: 8px; flex: none; }
.wz-gl-icon { width: 32px; height: 32px; image-rendering: pixelated; border: 1px solid #fff; flex: none; }
.wz-gl-artname { flex: 1 1 auto; min-width: 0; height: 40px; font-size: 14px; line-height: 1.25; overflow: hidden; display: flex; align-items: center; overflow-wrap: anywhere; }
.wz-gl-artname > span { max-height: 100%; }
.wz-gl-rarity { font-size: 10px; margin: 3px 0; }
.wz-gl-rarity { flex: none; padding-bottom: 4px; margin-bottom: 5px; border-bottom: 2px solid currentColor; }
.wz-gl-arttext { flex: 1 1 auto; min-height: 0; overflow: hidden; }
`;

  // ../wz/packages/card-maker/gallery/feild.js
  var isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || "");
  async function feildPart(e, ctx) {
    if (!e) return null;
    const base = { name: e.name || "", desc: e.description || "", image: await ctx.image(e.image) };
    if (!base.image && ctx.why && ctx.why(e.image)) base.artNote = ctx.why(e.image);
    if (e.type === "text") return { type: "Artifact", ...base, rarity: e.rarity || "COMMON" };
    if (e.type !== "card") return null;
    const spell = e.health === void 0 || e.health === null;
    return {
      type: spell ? "Spell" : "Monster",
      ...base,
      cost: e.cost ?? 0,
      atk: spell ? null : e.attack ?? 0,
      hp: spell ? null : e.health ?? 0,
      soul: e.soul || null,
      rarity: isUuid(e.rarity) ? null : e.rarity || "COMMON",
      rarityIcon: isUuid(e.rarity) ? await ctx.image(e.rarity) : null,
      tribes: await Promise.all((e.tribes || []).filter((t) => t && t !== "none").map(async (t) => ({
        name: isUuid(t) ? null : t,
        icon: isUuid(t) ? await ctx.image(t) : await ctx.tribeIcon(t)
      }))),
      imageType: "standard"
    };
  }
  async function feildGroups({ el, groupIds, allIds }, ctx, looseName = "Not in a group") {
    const groups = [];
    const seen = /* @__PURE__ */ new Set();
    for (const gid of groupIds) {
      const g = el(gid);
      if (!g) continue;
      const parts = [];
      for (const cid of g.content || []) {
        seen.add(cid);
        const p = await feildPart(el(cid), ctx);
        if (p) parts.push(p);
      }
      groups.push({ name: g.name || "Group", parts });
    }
    const loose = [];
    for (const id of allIds) {
      const e = el(id);
      if (seen.has(id) || groupIds.includes(id) || !e || e.type === "group") continue;
      const p = await feildPart(e, ctx);
      if (p) loose.push(p);
    }
    if (loose.length) groups.push({ name: looseName, parts: loose });
    return groups;
  }

  // ../wz/packages/core/page-window.js
  function getPageWindow() {
    return typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  }

  // ../wz/packages/core/uc-report.js
  var TAG = "WZ";
  var VERSION = 1;
  var HEADER = `#${TAG}${VERSION} `;
  var canOpenVoid = () => typeof getPageWindow().openRoom === "function";
  function closeDialogs() {
    const BD = getPageWindow().BootstrapDialog;
    if (!BD) return false;
    let any = false;
    try {
      if (BD.dialogs) Object.values(BD.dialogs).forEach((d) => {
        if (d && typeof d.close === "function" && (!d.isOpened || d.isOpened())) {
          d.close();
          any = true;
        }
      });
      else if (typeof BD.closeAll === "function") {
        BD.closeAll();
        any = true;
      }
    } catch (e) {
    }
    return any;
  }
  function openVoid(message, select) {
    const w = getPageWindow();
    if (!canOpenVoid()) return false;
    const go2 = () => {
      if (!document.querySelector("#chat-public-0")) w.openRoom(0);
      let tries = 0;
      const fill = () => {
        const input = document.querySelector("#chat-public-0 .chat-text");
        if (!input) {
          if (++tries < 40) setTimeout(fill, 100);
          return;
        }
        input.value = message;
        input.focus();
        const at = select ? message.indexOf(select) : -1;
        if (at >= 0) input.setSelectionRange(at, at + select.length);
        else input.setSelectionRange(message.length, message.length);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      fill();
    };
    if (closeDialogs()) setTimeout(go2, 350);
    else go2();
    return true;
  }

  // ../wz/packages/core/http.js
  function gmRequest() {
    if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
    if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest.bind(GM);
    return null;
  }
  var failure = (kind, message) => Object.assign(new Error(message), { kind });
  function http(method, url, { headers = {}, body, timeout = 2e4 } = {}) {
    const h2 = { ...headers };
    if (body === void 0 || body === null) Object.keys(h2).forEach((k) => {
      if (k.toLowerCase() === "content-type") delete h2[k];
    });
    const gm = gmRequest();
    if (gm) {
      return new Promise((resolve, reject) => {
        try {
          gm({
            method,
            url,
            headers: h2,
            data: body,
            timeout,
            onload: (r) => resolve({ status: r.status, text: r.responseText || "" }),
            onerror: () => reject(failure("network", "network error")),
            ontimeout: () => reject(failure("timeout", "timed out"))
          });
        } catch (e) {
          reject(failure("network", e && e.message || "network error"));
        }
      });
    }
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    let timedOut = false;
    const timer = ctl && timeout ? setTimeout(() => {
      timedOut = true;
      ctl.abort();
    }, timeout) : null;
    return fetch(url, { method, headers: h2, body: body === null ? void 0 : body, signal: ctl ? ctl.signal : void 0, credentials: "omit" }).then(async (r) => ({ status: r.status, text: await r.text() })).catch(() => {
      throw timedOut ? failure("timeout", "timed out") : failure("network", "network error");
    }).finally(() => clearTimeout(timer));
  }

  // ../wz/packages/core/account.js
  var DEFAULT_WORKER = "https://wizascript-gallery.thewiza2341.workers.dev";
  var WORKER_HOSTS = ["wizascript-gallery.thewiza2341.workers.dev"];
  var SERVER_FILE = "https://raw.githubusercontent.com/theWiza2341/Wizascript/sounds/server.json";
  var SERVER_KEY = "wizascript.account.server";
  var SERVER_TTL = 30 * 60 * 1e3;
  var WORKER_RE = /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.workers\.dev$/i;
  var isWorkerUrl = (u) => {
    if (typeof u !== "string") return false;
    const v = u.replace(/\/+$/, "");
    return WORKER_RE.test(v) && WORKER_HOSTS.includes(v.slice("https://".length).toLowerCase());
  };
  function cachedServer() {
    try {
      const c = JSON.parse(GM_getValue(SERVER_KEY, "null"));
      return c && isWorkerUrl(c.url) ? c : null;
    } catch (e) {
      return null;
    }
  }
  var worker = (cachedServer() || {}).url || DEFAULT_WORKER;
  var checking2 = null;
  function fetchServer() {
    return http("GET", SERVER_FILE + "?t=" + Math.floor(Date.now() / 6e4), { timeout: 6e3 }).then((r) => {
      try {
        const u = r.status === 200 ? String(JSON.parse(r.text).worker || "").replace(/\/+$/, "") : "";
        if (isWorkerUrl(u)) {
          worker = u;
          GM_setValue(SERVER_KEY, JSON.stringify({ at: Date.now(), url: u }));
        }
      } catch (e) {
      }
      return worker;
    }, () => worker);
  }
  function server() {
    const c = cachedServer();
    if (c && Date.now() - c.at < SERVER_TTL) return Promise.resolve(c.url);
    if (!checking2) checking2 = fetchServer().finally(() => {
      checking2 = null;
    });
    return c ? Promise.resolve(c.url) : checking2;
  }
  var call = (method, path, opts) => server().then((base) => request(method, base + path, opts));
  var AUTH_KEY = "wizascript.cardMaker.galleryAuth";
  var ApiError = class extends Error {
    constructor(status, code, message, extra) {
      super(message);
      this.status = status;
      this.code = code;
      this.extra = extra || {};
    }
  };
  function request(method, url, { body, auth: auth2, adminKey } = {}) {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (auth2) {
      headers["X-WZ-Install"] = auth2.install;
      headers["X-WZ-Secret"] = auth2.secret;
    }
    if (adminKey) headers["X-WZ-Admin"] = adminKey;
    return http(method, url, { headers, body: body ? JSON.stringify(body) : void 0, timeout: 3e4 }).then((r) => {
      let data = null;
      try {
        data = r.text ? JSON.parse(r.text) : null;
      } catch (e) {
      }
      if (r.status >= 200 && r.status < 300) return data;
      if (r.status === 404 && !data) return null;
      throw new ApiError(r.status, data && data.error || "http", data && data.message || `The gallery server answered ${r.status}.`, data);
    }, (e) => {
      throw e && e.kind === "timeout" ? new ApiError(0, "timeout", "The gallery server took too long to answer.") : new ApiError(0, "network", "Couldn't reach the gallery server.");
    });
  }
  function loadAuth() {
    try {
      const a = JSON.parse(GM_getValue(AUTH_KEY, "null"));
      return a && a.install && a.secret ? a : null;
    } catch (e) {
      return null;
    }
  }
  var auth = null;
  var making = null;
  async function getAuth() {
    if (auth) return auth;
    auth = loadAuth();
    if (auth) return auth;
    if (!making) {
      making = call("POST", "/v1/install").then((a) => {
        GM_setValue(AUTH_KEY, JSON.stringify({ install: a.install, secret: a.secret }));
        auth = a;
        return a;
      }).finally(() => {
        making = null;
      });
    }
    return making;
  }
  async function authed(method, path, body, extra = {}) {
    const a = await getAuth();
    try {
      return await call(method, path, { body, auth: a, ...extra });
    } catch (e) {
      if (e.code === "bad_install" || e.code === "no_install") {
        GM_deleteValue(AUTH_KEY);
        auth = null;
        return call(method, path, { body, auth: await getAuth(), ...extra });
      }
      throw e;
    }
  }
  function selfInfo() {
    const w = getPageWindow();
    const id = Number(w.selfId);
    return { selfId: Number.isInteger(id) && id > 0 ? id : null, selfName: typeof w.selfUsername === "string" && w.selfUsername ? w.selfUsername : null };
  }
  var getMe = () => authed("GET", "/v1/me");
  var linkStart = () => authed("POST", "/v1/link/start");
  var linkCheck = () => authed("POST", "/v1/link/check", selfInfo());
  var keyBridge = { get: () => "", put: async () => null };
  var setGalleryKeyBridge = (b) => {
    keyBridge = { ...keyBridge, ...b };
  };
  var galleryKeyHere = () => {
    try {
      return keyBridge.get() || "";
    } catch (e) {
      return "";
    }
  };
  async function linkShare(withKey = true) {
    const k = withKey ? galleryKeyHere() : "";
    if (!k) return authed("POST", "/v1/link/share");
    try {
      return await authed("POST", "/v1/link/share", void 0, { adminKey: k });
    } catch (e) {
      if (e.code !== "not_admin" && e.code !== "key_expired") throw e;
      const r = await authed("POST", "/v1/link/share");
      return { ...r, keyDropped: true };
    }
  }
  var isDeviceCode = (raw) => /^\s*wzl[\s-]*[0-9a-z]{4}[\s-]*[0-9a-z]{4}\s*$/i.test(String(raw || ""));
  async function redeemDeviceCode(raw) {
    let r;
    try {
      r = await authed("POST", "/v1/link/redeem", { code: String(raw || "").trim(), ...selfInfo() });
    } catch (e) {
      const why = {
        bad_code: "That code isn't valid. Codes work once.",
        code_expired: "That code has expired. Make a new one on your linked device.",
        wrong_account: e.message,
        cooldown: "This install switched accounts less than a day ago. Try again later.",
        rate_limited: "Too many wrong codes. Try again in an hour."
      }[e && e.code];
      throw new Error(why || e && e.message || "Couldn't reach the Wizascript server.");
    }
    accountChanged(r.account, r.cooldownUntil, true);
    let key = null;
    if (r.galleryKey) {
      try {
        key = await keyBridge.put(r.galleryKey);
      } catch (e) {
        key = null;
      }
    }
    return { account: r.account, key };
  }
  var state = { name: null, cooldownUntil: null, known: false };
  var listeners2 = [];
  var linkedAccount = () => state.name;
  var onAccountChange = (fn) => {
    listeners2.push(fn);
    return () => listeners2.splice(listeners2.indexOf(fn), 1);
  };
  var linkListeners = [];
  function accountChanged(name, cooldownUntil, justLinked = false) {
    const was = state.name;
    state.name = name || null;
    state.cooldownUntil = cooldownUntil || null;
    state.known = true;
    if (was !== state.name) listeners2.slice().forEach((f) => {
      try {
        f(state.name);
      } catch (e) {
      }
    });
    if (justLinked && state.name) linkListeners.slice().forEach((f) => {
      try {
        f(state.name);
      } catch (e) {
      }
    });
  }

  // ../wz/packages/card-maker/gallery/parts.js
  var ART = { Monster: [160, 90], Spell: [160, 90], Enchantment: [160, 183], Artifact: [64, 64] };
  var ARTIFACT_MAX_W = 704;
  var UCE2 = "https://sernon158.github.io/uc-editor/";
  function loadImg(src) {
    return new Promise((ok, bad) => {
      const i = new Image();
      if (/^https?:/.test(src) && !src.startsWith(location.origin)) i.crossOrigin = "anonymous";
      i.onload = () => ok(i);
      i.onerror = () => bad(new Error("image failed to load"));
      i.src = src;
    });
  }
  var readFile = (f, how) => new Promise((ok) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r[how](f);
  });
  async function fit(src, w, h2, mode = "cover") {
    if (!src) return null;
    const img = await loadImg(src);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = mode === "cover" ? Math.max(w / iw, h2 / ih) : Math.min(w / iw, h2 / ih);
    const dw = iw * s, dh = ih * s;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h2;
    const g = c.getContext("2d");
    const whole = Math.abs(s - Math.round(s)) < 0.01 || Math.abs(1 / s - Math.round(1 / s)) < 0.01;
    g.imageSmoothingEnabled = !whole;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, (w - dw) / 2, (h2 - dh) / 2, dw, dh);
    return { src: c.toDataURL("image/png"), from: `${iw}x${ih}` };
  }
  var rarityKey = (type, r) => !r ? null : type === "Artifact" || r.includes("_") ? r : "BASE_" + r;
  async function partFromRaw(raw, { source, from, editorGroup }) {
    const [w, h2] = ART[raw.type] || ART.Monster;
    let art = null;
    let note = "";
    try {
      art = await fit(raw.image, w, h2, raw.type === "Artifact" ? "contain" : "cover");
    } catch (e) {
      note = raw.artNote || "art didn't load";
    }
    if (!art && raw.artNote) note = raw.artNote;
    if (art && raw.type !== "Artifact" && raw.type !== "Enchantment" && raw.imageType && raw.imageType !== "standard") note = `${raw.imageType} art cropped to 160x90`;
    return {
      type: raw.type,
      name: raw.name || "",
      desc: raw.desc || "",
      cost: raw.cost ?? null,
      atk: raw.atk ?? null,
      hp: raw.hp ?? null,
      soul: raw.soul || null,
      rarity: rarityKey(raw.type, raw.rarity),
      rarityIcon: raw.rarityIcon || null,
      tribes: (raw.tribes || []).filter((t) => t && t.icon).slice(0, 4),
      art: art ? art.src : null,
      artFrom: art ? art.from : "",
      note,
      source,
      from,
      editorGroup,
      group: null
    };
  }
  function isFeildmasterExport(text) {
    try {
      const b = JSON.parse(text);
      return !!(b && b.version === 1 && Array.isArray(b.elements) && b.elements.length && typeof b.assets === "object");
    } catch (e) {
      return false;
    }
  }
  var feildArt = async (kind, name) => urlToDataUrl(`${await server()}/v1/feild/${kind}/${encodeURIComponent(name)}`);
  async function urlToDataUrl(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const blob = await r.blob();
      return await new Promise((ok) => {
        const fr = new FileReader();
        fr.onload = () => ok(fr.result);
        fr.onerror = () => ok(null);
        fr.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  }
  async function readFeildmasterFile(text) {
    const b = JSON.parse(text);
    const byId = new Map(b.elements.filter((e) => e && e.id).map((e) => [e.id, e]));
    const assets = b.assets || {};
    const contained = /* @__PURE__ */ new Set();
    b.elements.forEach((e) => (e && e.type === "group" ? e.content || [] : []).forEach((id) => contained.add(id)));
    const groupIds = b.elements.filter((e) => e && e.type === "group" && !contained.has(e.id)).map((e) => e.id);
    const notes = /* @__PURE__ */ new Map();
    const image = async (id) => {
      if (!id) return null;
      if (isUuid(id)) {
        const a = assets[id];
        if (a && typeof a.src === "string") return a.src.startsWith("data:") ? a.src : urlToDataUrl(a.src);
        return null;
      }
      if (/^https?:/.test(id)) return urlToDataUrl(id);
      const data = await feildArt("avatar", id);
      if (!data) notes.set(id, "built-in art from feildmaster's editor couldn't be loaded");
      return data;
    };
    const groups = await feildGroups(
      { el: (id) => byId.get(id), groupIds, allIds: [...byId.keys()] },
      { image, tribeIcon: (t) => feildArt("tribe", String(t).toUpperCase().replace(/ /g, "_")), why: (id) => notes.get(id) }
    );
    const root = groupIds.length === 1 ? byId.get(groupIds[0]) : null;
    return { name: root && root.name || "", groups };
  }
  function readUcEditorFile(text) {
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(text.trim().match(/../g).map((b) => parseInt(b, 16)))));
    const abs = (u) => !u ? null : /^(data|blob|https?):/.test(u) ? u : new URL(u, UCE2).href;
    const cssUrl = (v) => (/url\(["']?([^"')]+)["']?\)/.exec(v || "") || [])[1] || (v && v !== "none" ? v : null);
    const rarityName = (u) => (/([A-Z]+_[A-Z]+)\.png/i.exec(u || "") || [])[1] || null;
    const parts = [];
    for (const a of json.artifacts || []) parts.push({ type: "Artifact", name: a.name, desc: a.desc || "", rarity: a.rarity || null, image: abs(a.image) });
    for (const c of json.cards || []) {
      const type = { 0: "Monster", 1: "Spell", 99: "Enchantment" }[c.cardType];
      if (!type) continue;
      const r = cssUrl(c.rarity);
      parts.push({
        type,
        name: c.name,
        desc: c.desc || "",
        cost: type === "Monster" ? (c.stats || [])[0] : type === "Spell" ? c.stats : null,
        atk: type === "Monster" ? (c.stats || [])[1] : null,
        hp: type === "Monster" ? (c.stats || [])[2] : null,
        soul: c.spellSoul || null,
        rarity: c.isRarityCustom ? null : rarityName(r),
        rarityIcon: c.isRarityCustom ? abs(r) : null,
        tribes: (c.tribes || []).map((t) => ({ name: t.name || null, icon: abs(t.src) })),
        imageType: c.imageType || "standard",
        image: abs(cssUrl(c.image))
      });
    }
    return { name: json.name || "Group", parts };
  }
  async function picturesFromPng(dataUrl, { from, editorGroup }) {
    const r = extractPicture(await loadImg(dataUrl));
    const single = r.parts.length === 1;
    const out = [];
    for (const p of r.parts) {
      let art = null;
      if (p.type !== "Artifact") {
        const [aw, ah] = ART[p.type];
        const top2 = p.type === "Enchantment" ? 54 : 36;
        const c = document.createElement("canvas");
        c.width = aw;
        c.height = ah;
        c.getContext("2d").drawImage(await loadImg(p.src), 8, top2, aw, ah, 0, 0, aw, ah);
        art = c.toDataURL();
      }
      out.push({ type: p.type, name: single ? editorGroup : "", picture: p.src, art, artFrom: p.from, note: "picture only", source: "picture", from, editorGroup, group: null });
    }
    return out;
  }
  function extractPicture(img) {
    const w = img.naturalWidth, h2 = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h2;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, w, h2).data;
    const counts = /* @__PURE__ */ new Map();
    for (let i = 0; i < px.length; i += 16) {
      if (px[i + 3] < 40) continue;
      const k = px[i] >> 4 << 8 | px[i + 1] >> 4 << 4 | px[i + 2] >> 4;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    let bgKey = 0, best = -1;
    for (const [k, n] of counts) if (n > best) {
      best = n;
      bgKey = k;
    }
    const bg = [(bgKey >> 8 & 15) * 16 + 8, (bgKey >> 4 & 15) * 16 + 8, (bgKey & 15) * 16 + 8];
    const on = new Uint8Array(w * h2);
    for (let p = 0, i = 0; p < on.length; p++, i += 4) {
      if (px[i + 3] >= 40 && Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > 60) on[p] = 1;
    }
    const rowHas = (y, x0, x1) => {
      for (let x = x0; x <= x1; x++) if (on[y * w + x]) return true;
      return false;
    };
    const colHas = (x, y0, y1) => {
      for (let y = y0; y <= y1; y++) if (on[y * w + x]) return true;
      return false;
    };
    const runs = (from, to, has, gap = 3) => {
      const out2 = [];
      let s = -1, empty = 0;
      for (let i = from; i <= to; i++) {
        if (has(i)) {
          if (s < 0) s = i;
          empty = 0;
        } else if (s >= 0 && ++empty >= gap) {
          out2.push([s, i - empty]);
          s = -1;
          empty = 0;
        }
      }
      if (s >= 0) out2.push([s, to - empty]);
      return out2;
    };
    const trim = (b) => {
      let { x0, y0, x1, y1 } = b;
      while (y0 < y1 && !rowHas(y0, x0, x1)) y0++;
      while (y1 > y0 && !rowHas(y1, x0, x1)) y1--;
      while (x0 < x1 && !colHas(x0, y0, y1)) x0++;
      while (x1 > x0 && !colHas(x1, y0, y1)) x1--;
      return { x0, y0, x1, y1 };
    };
    const dims = (b) => ({ w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 });
    const cardShaped = (b) => {
      const { w: bw, h: bh } = dims(b);
      const r = bh / bw;
      return r >= 1.3 && r <= 1.65 && bh >= 120;
    };
    const leaves = [];
    function split(b, depth) {
      b = trim(b);
      const { w: bw, h: bh } = dims(b);
      if (bw * bh < 1200) return;
      if (depth > 0 && (cardShaped(b) || depth > 4)) return leaves.push(b);
      const rws = runs(b.y0, b.y1, (y) => rowHas(y, b.x0, b.x1));
      if (rws.length > 1) return rws.forEach(([a, z]) => split({ ...b, y0: a, y1: z }, depth + 1));
      const cls = runs(b.x0, b.x1, (x) => colHas(x, b.y0, b.y1));
      if (cls.length > 1) return cls.forEach(([a, z]) => split({ ...b, x0: a, x1: z }, depth + 1));
      leaves.push(b);
    }
    split({ x0: 0, y0: 0, x1: w - 1, y1: h2 - 1 }, 0);
    for (let again = true; again; ) {
      again = false;
      leaves.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
      outer: for (let i = 0; i < leaves.length; i++) for (let j = 0; j < leaves.length; j++) {
        const a = leaves[i], b = leaves[j];
        if (i === j || b.y0 <= a.y1 || b.y0 - a.y1 > 24 || cardShaped(a) || cardShaped(b)) continue;
        const ov = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        if (ov < 0.85 * Math.max(dims(a).w, dims(b).w)) continue;
        const m = { x0: Math.min(a.x0, b.x0), y0: a.y0, x1: Math.max(a.x1, b.x1), y1: b.y1 };
        if (!cardShaped(m)) continue;
        leaves.splice(Math.max(i, j), 1);
        leaves.splice(Math.min(i, j), 1, m);
        again = true;
        break outer;
      }
    }
    leaves.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
    const pixel = (x, y) => {
      const i = (y * w + x) * 4;
      return [px[i], px[i + 1], px[i + 2], px[i + 3]];
    };
    const share = (b, test) => {
      let n = 0, t = 0;
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
        t++;
        if (test(pixel(x, y))) n++;
      }
      return t ? n / t : 0;
    };
    const out = [];
    leaves.forEach((b, i) => {
      const { w: bw, h: bh } = dims(b);
      if (i === 0 && leaves.length > 1 && bw >= 0.8 * w && bh < 90 && !cardShaped(b)) return;
      let type;
      if (cardShaped(b)) {
        const white = ([r, g2, bl, a]) => a > 40 && r + g2 + bl > 600;
        const top2 = { y0: b.y0 + Math.round(bh * 0.02), y1: b.y0 + Math.round(bh * 0.08) };
        let costBox = false;
        for (let x = b.x0 + Math.round(bw * 0.55); x <= b.x1 - 6 && !costBox; x++) costBox = share({ x0: x, x1: x, ...top2 }, white) > 0.85;
        const foot = { x0: b.x0 + 4, x1: b.x0 + Math.round(bw * 0.3), y0: b.y1 - Math.round(bh * 0.14), y1: b.y1 - 3 };
        const red = share(foot, ([r, g2, bl]) => r > 150 && g2 < 90 && bl < 90);
        type = !costBox ? "Enchantment" : red > 0.01 ? "Monster" : "Spell";
      } else type = "Artifact";
      const k = document.createElement("canvas");
      const kg = () => {
        const x = k.getContext("2d");
        x.imageSmoothingQuality = "high";
        return x;
      };
      if (type === "Artifact") {
        const scale = Math.min(1, ARTIFACT_MAX_W / bw);
        k.width = Math.round(bw * scale);
        k.height = Math.round(bh * scale);
        kg().drawImage(c, b.x0, b.y0, bw, bh, 0, 0, k.width, k.height);
      } else {
        k.width = CARD_W;
        k.height = CARD_H;
        kg().drawImage(c, b.x0, b.y0, bw, bh, 6, 6, CARD_W - 12, CARD_H - 12);
      }
      out.push({ type, src: k.toDataURL("image/png"), from: `${bw}x${bh}@${b.x0},${b.y0}`, size: `${k.width}x${k.height}` });
    });
    return { w, h: h2, bg: bg.join(","), parts: out };
  }

  // ../wz/packages/card-maker/gallery/draft.js
  var KEY = "wizascript.cardMaker.gallery";
  var draft = null;
  var saveTimer = null;
  function getDraft() {
    if (draft) return draft;
    try {
      const raw = GM_getValue(KEY, null);
      draft = raw ? JSON.parse(raw) : null;
    } catch (e) {
      draft = null;
    }
    if (!draft || !Array.isArray(draft.parts)) draft = { parts: [], groups: [], nextId: 1, uploads: {} };
    draft.groups = draft.groups || [];
    draft.uploads = draft.uploads || {};
    delete draft.posted;
    delete draft.votes;
    draft.parts.forEach((p) => {
      p.sel = false;
    });
    return draft;
  }
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const clean = { ...draft, parts: draft.parts.map(({ sel, ...p }) => p) };
        GM_setValue(KEY, JSON.stringify(clean));
      } catch (e) {
        console.warn("[Card Gallery] Couldn't save the draft", e);
      }
    }, 300);
  }
  function nextId() {
    const d = getDraft();
    return d.nextId++;
  }
  function tidySets() {
    const d = getDraft();
    for (let i = d.groups.length - 1; i >= 0; i--) {
      const members = d.parts.filter((p) => p.group === d.groups[i].id);
      if (members.length < 2) {
        members.forEach((p) => {
          p.group = null;
        });
        d.groups.splice(i, 1);
      }
    }
  }
  var SET_CAP = 15;
  function makeSet(members, name = "") {
    const d = getDraft();
    if (members.length < 2 || members.length > SET_CAP) return null;
    const used = new Set(d.groups.map((g) => g.letter));
    let letter = "A";
    while (used.has(letter)) letter = String.fromCharCode(letter.charCodeAt(0) + 1);
    const set = { id: nextId(), letter, name };
    d.groups.push(set);
    members.forEach((p) => {
      p.group = set.id;
      p.sel = false;
    });
    tidySets();
    return set;
  }
  function markUploaded(sent) {
    const d = getDraft();
    const gone = /* @__PURE__ */ new Set();
    sent.forEach(({ id, kind, title, local }) => {
      d.uploads[id] = { kind, title, postedAt: Date.now(), parts: local.parts.map(({ sel, group, id: _, ...p }) => p) };
      local.parts.forEach((p) => gone.add(p));
    });
    d.parts = d.parts.filter((p) => !gone.has(p));
    tidySets();
    saveDraft();
  }
  function pruneUploads(statusById, inIndex) {
    const d = getDraft();
    let changed3 = false;
    Object.keys(d.uploads).forEach((id) => {
      const st = statusById[id];
      const old = Date.now() - d.uploads[id].postedAt > 14 * 864e5;
      if (st === "approved" && inIndex.has(id) || (st === "rejected" || st === "removed") && old || !st && old) {
        delete d.uploads[id];
        changed3 = true;
      }
    });
    if (changed3) saveDraft();
  }
  function entries() {
    const d = getDraft();
    const out = d.groups.map((g) => ({ key: "g" + g.id, kind: "set", label: g.letter, title: g.name, parts: d.parts.filter((p) => p.group === g.id) }));
    d.parts.filter((p) => !p.group).forEach((p) => out.push({ key: "p" + p.id, kind: "single", title: p.name, parts: [p] }));
    return out;
  }

  // ../wz/packages/card-maker/gallery/api.js
  var GALLERY_RAW = "https://raw.githubusercontent.com/theWiza2341/Wizascript/gallery/";
  var UPLOAD_MAX_ENTRIES = 10;
  var UPLOAD_MAX_PICTURES = 40;
  var UPLOAD_MAX_BYTES = 1.4 * 1024 * 1024;
  var PICTURE_MAX_BYTES = 150 * 1024;
  var sendVotes = (votes) => authed("POST", "/v1/votes", { votes });
  var deleteOwnPost = (id) => authed("POST", "/v1/posts/delete", { id });
  var getTotals = () => call("GET", "/v1/totals");
  var getHealth = () => call("GET", "/v1/health");
  var admin = (method, path, key, body) => call(method, path, { body, adminKey: key });
  var reviewWhoami = (key) => admin("GET", "/v1/admin/whoami", key);
  var reviewLog = (key, only) => admin("GET", "/v1/admin/log" + (only ? `?only=${encodeURIComponent(only)}` : ""), key);
  var reviewUndo = (key, n) => admin("POST", "/v1/admin/undo", key, { n });
  var reviewContext = (key, id) => admin("GET", `/v1/admin/context?id=${encodeURIComponent(id)}`, key);
  var reviewersList = (key) => admin("GET", "/v1/admin/reviewers", key);
  var reviewerAdd = (key, name) => admin("POST", "/v1/admin/reviewers/add", key, { name });
  var reviewerRevoke = (key, id) => admin("POST", "/v1/admin/reviewers/revoke", key, { id });
  var reviewerAddJudge = (key, name) => admin("POST", "/v1/admin/reviewers/add", key, { name, role: "judge" });
  var reviewContest = (key, id) => admin("GET", `/v1/admin/contest?id=${encodeURIComponent(id)}`, key);
  var reviewScore = (key, contest, post, score) => admin("POST", "/v1/admin/score", key, { contest, post, score });
  var manageContest = (key, body) => admin("POST", "/v1/admin/contests", key, body);
  var pauseGet = (key) => admin("GET", "/v1/admin/pause", key);
  var pauseSet = (key, body) => admin("POST", "/v1/admin/pause", key, body);
  var getContests = () => call("GET", "/v1/contests");
  var reviewPending = (key) => admin("GET", "/v1/admin/pending", key);
  var reviewPost = (key, id) => admin("GET", `/v1/admin/post?id=${encodeURIComponent(id)}`, key);
  var reviewDecide = (key, id, approve, reason) => admin("POST", "/v1/admin/decide", key, { id, approve: !!approve, reason: reason || "" });
  var reviewRemove = (key, id) => admin("POST", "/v1/admin/remove", key, { id });
  var notesList = (key, closed) => admin("GET", "/v1/admin/threads" + (closed ? "?status=closed" : ""), key);
  var noteGet = (key, id) => admin("GET", `/v1/admin/thread?id=${encodeURIComponent(id)}`, key);
  var noteOpen = (key, post, text) => admin("POST", "/v1/admin/thread/open", key, { post, text });
  var noteReply = (key, id, text) => admin("POST", "/v1/admin/thread/reply", key, { id, text });
  var noteClose = (key, id) => admin("POST", "/v1/admin/thread/close", key, { id });
  var myNotes = () => authed("GET", "/v1/threads");
  var myNote = (id) => authed("GET", `/v1/thread?id=${encodeURIComponent(id)}`);
  var myNoteReply = (id, text) => authed("POST", "/v1/thread/reply", { id, text });
  var myNoteClose = (id) => authed("POST", "/v1/thread/close", { id });
  var NOTE_MAX = 500;
  var artUrl = (p) => typeof p === "string" && /^art\/[a-z0-9-]{1,40}\.png$/.test(p) ? GALLERY_RAW + p : "";
  var validId = (p) => p && /^[0-9a-z]{3,8}$/.test(p.id);
  function withArt(p) {
    return {
      ...p,
      parts: (p.parts || []).map((c) => ({
        ...c,
        art: artUrl(c.art),
        picture: c.picture ? artUrl(c.picture) || void 0 : void 0,
        tribes: (c.tribes || []).map((t) => ({ ...t, icon: artUrl(t.icon) }))
      }))
    };
  }
  async function getIndex() {
    const idx = await request("GET", `${GALLERY_RAW}index.json?t=${Math.floor(Date.now() / 6e4)}`);
    return (idx && Array.isArray(idx.posts) ? idx.posts : []).filter(validId).map(withArt);
  }
  async function getContestsFile() {
    const f = await request("GET", `${GALLERY_RAW}contests.json?t=${Math.floor(Date.now() / 6e4)}`);
    return (f && Array.isArray(f.contests) ? f.contests : []).filter((c) => c && /^c[0-9a-z]{1,8}$/.test(c.id)).map((c) => ({
      ...c,
      entries: (Array.isArray(c.entries) ? c.entries : []).filter(validId).map(withArt)
    }));
  }
  var dataBytes = (s) => typeof s === "string" && s.startsWith("data:") ? Math.floor((s.length - s.indexOf(",") - 1) * 3 / 4) : 0;
  function toUploadPart(p) {
    const out = { type: p.type, name: p.name, desc: p.desc || "" };
    ["cost", "atk", "hp"].forEach((k) => {
      if (Number.isInteger(p[k])) out[k] = p[k];
    });
    if (p.rarity) out.rarity = p.rarity;
    if (p.soul) out.soul = p.soul;
    if (p.picture) out.picture = p.picture;
    else if (p.art) out.art = p.art;
    const tribes = (p.tribes || []).filter((t) => t && typeof t.icon === "string" && t.icon.startsWith("data:image/png"));
    if (tribes.length) out.tribes = tribes.map((t) => ({ name: t.name || "", icon: t.icon }));
    return out;
  }
  var pictures = (u) => [u.art, u.picture, ...(u.tribes || []).map((t) => t.icon)].filter(Boolean);
  function uploadProblems(entries2) {
    const out = [];
    entries2.forEach((e) => e.parts.forEach((p) => {
      const u = toUploadPart(p);
      pictures(u).forEach((pic) => {
        if (!/^data:image\/png;base64,/.test(pic)) out.push(`${p.name || "A card"}: its art isn't a PNG.`);
        else if (dataBytes(pic) > PICTURE_MAX_BYTES) out.push(`${p.name || "A card"}: its art is too big (over 150 KB).`);
      });
      if (!u.art && !u.picture && p.type !== "Enchantment") out.push(`${p.name || "A card"}: no art.`);
    }));
    return [...new Set(out)];
  }
  function splitUploads(entries2) {
    const batches = [];
    let cur = [], pics = 0, bytes = 0;
    for (const e of entries2) {
      const parts = e.parts.map(toUploadPart);
      const ePics = parts.reduce((n, u) => n + pictures(u).length, 0);
      const eBytes = parts.reduce((n, u) => n + pictures(u).reduce((m, s) => m + dataBytes(s), 0), 0);
      if (cur.length && (cur.length >= UPLOAD_MAX_ENTRIES || pics + ePics > UPLOAD_MAX_PICTURES || bytes + eBytes > UPLOAD_MAX_BYTES)) {
        batches.push(cur);
        cur = [];
        pics = 0;
        bytes = 0;
      }
      cur.push({ kind: e.kind, title: e.title || "", parts, local: e });
      pics += ePics;
      bytes += eBytes;
    }
    if (cur.length) batches.push(cur);
    return batches;
  }
  async function uploadEntries(entries2, onProgress, contest) {
    const batches = splitUploads(entries2);
    const sent = [];
    for (let i = 0; i < batches.length; i++) {
      if (onProgress) onProgress(i, batches.length);
      let res;
      try {
        res = await authed("POST", "/v1/posts", { entries: batches[i].map(({ local, ...e }) => e), ...contest ? { contest } : {} });
      } catch (e) {
        e.extra = { ...e.extra || {}, sent };
        throw e;
      }
      res.posts.forEach((p, k) => sent.push({ ...p, local: batches[i][k].local }));
    }
    if (onProgress) onProgress(batches.length, batches.length);
    return sent;
  }
  function createVoteQueue({ onSent, onError }) {
    let queue = {};
    let timer = null;
    let sending = null;
    const flush = async () => {
      clearTimeout(timer);
      if (sending) await sending.catch(() => null);
      const batch = queue;
      if (!Object.keys(batch).length) return;
      queue = {};
      sending = (async () => {
        const ids = Object.keys(batch);
        for (let i = 0; i < ids.length; i += 100) {
          const part = Object.fromEntries(ids.slice(i, i + 100).map((id) => [id, batch[id]]));
          try {
            const r = await sendVotes(part);
            if (onSent) onSent(part, r);
          } catch (e) {
            Object.entries(part).forEach(([id, v]) => {
              if (!(id in queue)) queue[id] = v;
            });
            if (onError) onError(e);
            return;
          }
        }
      })();
      await sending;
      sending = null;
    };
    return {
      add(id, v) {
        queue[id] = v;
        clearTimeout(timer);
        timer = setTimeout(flush, 2e3);
      },
      flush,
      pending: () => ({ ...queue })
    };
  }
  var GUIDELINES_URL = "https://raw.githubusercontent.com/theWiza2341/Wizascript/sounds/gallery-guidelines.md";
  var GUIDE_KEY = "wizascript.cardMaker.guidelines";
  var GUIDE_TTL = 60 * 60 * 1e3;
  var DEFAULT_GUIDELINES = `# Gallery guidelines
- **Explain it.** Using a custom keyword? Upload it as a set that includes its description. Existing UC cards and artifacts can just be named.
- **Keep it codable.** Effects that would be very hard to build in UC (multi-selects, aura keywords) are usually turned down. Judged case by case.
- **New ideas, not number tweaks.** No +1/-1 buffs or nerfs of existing cards. Reworks and big effect changes are fine.
- **UT, UTY and Deltarune sprites only.** Art from other fangames gets rejected.
- **Cardifacts rules apply.** Don't post anything you couldn't post in the channel.`;
  function parseGuidelines(text) {
    const out = { title: "", intro: [], rules: [] };
    String(text || "").split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (/^#\s+/.test(line)) {
        if (!out.title) out.title = line.replace(/^#+\s+/, "");
        return;
      }
      if (/^[-*]\s+/.test(line)) out.rules.push(line.replace(/^[-*]\s+/, ""));
      else if (out.rules.length) out.rules[out.rules.length - 1] += " " + line;
      else out.intro.push(line);
    });
    return out;
  }
  function cachedGuidelines() {
    try {
      const c = JSON.parse(GM_getValue(GUIDE_KEY, "null"));
      return c && typeof c.text === "string" ? c : null;
    } catch (e) {
      return null;
    }
  }
  function getGuidelines() {
    const c = cachedGuidelines();
    if (c && Date.now() - c.at < GUIDE_TTL) return Promise.resolve(c.text);
    const fallback = () => c ? c.text : DEFAULT_GUIDELINES;
    return http("GET", GUIDELINES_URL + "?t=" + Math.floor(Date.now() / 6e4), { timeout: 8e3 }).then((r) => {
      const text = r.status === 200 ? String(r.text || "") : "";
      if (!parseGuidelines(text).rules.length) return fallback();
      try {
        GM_setValue(GUIDE_KEY, JSON.stringify({ at: Date.now(), text }));
      } catch (e) {
      }
      return text;
    }, fallback);
  }

  // ../wz/packages/card-maker/gallery/notes.js
  var NOTES_CSS = `
.wz-nt-list { display: flex; flex-direction: column; gap: 6px; }
.wz-nt-row { display: flex; align-items: center; gap: 8px; text-align: left; background: #111; border: 1px solid #444; border-radius: 3px; color: #ddd; padding: 8px 10px; font: 13px Arial, sans-serif; cursor: pointer; }
.wz-nt-row:hover { border-color: #aaa; color: #fff; }
.wz-nt-row.unread { border-color: #ffd84a; }
.wz-nt-row .t { font-weight: bold; color: #fff; }
.wz-nt-row .grow { flex: 1 1 auto; }
.wz-nt-dot { display: inline-block; width: 8px; height: 8px; border-radius: 4px; background: #ffd84a; flex: none; }
.wz-nt-thread { display: flex; flex-direction: column; gap: 8px; max-width: 760px; }
.wz-nt-msgs { display: flex; flex-direction: column; gap: 6px; }
.wz-nt-msg { max-width: 85%; padding: 6px 10px; border-radius: 6px; background: #1d1d1d; border: 1px solid #444; font: 13px/1.4 Arial, sans-serif; white-space: pre-wrap; overflow-wrap: anywhere; }
.wz-nt-msg.me { align-self: flex-end; background: #1d2a44; border-color: #4464bd; }
.wz-nt-msg .who { display: block; font-size: 11px; opacity: .7; margin-bottom: 2px; white-space: normal; }
.wz-nt-compose textarea { width: 100%; min-height: 64px; resize: vertical; box-sizing: border-box; background: #222; color: #fff; border: 1px solid #666; border-radius: 3px; padding: 6px 8px; font: 13px Arial, sans-serif; }
.wz-nt-compose textarea:focus { border-color: #8ea6e8; outline: none; }
.wz-nt-closed { padding: 6px 10px; border: 1px dashed #666; border-radius: 3px; color: #aaa; font-size: 12px; }
.wz-nt-btn { background: none; border: 1px solid #888; border-radius: 3px; color: #ddd; font: 11px Arial, sans-serif; padding: 0 5px; height: 18px; cursor: pointer; }
.wz-nt-btn:hover { color: #fff; border-color: #fff; }
.wz-nt-btn.unread { border-color: #ffd84a; color: #ffd84a; }
`;
  var ago = (t) => {
    const m = Math.max(0, Math.round((Date.now() - t) / 6e4));
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
  };
  var WHY = { closed: "closed", approved: "the post was approved", cancelled: "the upload was cancelled", withdrawn: "the entry was withdrawn", deleted: "the post was deleted" };
  function createNotes(ctx) {
    const staff = { open: null, closed: null, archive: false, loading: false, error: "", at: 0 };
    const mine = { list: null, loading: false, error: "", at: 0 };
    let cur = null;
    let compose = null;
    async function refreshStaff(force) {
      const key = ctx.reviewerKey();
      if (!key || !ctx.isStaff() || staff.loading || !force && staff.at && Date.now() - staff.at < 3e4) return;
      staff.loading = true;
      try {
        const [o, c] = await Promise.all([notesList(key, false), staff.archive ? notesList(key, true) : Promise.resolve(null)]);
        staff.open = o.threads;
        if (c) staff.closed = c.threads;
        staff.error = "";
        staff.at = Date.now();
      } catch (e) {
        staff.error = ctx.errText(e);
      }
      staff.loading = false;
      ctx.changed();
    }
    async function refreshMine(force) {
      if (mine.loading || !force && mine.at && Date.now() - mine.at < 3e4) return;
      mine.loading = true;
      try {
        mine.list = (await myNotes()).threads;
        mine.error = "";
        mine.at = Date.now();
      } catch (e) {
        mine.list = e && e.code === "not_linked" ? [] : mine.list;
        mine.error = e && e.code === "not_linked" ? "" : ctx.errText(e);
      }
      mine.loading = false;
      ctx.changed();
    }
    const staffUnread = () => (staff.open || []).filter((t) => t.unread).length;
    const mineUnread = () => (mine.list || []).filter((t) => t.unread).length;
    const hasMine = () => !!(mine.list && mine.list.length);
    const mineFor = (postId) => (mine.list || []).find((t) => t.post === postId && t.status === "open") || null;
    async function openThread(id, side) {
      compose = null;
      cur = { id, side, thread: null, messages: [], error: "", draft: cur && cur.id === id ? cur.draft : "", sending: false };
      ctx.render();
      try {
        const r = side === "staff" ? await noteGet(ctx.reviewerKey(), id) : await myNote(id);
        if (!cur || cur.id !== id) return;
        cur.thread = r.thread;
        cur.messages = r.messages;
        const list = side === "staff" ? [...staff.open || [], ...staff.closed || []] : mine.list || [];
        list.filter((t) => t.id === id).forEach((t) => {
          t.unread = false;
        });
      } catch (e) {
        if (cur && cur.id === id) cur.error = ctx.errText(e);
      }
      ctx.changed();
      ctx.render();
    }
    function closeThreadView() {
      cur = null;
      compose = null;
      ctx.render();
    }
    function startNote(post) {
      cur = null;
      compose = { post: post.id, title: post.title || "", draft: "", sending: false, error: "" };
      ctx.render();
    }
    async function send() {
      if (!cur || cur.sending) return;
      const text = cur.draft.trim();
      if (!text) return;
      cur.sending = true;
      cur.error = "";
      ctx.render();
      try {
        if (cur.side === "staff") await noteReply(ctx.reviewerKey(), cur.id, text);
        else await myNoteReply(cur.id, text);
        cur.draft = "";
        cur.sending = false;
        await openThread(cur.id, cur.side);
        if (cur.side === "staff") refreshStaff(true);
        else refreshMine(true);
        return;
      } catch (e) {
        cur.error = ctx.errText(e);
      }
      cur.sending = false;
      ctx.render();
    }
    async function closeIt() {
      if (!cur) return;
      try {
        if (cur.side === "staff") await noteClose(ctx.reviewerKey(), cur.id);
        else await myNoteClose(cur.id);
        ctx.say("Note closed. It's kept in the log.");
        const { id, side } = cur;
        await openThread(id, side);
        if (side === "staff") refreshStaff(true);
        else refreshMine(true);
      } catch (e) {
        cur.error = ctx.errText(e);
        ctx.render();
      }
    }
    async function sendNew() {
      if (!compose || compose.sending) return;
      const text = compose.draft.trim();
      if (!text) return;
      compose.sending = true;
      compose.error = "";
      ctx.render();
      try {
        const r = await noteOpen(ctx.reviewerKey(), compose.post, text);
        compose = null;
        refreshStaff(true);
        await openThread(r.id, "staff");
      } catch (e) {
        compose.error = ctx.errText(e);
        compose.sending = false;
        ctx.render();
      }
    }
    const textBox = (state2, onEnter) => {
      const counter = h("span", { class: "dim", text: `${state2.draft.length}/${NOTE_MAX}` });
      const ta = h("textarea", {
        maxLength: NOTE_MAX,
        placeholder: "Write a note (text only, no links)",
        oninput: (e) => {
          state2.draft = e.target.value;
          counter.textContent = `${state2.draft.length}/${NOTE_MAX}`;
        },
        onkeydown: (e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onEnter();
          }
          e.stopPropagation();
        }
      });
      ta.value = state2.draft;
      return { ta, counter };
    };
    function closeButton() {
      const b = button("Close note", () => {
      }, { title: "End this conversation. It stays in the log." });
      let armed = null;
      b.onclick = () => {
        if (!armed) {
          b.textContent = "Close it?";
          b.classList.add("wz-key-danger");
          armed = setTimeout(() => {
            armed = null;
            b.textContent = "Close note";
            b.classList.remove("wz-key-danger");
          }, 3e3);
          return;
        }
        clearTimeout(armed);
        b.disabled = true;
        closeIt();
      };
      return b;
    }
    function threadView() {
      const t = cur.thread;
      const back = button("\u2190 Back", closeThreadView);
      if (!t) return h("div", { class: "wz-nt-thread" }, h("div", { class: "wz-gl-bar" }, back), cur.error ? h("div", { class: "wz-gl-issues", text: cur.error }) : h("p", { class: "wz-gl-note", text: "Loading\u2026" }));
      const meSide = cur.side;
      const head = h("div", { class: "wz-gl-bar" }, back, h("b", { text: ` "${t.title}"` }), h("span", { class: "dim", text: ` #${t.post}${meSide === "staff" ? ` \xB7 by ${t.author}` : ""}` }));
      const msgs = h("div", { class: "wz-nt-msgs" }, cur.messages.map((m) => h(
        "div",
        { class: `wz-nt-msg${m.side === meSide ? " me" : ""}` },
        h("span", { class: "who", text: `${m.side === "staff" ? meSide === "author" ? `${m.who} (gallery staff)` : m.who : m.who} \xB7 ${ago(m.at)}` }),
        m.text
      )));
      const parts = [head, msgs];
      if (t.status === "open") {
        const { ta, counter } = textBox(cur, send);
        parts.push(
          h("div", { class: "wz-nt-compose" }, ta),
          h("div", { class: "wz-gl-bar" }, button(cur.sending ? "Sending\u2026" : "Send", send, { primary: true, title: "Ctrl+Enter sends" }), counter, h("span", { class: "wz-gl-grow" }), closeButton())
        );
        setTimeout(() => {
          if (ta.isConnected && !cur.draft) ta.focus();
        }, 30);
      } else {
        parts.push(h("div", { class: "wz-nt-closed", text: `Closed by ${t.closedBy}${t.closeWhy && t.closeWhy !== "closed" ? ` (${WHY[t.closeWhy] || t.closeWhy})` : ""} \xB7 ${ago(t.closedAt)}.${meSide === "author" ? " Kept for the gallery's records." : ""}` }));
      }
      if (cur.error) parts.push(h("div", { class: "wz-gl-issues", text: cur.error }));
      return h("div", { class: "wz-nt-thread" }, parts);
    }
    function row(t, side) {
      const other = side === "staff" ? t.author : "gallery staff";
      return h(
        "button",
        { type: "button", class: `wz-nt-row${t.unread ? " unread" : ""}`, onclick: () => openThread(t.id, side) },
        t.unread ? h("span", { class: "wz-nt-dot", title: "New message" }) : null,
        h("span", { class: "t", text: t.title }),
        h("span", { class: "dim", text: `#${t.post} \xB7 ${other}` }),
        h("span", { class: "grow" }),
        h("span", { class: "dim", text: t.status === "open" ? `${t.msgs} message${t.msgs === 1 ? "" : "s"} \xB7 last from ${t.lastFrom === "staff" ? "staff" : side === "staff" ? t.author : "you"} ${ago(t.lastAt)}` : `closed ${ago(t.closedAt)}` })
      );
    }
    function staffView() {
      if (compose) {
        const { ta, counter } = textBox(compose, sendNew);
        setTimeout(() => {
          if (ta.isConnected) ta.focus();
        }, 30);
        return h(
          "div",
          { class: "wz-nt-thread" },
          h("div", { class: "wz-gl-bar" }, button("\u2190 Back", closeThreadView), h("b", { text: ` New note on "${compose.title}"` }), h("span", { class: "dim", text: ` #${compose.post}` })),
          h("p", { class: "wz-gl-note", text: "The post's author sees it in the gallery and can answer. If the post already has an open note, this adds to it." }),
          h("div", { class: "wz-nt-compose" }, ta),
          h("div", { class: "wz-gl-bar" }, button(compose.sending ? "Sending\u2026" : "Send", sendNew, { primary: true }), counter),
          compose.error ? h("div", { class: "wz-gl-issues", text: compose.error }) : null
        );
      }
      if (cur && cur.side === "staff") return threadView();
      const pick = (archive) => {
        staff.archive = archive;
        refreshStaff(true);
        ctx.render();
      };
      const head = h(
        "div",
        { class: "wz-gl-bar" },
        h("span", { class: "wz-gl-sizes" }, button("Open", () => pick(false), { cls: staff.archive ? "" : "wz-gl-on" }), button("Archive", () => pick(true), { cls: staff.archive ? "wz-gl-on" : "", title: "Closed notes, with every message" })),
        h("span", { class: "wz-gl-grow" }),
        button("\u21BB Refresh", () => refreshStaff(true))
      );
      if (staff.error) return h("div", {}, head, h("div", { class: "wz-gl-issues", text: staff.error }));
      const list = staff.archive ? staff.closed : staff.open;
      if (!list) return h("div", {}, head, h("p", { class: "wz-gl-note", text: "Loading\u2026" }));
      const sorted = staff.archive ? list : list.slice().sort((a, b) => b.unread - a.unread || b.lastAt - a.lastAt);
      const note = h("p", { class: "wz-gl-note", text: staff.archive ? "Closed notes, newest first." : "Notes with each post's author. Start one with Note\u2026 on an upload, \u2709 on a post in Browse, or \u2709 in the Log." });
      if (!sorted.length) return h("div", {}, head, note, h("p", { class: "wz-gl-note", text: staff.archive ? "Nothing closed yet." : "No open notes." }));
      return h("div", {}, head, note, h("div", { class: "wz-nt-list" }, sorted.map((t) => row(t, "staff"))));
    }
    function mineView() {
      if (cur && cur.side === "author") return threadView();
      const head = h("div", { class: "wz-gl-bar" }, h("b", { text: "Notes from the gallery staff" }), h("span", { class: "wz-gl-grow" }), button("\u21BB Refresh", () => refreshMine(true)));
      if (mine.error) return h("div", {}, head, h("div", { class: "wz-gl-issues", text: mine.error }));
      if (!mine.list) return h("div", {}, head, h("p", { class: "wz-gl-note", text: "Loading\u2026" }));
      if (!mine.list.length) return h("div", {}, head, h("p", { class: "wz-gl-note", text: "No notes. When the gallery staff write about one of your posts, it shows here." }));
      return h(
        "div",
        {},
        head,
        h("p", { class: "wz-gl-note", text: "About your posts. Answer here; either side can close a note when it's settled." }),
        h("div", { class: "wz-nt-list" }, mine.list.map((t) => row(t, "author")))
      );
    }
    return { refreshStaff, refreshMine, staffUnread, mineUnread, hasMine, mineFor, openThread, startNote, staffView, mineView, inThread: () => !!(cur || compose), reset() {
      cur = null;
      compose = null;
    } };
  }
  var AUTH_KEY2 = "wizascript.cardMaker.galleryAuth";
  var NOTES_CHECK_KEY = "wizascript.cardMaker.notesCheck";
  var NOTES_SHOWN_KEY = "wizascript.cardMaker.notesShown";
  async function newNoteAlerts({ every = 5 * 6e4 } = {}) {
    let auth2 = null;
    try {
      auth2 = GM_getValue(AUTH_KEY2, null);
    } catch (e) {
      return [];
    }
    if (!auth2) return [];
    let check = {};
    try {
      check = JSON.parse(GM_getValue(NOTES_CHECK_KEY, "{}")) || {};
    } catch (e) {
      check = {};
    }
    const wait = check.notLinked ? 6 * 36e5 : every;
    if (check.at && Date.now() - check.at < wait) return [];
    let threads;
    try {
      threads = (await myNotes()).threads || [];
      GM_setValue(NOTES_CHECK_KEY, JSON.stringify({ at: Date.now() }));
    } catch (e) {
      GM_setValue(NOTES_CHECK_KEY, JSON.stringify({ at: Date.now(), notLinked: e && e.code === "not_linked" }));
      return [];
    }
    let shown = {};
    try {
      shown = JSON.parse(GM_getValue(NOTES_SHOWN_KEY, "{}")) || {};
    } catch (e) {
      shown = {};
    }
    const fresh = threads.filter((t) => t.unread && t.status === "open" && shown[t.id] !== t.lastAt);
    const keep = {};
    threads.forEach((t) => {
      if (shown[t.id]) keep[t.id] = shown[t.id];
    });
    fresh.forEach((t) => {
      keep[t.id] = t.lastAt;
    });
    GM_setValue(NOTES_SHOWN_KEY, JSON.stringify(keep));
    return fresh;
  }
  var alertText = (fresh) => fresh.length === 1 ? `New message on "${fresh[0].title}"` : `New messages on ${fresh.length} of your posts`;

  // ../wz/packages/card-maker/gallery/browse.js
  var LISTS = [["new", "Newest"], ["week", "This Week"], ["month", "This Month"], ["all", "All Time"]];
  var DT = `"DTM-Mono", "DTM Mono", "WZ DTM Mono", monospace`;
  var BROWSE_CSS = `
.wz-gl-browse { --wz-gl-accent: #ffd84a; display: flex; flex-direction: column; height: 100%; min-height: 0; }
.wz-gl-dt { font-family: ${DT}; }
.wz-gl-empty { opacity: .7; padding: 20px 0; text-align: center; }
.wz-gl-pagearea { flex: 1 1 auto; min-height: 0; overflow: hidden; position: relative; }
.wz-gl-pagearea .wz-gl-grid { align-content: flex-start; padding-top: 4px; }
.wz-gl-foot { display: flex; align-items: center; gap: 8px; padding-top: 6px; border-top: 1px solid #2a2a2a; min-height: 30px; }
.wz-gl-foot .note { opacity: .5; font-size: 11px; }
.wz-gl-foot .grow { flex: 1; }
.wz-gl-refresh { background: #000; border: 2px solid #777; color: #ccc; width: 26px; height: 24px; padding: 0; cursor: pointer; font-size: 14px; line-height: 18px; }
.wz-gl-refresh:hover { border-color: #fff; color: #fff; }
.wz-gl-pager { display: flex; align-items: center; gap: 6px; }
.wz-gl-pager button { background: #000; border: 2px solid #fff; color: #fff; width: 28px; height: 26px; padding: 0; font: 15px/20px ${DT}; cursor: pointer; }
.wz-gl-pager button:hover:not(:disabled) { color: var(--wz-gl-accent); border-color: var(--wz-gl-accent); }
.wz-gl-pager button:disabled { opacity: .3; cursor: default; }
.wz-gl-pager .n { font: 13px ${DT}; min-width: 54px; text-align: center; }

/* item + votes */
.wz-gl-item { position: relative; transition: transform .12s; }
.wz-gl-item:hover { transform: translateY(-2px); }
.wz-gl-item.set { border: 2px solid #555; background: #0a0a0a; padding: 4px 6px 3px; }
.wz-gl-item.set:hover { border-color: #fff; }
.wz-gl-setname { font-family: ${DT}; font-size: 12px; color: var(--wz-gl-accent); letter-spacing: .5px; }
.wz-gl-votes { gap: 6px; }
.wz-gl-vote { background: none; border: 0; padding: 0 3px; cursor: pointer; font-size: 13px; line-height: 16px; color: #777; }
.wz-gl-vote:hover { color: #fff; }
.wz-gl-vote.up.on { color: #3ee05a; }
.wz-gl-vote.down.on { color: #ff4d4d; }
.wz-gl-score { font-family: ${DT}; font-size: 13px; min-width: 28px; }
.wz-gl-score.pos { color: #b9f5c3; } .wz-gl-score.neg { color: #f5b9b9; }
.wz-gl-rank { color: var(--wz-gl-accent); font: 12px/16px ${DT}; margin-right: 4px; }
.wz-gl-sethead { display: flex; align-items: center; gap: 8px; align-self: stretch; min-width: 0; }
.wz-gl-sethead .wz-gl-setname { flex: 1 1 auto; min-width: 0; text-align: center; }
.wz-gl-mine { flex: none; background: #4464bd; border: 1px solid #8ea6e8; color: #fff; font: 9px/13px Arial, sans-serif; padding: 0 4px; white-space: nowrap; }
.wz-gl-votes .wz-gl-mine { order: 9; margin-left: 2px; }

/* slide-in */
@keyframes wz-gl-in-r { from { transform: translateX(60px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes wz-gl-in-l { from { transform: translateX(-60px); opacity: 0; } to { transform: none; opacity: 1; } }
.wz-gl-in-r { animation: wz-gl-in-r .25s ease-out; }
.wz-gl-in-l { animation: wz-gl-in-l .25s ease-out; }

/* list bar */
.wz-gl-listbar { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; flex: none; }
.wz-gl-filters { display: flex; gap: 6px; }
.wz-gl-filter { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; background: #000; border: 2px solid #777; color: #bbb; font: 13px ${DT}; cursor: pointer; }
.wz-gl-filter:hover { border-color: #fff; color: #fff; }
.wz-gl-filter .box { display: inline-block; width: 12px; height: 12px; border: 2px solid currentColor; font-size: 10px; line-height: 9px; text-align: center; }
.wz-gl-filter.on { border-color: var(--wz-gl-accent); color: var(--wz-gl-accent); }
.wz-gl-mine.pending { background: #6b5a14; border-color: #ffd84a; }
.wz-gl-remove { background: none; border: 1px solid #553; color: #a88; font-size: 10px; line-height: 14px; padding: 0 4px; margin-left: 4px; cursor: pointer; }
.wz-gl-remove:hover, .wz-gl-remove.armed { border-color: #e07a7a; color: #ffb4b4; }
.wz-gl-mine.rejected { background: #5a1f1f; border-color: #e07a7a; }
.wz-gl-seg { position: relative; display: flex; margin: 0; width: 100%; max-width: 560px; flex: 1 1 360px; border: 2px solid #fff; background: #000; }
.wz-gl-seg button { flex: 1 1 0; position: relative; z-index: 1; background: none; border: 0; color: #bbb; padding: 6px 0 5px; font-size: 14px; cursor: pointer; font-family: ${DT}; }
.wz-gl-seg button:hover { color: #fff; }
.wz-gl-seg button.on { color: #000; }
.wz-gl-seg .pill { position: absolute; top: 0; bottom: 0; width: 25%; background: var(--wz-gl-accent); transition: left .25s ease; }
`;
  function allEntries({ approved, own, totals, baseVotes, current: current2, account }) {
    const now = Date.now();
    const days = (t) => Math.max(0, Math.floor((now - (t || now)) / 864e5));
    const server2 = approved.map((p) => {
      const t = totals[p.id] || [0, 0];
      const vote = current2[p.id] || 0;
      return {
        key: p.id,
        id: p.id,
        kind: p.kind,
        title: p.title,
        parts: p.parts,
        author: p.author,
        status: "approved",
        ...p.contest ? { contest: p.contest } : {},
        mine: !!account && p.author === account,
        days: days(p.approvedAt || p.postedAt),
        vote,
        score: t[0] - t[1] - (baseVotes[p.id] || 0) + vote
      };
    });
    const waiting = own.map((p) => ({
      key: p.id,
      id: p.id,
      kind: p.kind,
      title: p.title,
      parts: p.parts,
      author: account,
      status: p.status,
      reason: p.reason,
      mine: true,
      days: days(p.postedAt),
      vote: 0,
      score: 0
    }));
    return server2.concat(waiting);
  }
  function filtered(entries2, { mineOnly, likedOnly }) {
    return entries2.filter((e) => (!mineOnly || e.mine) && (!likedOnly || e.vote === 1));
  }
  function listFor(entries2, key) {
    if (key === "new") return entries2.slice().sort((a, b) => a.days - b.days || b.score - a.score);
    const max = key === "week" ? 7 : key === "month" ? 30 : Infinity;
    return entries2.filter((e) => e.days < max).sort((a, b) => b.score - a.score);
  }
  function browseView(ctx) {
    const { state: state2 } = ctx;
    const list = listFor(filtered(ctx.entries, state2), state2.list);
    const dir = state2.dir;
    state2.dir = null;
    const area = h("div", { class: "wz-gl-pagearea" });
    const count = h("span", { class: "n" });
    const prev = h("button", { title: "Previous page", text: "\u2039", onclick: () => turn(-1) });
    const next = h("button", { title: "Next page", text: "\u203A", onclick: () => turn(1) });
    const foot = h(
      "div",
      { class: "wz-gl-foot" },
      ctx.onRefresh ? h("button", { type: "button", class: "wz-gl-refresh", title: "Load the latest posts and votes", text: "\u21BB", onclick: () => ctx.onRefresh() }) : null,
      h("span", { class: "note", text: ctx.note || "" }),
      h("span", { class: "grow" }),
      h("div", { class: "wz-gl-pager" }, prev, count, next)
    );
    const el = h("div", { class: "wz-gl-browse" }, h("div", { class: "wz-gl-listbar" }, segBar(ctx, dir), filterButtons(ctx)), area, foot);
    const items = list.map((e, i) => item(ctx, e, i + 1, state2.list));
    let pages = [[]];
    let animate = dir;
    function layout() {
      const H2 = area.clientHeight;
      const grid = h("div", { class: "wz-gl-grid" });
      area.replaceChildren(grid);
      if (!items.length) {
        area.replaceChildren(h("div", { class: "wz-gl-empty wz-gl-dt", text: ctx.emptyText ? ctx.emptyText : state2.mineOnly && !ctx.entries.some((e) => e.mine) ? "* You haven't uploaded anything yet." : state2.likedOnly ? "* Nothing you've liked here yet." : "* Nothing here yet." }));
        pages = [[]];
        return show();
      }
      items.forEach((it) => {
        it.style.display = "";
        grid.appendChild(it);
      });
      items.forEach((it) => it.querySelectorAll(".wz-gl-card:not(.wz-gl-pic), .wz-gl-artifact").forEach(fitCard));
      const rows = [];
      let lastLeft = Infinity;
      items.forEach((it, i) => {
        const t = it.offsetTop, l = it.offsetLeft;
        if (!rows.length || l <= lastLeft) rows.push({ start: i, top: t, bottom: t + it.offsetHeight });
        lastLeft = l;
        const r = rows[rows.length - 1];
        r.end = i;
        r.top = Math.min(r.top, t);
        r.bottom = Math.max(r.bottom, t + it.offsetHeight);
      });
      pages = [];
      let page = null, pageTop = 0;
      rows.forEach((r) => {
        if (!page || r.bottom - pageTop > H2) {
          page = [];
          pages.push(page);
          pageTop = r.top;
        }
        for (let i = r.start; i <= r.end; i++) page.push(i);
      });
      state2.page = Math.max(0, Math.min(state2.page || 0, pages.length - 1));
      show();
    }
    function show() {
      const grid = area.querySelector(".wz-gl-grid");
      if (grid) {
        const on = new Set(pages[state2.page] || []);
        items.forEach((it, i) => {
          it.style.display = on.has(i) ? "" : "none";
        });
        grid.classList.remove("wz-gl-in-r", "wz-gl-in-l");
        if (animate) {
          void grid.offsetWidth;
          grid.classList.add("wz-gl-in-" + animate);
          animate = null;
        }
      }
      count.textContent = `${pages.length ? state2.page + 1 : 0} / ${pages.length}`;
      prev.disabled = state2.page <= 0;
      next.disabled = state2.page >= pages.length - 1;
    }
    function turn(d) {
      const to = state2.page + d;
      if (to < 0 || to >= pages.length) return false;
      state2.page = to;
      animate = d > 0 ? "r" : "l";
      ctx.onPage && ctx.onPage();
      show();
      return true;
    }
    let wheelLock = 0;
    area.addEventListener("wheel", (e) => {
      if (!ctx.wheelPages()) return;
      e.preventDefault();
      const now = Date.now();
      if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
      if (turn(e.deltaY > 0 ? 1 : -1)) wheelLock = now + 280;
    }, { passive: false });
    return { el, layout };
  }
  function filterButtons(ctx) {
    const { state: state2 } = ctx;
    const toggle = (key, label, title) => h("button", {
      type: "button",
      class: `wz-gl-filter${state2[key] ? " on" : ""}`,
      title,
      "aria-pressed": state2[key] ? "true" : "false",
      onclick: () => {
        state2[key] = !state2[key];
        state2.page = 0;
        ctx.rerender();
      }
    }, h("span", { class: "box", text: state2[key] ? "\u2713" : "" }), label);
    return h(
      "div",
      { class: "wz-gl-filters" },
      toggle("mineOnly", "My posts", "Only what you've uploaded"),
      toggle("likedOnly", "Liked", "Only what you've liked")
    );
  }
  function segBar(ctx, dir) {
    const { state: state2 } = ctx;
    const i = LISTS.findIndex((l) => l[0] === state2.list);
    const pill = h("span", { class: "pill", style: { left: (dir ? (i + (dir === "r" ? -1 : 1)) * 25 : i * 25) + "%" } });
    if (dir) requestAnimationFrame(() => requestAnimationFrame(() => {
      pill.style.left = i * 25 + "%";
    }));
    const go2 = (key) => {
      if (key === state2.list) return;
      const to = LISTS.findIndex((l) => l[0] === key);
      state2.dir = to > i ? "r" : "l";
      state2.list = key;
      state2.page = 0;
      ctx.rerender();
    };
    return h("div", { class: "wz-gl-seg" }, pill, LISTS.map(([k, l]) => h("button", { type: "button", class: k === state2.list ? "on" : "", text: l, onclick: () => go2(k) })));
  }
  function removeButton(ctx, e, { label = "\u2715", confirm = "Remove?", title = "Remove from the gallery (reviewer)", run = ctx.onRemove } = {}) {
    const b = h("button", { type: "button", class: "wz-gl-remove", title, text: label });
    let armed = null;
    b.addEventListener("click", () => {
      if (!armed) {
        b.classList.add("armed");
        b.textContent = confirm;
        armed = setTimeout(() => {
          armed = null;
          b.classList.remove("armed");
          b.textContent = label;
        }, 3e3);
        return;
      }
      clearTimeout(armed);
      b.disabled = true;
      b.textContent = "\u2026";
      run(e);
    });
    return b;
  }
  function item(ctx, e, rank, listKey) {
    const isSet = e.kind === "set";
    const vote = (dir) => ctx.vote(e, dir);
    const pending = e.status === "pending", rejected = e.status === "rejected";
    const tag = e.mine ? h("span", {
      class: `wz-gl-mine${pending ? " pending" : rejected ? " rejected" : ""}`,
      text: pending ? isSet ? "awaiting approval" : "pending" : rejected ? "not approved" : "yours",
      title: pending ? "Awaiting approval: shows to everyone once approved" : rejected ? "This upload wasn't approved" : "Your post"
    }) : null;
    const canVote = e.status === "approved";
    return h(
      "div",
      { class: `wz-gl-item${isSet ? " set" : ""}`, "data-key": e.key },
      isSet ? h("div", { class: "wz-gl-sethead" }, h("div", { class: "wz-gl-setname", text: e.title || "(no name)", title: e.title || "" }), tag) : null,
      h("div", { class: "wz-gl-row" }, e.parts.map((p) => ctx.hoverable(h("div", { class: "wz-gl-zoom" }, tile(p)), p, e))),
      h(
        "div",
        { class: "wz-gl-votes" },
        listKey !== "new" ? h("span", { class: "wz-gl-rank", title: "Rank", text: "# " + rank }) : null,
        isSet ? null : tag,
        canVote ? [
          h("button", { type: "button", class: `wz-gl-vote up${e.vote === 1 ? " on" : ""}`, title: "Like", text: "\u25B2", onclick: () => vote(1) }),
          h("span", { class: `wz-gl-score${e.score > 0 ? " pos" : e.score < 0 ? " neg" : ""}`, text: String(e.score) }),
          h("button", { type: "button", class: `wz-gl-vote down${e.vote === -1 ? " on" : ""}`, title: "Dislike", text: "\u25BC", onclick: () => vote(-1) })
        ] : null,
        ctx.onRemove && e.status === "approved" ? removeButton(ctx, e) : null,
        noteButton(ctx, e),
        ctx.onDelete && e.mine ? ownButton(ctx, e) : null
      )
    );
  }
  function noteButton(ctx, e) {
    const mineNote = ctx.noteFor ? ctx.noteFor(e) : null;
    if (mineNote) return h("button", { type: "button", class: `wz-nt-btn${mineNote.unread ? " unread" : ""}`, text: "\u2709", title: mineNote.unread ? "New message from the gallery staff" : "Your note with the gallery staff", onclick: () => ctx.openNote(mineNote) });
    if (ctx.onNote && e.status === "approved" && !e.sample) return h("button", { type: "button", class: "wz-nt-btn", text: "\u2709", title: "Start a note with this post's author", onclick: () => ctx.onNote(e) });
    return null;
  }
  function ownButton(ctx, e) {
    const run = ctx.onDelete;
    if (e.status === "pending") return removeButton(ctx, e, { label: "Cancel", confirm: "Cancel upload?", title: "Take this upload back before it's reviewed", run });
    if (e.status === "approved" && !e.contest) return removeButton(ctx, e, { label: "Delete", confirm: "Delete for everyone?", title: "Take your post out of the gallery (its votes go with it)", run });
    if (e.status === "rejected") return removeButton(ctx, e, { label: "Delete", confirm: "Delete for good?", title: "Delete this post: it wasn't approved, so it's only taking up space", run });
    return null;
  }
  function pagedGrid(items, { state: state2, wheelPages = () => true, onPage, empty = "* Nothing here yet." }) {
    const area = h("div", { class: "wz-gl-pagearea" });
    const count = h("span", { class: "n" });
    const prev = h("button", { type: "button", title: "Previous page", text: "\u2039", onclick: () => turn(-1) });
    const next = h("button", { type: "button", title: "Next page", text: "\u203A", onclick: () => turn(1) });
    const pager = h("div", { class: "wz-gl-pager" }, prev, count, next);
    let pages = [[]];
    let animate = null;
    function layout() {
      const H2 = area.clientHeight;
      const grid = h("div", { class: "wz-gl-grid" });
      area.replaceChildren(grid);
      if (!items.length) {
        area.replaceChildren(h("div", { class: "wz-gl-empty wz-gl-dt", text: empty }));
        pages = [[]];
        return show();
      }
      items.forEach((it) => {
        it.style.display = "";
        grid.appendChild(it);
      });
      items.forEach((it) => it.querySelectorAll(".wz-gl-card:not(.wz-gl-pic), .wz-gl-artifact").forEach(fitCard));
      const rows = [];
      let lastLeft = Infinity;
      items.forEach((it, i) => {
        const t = it.offsetTop, l = it.offsetLeft;
        if (!rows.length || l <= lastLeft) rows.push({ start: i, top: t, bottom: t + it.offsetHeight });
        lastLeft = l;
        const r = rows[rows.length - 1];
        r.end = i;
        r.top = Math.min(r.top, t);
        r.bottom = Math.max(r.bottom, t + it.offsetHeight);
      });
      pages = [];
      let page = null, pageTop = 0;
      rows.forEach((r) => {
        if (!page || r.bottom - pageTop > H2) {
          page = [];
          pages.push(page);
          pageTop = r.top;
        }
        for (let i = r.start; i <= r.end; i++) page.push(i);
      });
      state2.page = Math.max(0, Math.min(state2.page || 0, pages.length - 1));
      show();
    }
    function show() {
      const grid = area.querySelector(".wz-gl-grid");
      if (grid) {
        const on = new Set(pages[state2.page] || []);
        items.forEach((it, i) => {
          it.style.display = on.has(i) ? "" : "none";
        });
        grid.classList.remove("wz-gl-in-r", "wz-gl-in-l");
        if (animate) {
          void grid.offsetWidth;
          grid.classList.add("wz-gl-in-" + animate);
          animate = null;
        }
      }
      count.textContent = `${pages.length ? (state2.page || 0) + 1 : 0} / ${pages.length}`;
      prev.disabled = (state2.page || 0) <= 0;
      next.disabled = (state2.page || 0) >= pages.length - 1;
    }
    function turn(d) {
      const to = (state2.page || 0) + d;
      if (to < 0 || to >= pages.length) return false;
      state2.page = to;
      animate = d > 0 ? "r" : "l";
      if (onPage) onPage();
      show();
      return true;
    }
    let wheelLock = 0;
    area.addEventListener("wheel", (e) => {
      if (!wheelPages()) return;
      e.preventDefault();
      const now = Date.now();
      if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
      if (turn(e.deltaY > 0 ? 1 : -1)) wheelLock = now + 280;
    }, { passive: false });
    return { area, pager, layout };
  }

  // ../wz/packages/card-maker/gallery/contest.js
  var DT2 = `"DTM-Mono", "DTM Mono", "WZ DTM Mono", monospace`;
  var PLACES = ["1st", "2nd", "3rd"];
  var CONTEST_CSS = `
.wz-gl-cbar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; }
.wz-gl-chead { border: 2px solid #fff; background: #000; padding: 8px 12px; margin-bottom: 10px; }
.wz-gl-ctitle { font: 18px ${DT2}; color: #ffd84a; margin-bottom: 4px; }
.wz-gl-crules { white-space: pre-wrap; margin: 4px 0 6px; line-height: 1.4; }
.wz-gl-cmeta { opacity: .85; }
.wz-gl-cmeta b { color: #fff; }
.wz-gl-csub { font: 13px ${DT2}; margin: 12px 0 6px; color: #ddd; }
.wz-gl-place { font: 12px/16px ${DT2}; color: #ffd84a; }
.wz-gl-place.p1 { color: #ffd84a; } .wz-gl-place.p2 { color: #d8d8d8; } .wz-gl-place.p3 { color: #e09a5a; }
.wz-gl-item.p1 { border: 2px solid #ffd84a; } .wz-gl-item.p2 { border: 2px solid #d8d8d8; } .wz-gl-item.p3 { border: 2px solid #e09a5a; }
.wz-gl-avg { font-size: 11px; opacity: .8; }
.wz-gl-scores { display: flex; gap: 2px; align-items: center; }
.wz-gl-scorebtn { background: #000; border: 1px solid #777; color: #ccc; width: 20px; height: 18px; padding: 0; font: 11px/16px ${DT2}; cursor: pointer; }
.wz-gl-scorebtn:hover { border-color: #fff; color: #fff; }
.wz-gl-scorebtn.half { width: 26px; font-size: 10px; opacity: .85; }
.wz-gl-scorebtn.on { background: #ffd84a; border-color: #ffd84a; color: #000; }
.wz-gl-judge { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.wz-gl-judge .by { font-size: 10px; opacity: .7; max-width: 200px; text-align: center; }
.wz-gl-form { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 10px; align-items: center; max-width: 620px; margin: 6px 0 10px; }
.wz-gl-form label { margin: 0; font-weight: normal; opacity: .85; }
.wz-gl-panel textarea { color: #fff !important; background: #222 !important; border: 1px solid #666 !important; border-radius: 3px; font: 12px Arial, sans-serif; padding: 4px; min-height: 70px; resize: vertical; width: 100%; box-sizing: border-box; }
.wz-gl-panel input[type="datetime-local"], .wz-gl-panel input[type="number"] { color: #fff !important; background: #222 !important; border: 1px solid #666 !important; border-radius: 3px; font: 11px Arial, sans-serif; height: 22px; padding: 0 4px; color-scheme: dark; }
.wz-gl-cbox { border: 1px solid #444; background: #111; padding: 8px 10px; margin-bottom: 10px; }

/* roomier Contest tab (dev16 prototypes A/B/C) */
.wz-gl-cv { font-size: 14px; line-height: 1.45; }
.wz-gl-cv .wz-cm-btn { height: 28px; font-size: 13px; padding: 0 12px; }
.wz-gl-cnav { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #333; position: relative; flex-wrap: wrap; }
.wz-gl-cnow { background: #17150c; border: 2px solid #ffd84a; color: #ffd84a; padding: 4px 14px; font: 15px ${DT2}; cursor: pointer; display: flex; flex-direction: column; align-items: flex-start; line-height: 1.25; }
.wz-gl-cnow small { font: 11px Arial, sans-serif; opacity: .85; }
.wz-gl-cnow.on { background: #ffd84a; color: #000; }
.wz-gl-carch { background: #000; border: 2px solid #666; color: #bbb; padding: 0 10px; height: 32px; font: 13px ${DT2}; cursor: pointer; max-width: 190px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.wz-gl-carch:hover { border-color: #fff; color: #fff; }
.wz-gl-carch.on { border-color: #fff; color: #000; background: #ddd; }
.wz-gl-cnav .lbl { opacity: .6; font-size: 12px; }
.wz-gl-cdropwrap { position: relative; }
.wz-gl-cdrop { position: absolute; right: 0; top: calc(100% + 4px); z-index: 30; background: #000; border: 2px solid #fff; min-width: 260px; max-height: 300px; overflow: auto; padding: 4px 0; box-shadow: 0 8px 24px rgba(0,0,0,.8); }
.wz-gl-cdrop button { display: flex; justify-content: space-between; gap: 12px; width: 100%; background: none; border: 0; color: #ddd; padding: 6px 12px; text-align: left; font: 13px ${DT2}; cursor: pointer; }
.wz-gl-cdrop button:hover, .wz-gl-cdrop button.on { background: #222; color: #ffd84a; }
.wz-gl-cdrop button small { font: 11px Arial, sans-serif; opacity: .6; }
.wz-gl-chero { border: 2px solid #fff; background: #000; padding: 14px 18px; margin-bottom: 14px; }
.wz-gl-chero .t { font: 28px ${DT2}; color: #ffd84a; margin-bottom: 6px; }
.wz-gl-chero .r { white-space: pre-wrap; font-size: 15px; margin-bottom: 10px; }
.wz-gl-chero .m { font-size: 14px; opacity: .9; }
.wz-gl-cact { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 10px; }
.wz-gl-big { height: 38px !important; padding: 0 20px !important; font: 16px ${DT2} !important; }
.wz-gl-pips { display: inline-flex; gap: 4px; align-items: center; }
.wz-gl-pips i { width: 12px; height: 12px; border: 2px solid #ffd84a; border-radius: 50%; display: inline-block; }
.wz-gl-pips i.on { background: #ffd84a; }
.wz-gl-chip { display: inline-block; border: 1px solid #ffd84a; color: #ffd84a; padding: 1px 8px; font: 12px ${DT2}; }
.wz-gl-csec { font: 16px ${DT2}; color: #fff; margin: 16px 0 8px; display: flex; align-items: center; gap: 10px; }
.wz-gl-csec .n { opacity: .6; font-size: 13px; }
.wz-gl-cv .wz-gl-note { font-size: 13px; }
.wz-gl-cv .wz-gl-grid { gap: 16px 14px; }
.wz-gl-cv .wz-gl-avg { font-size: 12px; }
.wz-gl-cv .wz-gl-place { font-size: 14px; }
/* paged layouts: the tab fills the panel */
.wz-gl-cvp { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
.wz-gl-cvp > .wz-gl-cnav { flex: none; }
.wz-gl-cvbody { flex: 1 1 auto; min-height: 0; }
.wz-gl-cside { display: grid; grid-template-columns: 290px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 18px; }
.wz-gl-cside > .side { border: 2px solid #fff; background: #000; padding: 12px 14px; overflow: auto; min-height: 0; max-height: 100%; box-sizing: border-box; align-self: start; }
.wz-gl-cside > .side .t { font: 22px ${DT2}; color: #ffd84a; margin-bottom: 6px; }
.wz-gl-cside > .side .r { white-space: pre-wrap; margin-bottom: 10px; }
.wz-gl-cside > .side .wz-gl-big { width: 100%; margin-top: 8px; }
.wz-gl-cmain { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.wz-gl-cmain > .wz-gl-csec { flex: none; margin: 0 0 8px; }
.wz-gl-cmain > .wz-gl-pagearea { flex: 1 1 auto; }
.wz-gl-cmain > .wz-gl-foot { flex: none; }
.wz-gl-csort { display: inline-flex; gap: 4px; }
.wz-gl-cmine { margin-top: 12px; border-top: 1px solid #333; padding-top: 8px; display: flex; flex-direction: column; gap: 5px; }
.wz-gl-cmine div { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
.wz-gl-podlist { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.wz-gl-podlist div { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
`;
  var pad = (n) => String(n).padStart(2, "0");
  var toLocalInput = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  var fromLocalInput = (v) => {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : null;
  };
  var when = (ms) => new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  function inTime(ms) {
    const m = Math.round((ms - Date.now()) / 6e4);
    if (m <= 0) return "now";
    if (m < 60) return `in ${m} min`;
    const hrs = Math.floor(m / 60);
    if (hrs < 48) return `in ${hrs} h${m % 60 ? ` ${m % 60} min` : ""}`;
    return `in ${Math.floor(hrs / 24)} days`;
  }
  var plural = (n) => `${n} entr${n === 1 ? "y" : "ies"}`;
  var daysAgo = (t) => Math.max(0, Math.floor((Date.now() - (t || Date.now())) / 864e5));
  function createContests(ctx) {
    const cs = { list: null, file: null, at: 0, loading: false, error: "", pick: null, sort: "rank", drop: false, pages: {} };
    const js = { id: null, data: null, at: 0, loading: false, error: "", top: null };
    const cf = { title: "", rules: "", closes: "", max: 3, busy: false, editFor: null };
    async function refresh(force) {
      if (cs.loading || !force && cs.at && Date.now() - cs.at < 3e4) return;
      cs.loading = true;
      try {
        const [api, file] = await Promise.all([getContests(), getContestsFile().catch(() => null)]);
        cs.list = api && api.contests || [];
        if (file) cs.file = file;
        cs.error = "";
        cs.at = Date.now();
      } catch (e) {
        cs.error = ctx.errText(e);
      } finally {
        cs.loading = false;
        ctx.changed();
      }
    }
    const shownList = () => cs.list;
    const shownFile = (id) => (cs.file || []).find((c) => c.id === id) || null;
    const active = () => (cs.list || []).find((c) => c.status !== "archived") || null;
    const shownActive = active;
    function slots() {
      const c = active();
      if (!c || c.status !== "open") return null;
      const mine = ctx.acct.contest && ctx.acct.contest.id === c.id ? ctx.acct.contest : null;
      const used = mine ? mine.used : 0;
      return { contest: c, used, max: c.maxEntries, left: Math.max(0, c.maxEntries - used) };
    }
    function shownSlots(c) {
      const s = slots();
      return s && s.contest.id === c.id ? s : null;
    }
    function ownEntries(c) {
      return ctx.acct.posts.filter((p) => p.contest === c.id && ctx.draft.uploads[p.id]).map((p) => ({ ...ctx.draft.uploads[p.id], id: p.id, status: p.status, reason: p.reason, author: ctx.acct.account, postedAt: p.postedAt }));
    }
    function ranked(f) {
      const res = f.results || { order: [], scores: {} };
      const byId = new Map(f.entries.map((e) => [e.id, e]));
      const out = res.order.map((id) => byId.get(id)).filter(Boolean);
      f.entries.forEach((e) => {
        if (!res.order.includes(e.id)) out.push(e);
      });
      return { res, list: out };
    }
    function entryItem(e, { place, cls, below, style: style2 } = {}) {
      const isSet = e.kind === "set";
      const info = { author: e.author, days: daysAgo(e.approvedAt || e.postedAt), status: e.status || "approved", reason: e.reason };
      return h(
        "div",
        { class: `wz-gl-item${isSet ? " set" : ""}${cls ? " " + cls : ""}`, "data-key": e.id, style: style2 },
        isSet ? h("div", { class: "wz-gl-sethead" }, h("div", { class: "wz-gl-setname", text: e.title || "(no name)", title: e.title || "" })) : null,
        h("div", { class: "wz-gl-row" }, e.parts.map((p) => ctx.hoverable(h("div", { class: "wz-gl-zoom" }, tile(p)), p, info))),
        place || below ? h("div", { class: "wz-gl-votes" }, place || null, below || null) : null
      );
    }
    const placeTag = (i) => h("span", { class: `wz-gl-place${i < 3 ? ` p${i + 1}` : ""}`, text: i < 3 ? PLACES[i] : `# ${i + 1}` });
    const avgTag = (sc) => h("span", { class: "wz-gl-avg", text: sc && sc.n ? `${sc.avg.toFixed(2)} (${sc.n} judge${sc.n === 1 ? "" : "s"})` : "not scored" });
    function nav2(cur, archived) {
      const pick = (id) => {
        cs.pick = id;
        cs.drop = false;
        ctx.render();
      };
      const recent = archived.slice(0, 3);
      const drop = cs.drop ? h("div", { class: "wz-gl-cdrop" }, archived.map((c) => h(
        "button",
        { type: "button", class: cs.pick === c.id ? "on" : "", onclick: () => pick(c.id) },
        h("span", { text: c.title }),
        h("small", { text: `ended ${new Date(c.closesAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} \xB7 ${c.entries}` })
      ))) : null;
      if (cs.drop) setTimeout(() => document.addEventListener("click", function off(ev) {
        if (!ev.target.closest(".wz-gl-cdropwrap")) {
          cs.drop = false;
          ctx.render();
        }
        document.removeEventListener("click", off, true);
      }, true), 0);
      return h(
        "div",
        { class: "wz-gl-cnav" },
        cur ? h(
          "button",
          { type: "button", class: `wz-gl-cnow${cs.pick === cur.id ? " on" : ""}`, title: "The contest running now", onclick: () => pick(cur.id) },
          h("span", { text: `\u2605 ${cur.title}` }),
          h("small", { text: cur.status === "open" ? `Open \xB7 closes ${inTime(cur.closesAt)}` : "Judging" })
        ) : h("span", { class: "lbl", text: "No contest running right now." }),
        h("span", { class: "wz-gl-grow" }),
        archived.length ? h("span", { class: "lbl", text: "Past:" }) : null,
        recent.map((c) => h("button", { type: "button", class: `wz-gl-carch${cs.pick === c.id ? " on" : ""}`, text: c.title, title: `${c.title} (ended ${when(c.closesAt)})`, onclick: () => pick(c.id) })),
        archived.length ? h(
          "span",
          { class: "wz-gl-cdropwrap" },
          h("button", { type: "button", class: `wz-gl-carch${cs.drop || cs.pick && !recent.some((c) => c.id === cs.pick) && archived.some((c) => c.id === cs.pick) ? " on" : ""}`, text: `Archive \u25BE`, title: `All ${archived.length} past contests`, onclick: () => {
            cs.drop = !cs.drop;
            ctx.render();
          } }),
          drop
        ) : null,
        h("button", { type: "button", class: "wz-gl-refresh", title: "Load the latest", text: "\u21BB", onclick: () => {
          refresh(true);
          ctx.refreshMe(true);
        } })
      );
    }
    let pagers = [];
    const pageState = (key) => cs.pages[key] || (cs.pages[key] = { page: 0 });
    function paged(items, key, empty) {
      const g = pagedGrid(items, { state: pageState(key), wheelPages: () => ctx.wheelPages(), onPage: ctx.hideHover, empty });
      pagers.push(g);
      return g;
    }
    function layout() {
      pagers.forEach((g) => g.layout());
    }
    function view() {
      pagers = [];
      const list = shownList();
      if (!list) return h("p", { class: "wz-gl-note", text: cs.error ? `Couldn't load the contests: ${cs.error}` : "Loading the contests\u2026" });
      if (!list.length) {
        return h(
          "div",
          { class: "wz-gl-cv" },
          h("p", { class: "wz-gl-note", text: "No contests yet." }),
          h("p", { class: "wz-gl-note", text: "Contests have a theme and a deadline. Enter your designs; the organizers judge them, and the results are kept here." })
        );
      }
      const cur = shownActive();
      const archived = list.filter((c2) => c2.status === "archived").sort((a, b) => b.closesAt - a.closesAt);
      if (!cs.pick || !list.some((c2) => c2.id === cs.pick)) cs.pick = cur ? cur.id : archived[0].id;
      const c = list.find((x) => x.id === cs.pick);
      const body = c.status === "archived" ? archiveView(c) : runningView(c);
      return h("div", { class: "wz-gl-cv wz-gl-cvp" }, nav2(cur, archived), body);
    }
    function enterButton(c, s, big) {
      const label = !ctx.acct.account ? "Link your account to enter" : s && !s.left ? "No entries left" : "Enter cards";
      const b = button(label, () => ctx.startEntry(c.id), { primary: true, cls: big ? "wz-gl-big" : "", title: "Pick cards in Submit and upload them to this contest" });
      b.disabled = !ctx.acct.account || !s || !s.left;
      return b;
    }
    const pips = (s) => s ? h("span", { class: "wz-gl-pips", title: `${s.used} of ${s.max} entries used` }, Array.from({ length: s.max }, (_, i) => h("i", { class: i < s.used ? "on" : "" })), h("span", { text: ` ${s.used} of ${s.max} used` })) : null;
    const deadline = (c) => c.status === "open" ? ["Entries close ", h("b", { text: when(c.closesAt) }), ` (${inTime(c.closesAt)}). Up to ${c.maxEntries} per player; a set counts as one.`] : ["Entries closed ", h("b", { text: when(c.closesAt) }), ". The organizers are judging; results show here when they're done."];
    function ownItems(c) {
      const open = c.status === "open";
      return ownEntries(c).map((e) => {
        const tagText = e.status === "approved" ? "entered" : e.status === "pending" ? "awaiting approval" : "not approved";
        const tag = h("span", { class: `wz-gl-mine${e.status === "pending" ? " pending" : e.status === "rejected" || e.status === "removed" ? " rejected" : ""}`, text: tagText });
        const run2 = ctx.deleteMine;
        const canWithdraw = open && (e.status === "pending" || e.status === "approved");
        const del = canWithdraw ? removeButton({ rerender: ctx.render }, e, { label: "Withdraw", confirm: "Withdraw it?", title: "Take this entry back, to free its slot", run: run2 }) : e.status === "rejected" || e.status === "removed" ? removeButton({ rerender: ctx.render }, e, { label: "Delete", confirm: "Delete for good?", title: "Delete this entry: it wasn't approved", run: run2 }) : null;
        return entryItem(e, { below: [tag, del] });
      });
    }
    function othersOf(c) {
      const own = ownEntries(c);
      const f = shownFile(c.id);
      return (f ? f.entries : []).filter((e) => !own.some((o) => o.id === e.id));
    }
    const noneYet = (c) => h("p", { class: "wz-gl-note", text: c.entries ? "They'll show here in a few minutes." : "None yet. Be the first!" });
    const noVotes = h("p", { class: "wz-gl-note", text: "There's no voting on contest entries: the organizers judge them. They join the gallery once the results are out." });
    function mainPart({ heading, extra, items, key, empty, note }) {
      const g = paged(items, key, empty);
      return h(
        "div",
        { class: "wz-gl-cmain" },
        h("div", { class: "wz-gl-csec" }, heading, extra || null),
        g.area,
        h("div", { class: "wz-gl-foot" }, h("span", { class: "note", text: note || "" }), h("span", { class: "grow" }), g.pager)
      );
    }
    const sideInfo = (c, more) => h(
      "div",
      { class: "side" },
      h("div", { class: "t" }, c.title),
      c.rules ? h("div", { class: "r", text: c.rules }) : null,
      more
    );
    function runningView(c) {
      const s = shownSlots(c);
      const open = c.status === "open";
      const mine = ownItems(c);
      const others = othersOf(c).map((e) => entryItem(e));
      const items = mine.concat(others);
      const main2 = mainPart({
        heading: "Entries",
        extra: h("span", { class: "n", text: `${c.entries}${mine.length ? ` \xB7 ${mine.length} yours` : ""}` }),
        items,
        key: `${c.id}:run`,
        empty: c.entries ? "* They'll show here in a few minutes." : "* None yet. Be the first!",
        note: "No voting: the organizers judge entries. They join the gallery with the results."
      });
      const side = sideInfo(c, [
        h("div", { class: "m" }, deadline(c)),
        open ? [h("div", { style: { marginTop: "10px" } }, h("span", { text: "Your entries: " }), pips(s)), enterButton(c, s, true)] : null,
        mine.length ? h("div", { class: "wz-gl-cmine" }, h("b", { text: "Your entries" }), ownEntries(c).map((e) => h("div", {}, h("span", { text: e.title || "(no name)" }), h("span", { class: "dim", text: e.status === "approved" ? "entered" : e.status === "pending" ? "waiting" : "not approved" })))) : null
      ]);
      return h("div", { class: "wz-gl-cvbody wz-gl-cside" }, side, main2);
    }
    function archiveView(c) {
      const f = shownFile(c.id);
      const ended = `Ended ${when(c.closesAt)}`;
      if (!f) return h("div", { class: "wz-gl-chero" }, h("div", { class: "t", text: c.title }), h("div", { class: "m", text: `${ended}. Loading the results\u2026` }));
      if (!f.entries.length) return h("div", { class: "wz-gl-chero" }, h("div", { class: "t", text: c.title }), h("div", { class: "m", text: `${ended} \xB7 no entries.` }));
      const { res, list: rank } = ranked(f);
      const how = res.manualTop ? "The organizers picked the top places; the rest are by average score (1 to 5)." : "Places are by average score (1 to 5).";
      const sortBtns = h(
        "span",
        { class: "wz-gl-csort" },
        button("Ranking", () => {
          cs.sort = "rank";
          pageState(`${c.id}:rank`).page = 0;
          ctx.render();
        }, { primary: cs.sort !== "new" }),
        button("Newest", () => {
          cs.sort = "new";
          pageState(`${c.id}:new`).page = 0;
          ctx.render();
        }, { primary: cs.sort === "new" })
      );
      const card = (e) => {
        const i = rank.indexOf(e);
        return entryItem(e, { place: placeTag(i), below: avgTag(res.scores[e.id]), cls: i < 3 && cs.sort !== "new" ? `p${i + 1}` : "" });
      };
      const pageList = cs.sort === "new" ? rank.slice().sort((a, b) => (b.postedAt || 0) - (a.postedAt || 0)) : rank;
      const main2 = mainPart({
        heading: "Entries",
        extra: [h("span", { class: "n", text: String(f.entries.length) }), h("span", { class: "wz-gl-grow" }), sortBtns],
        items: pageList.map(card),
        key: `${c.id}:${cs.sort}`,
        empty: "* No entries.",
        note: how
      });
      const side = sideInfo(c, [
        h("div", { class: "m", text: `${ended} \xB7 ${plural(f.entries.length)}.` }),
        h("div", { class: "wz-gl-podlist" }, rank.slice(0, 3).map((e, i) => h("div", {}, placeTag(i), h("b", { text: e.title || "(no name)" }), h("span", { class: "dim", text: `by ${e.author} \xB7 ${(res.scores[e.id] || {}).avg != null ? res.scores[e.id].avg.toFixed(2) : "\u2013"}` }))))
      ]);
      return h("div", { class: "wz-gl-cvbody wz-gl-cside" }, side, main2);
    }
    const judgeContestId = () => {
      const who = ctx.who();
      if (who && who.role === "judge") return who.contest || active() && active().id;
      const c = active();
      return c ? c.id : null;
    };
    async function loadJudging(force) {
      const id = judgeContestId();
      if (!id || !ctx.reviewerKey()) {
        js.data = null;
        return;
      }
      if (js.loading || !force && js.id === id && js.at && Date.now() - js.at < 3e4) return;
      js.loading = true;
      try {
        const d = await reviewContest(ctx.reviewerKey(), id);
        d.entries = (d.entries || []).filter((e) => e && /^[0-9a-z]{3,8}$/.test(e.id)).map(withArt);
        js.data = d;
        js.id = id;
        js.top = (js.data.contest.top3 || []).slice();
        js.error = "";
        js.at = Date.now();
      } catch (e) {
        if (e.code === "not_admin" || e.code === "key_expired") return ctx.keyRejected(e.code);
        js.error = ctx.errText(e);
      } finally {
        js.loading = false;
        ctx.changed();
      }
    }
    const unscored = () => js.data ? js.data.entries.filter((e) => !js.data.myScores[e.id]).length : 0;
    async function score(e, n) {
      const mine = js.data.myScores[e.id] || 0;
      const value = mine === n ? 0 : n;
      try {
        await reviewScore(ctx.reviewerKey(), js.id, e.id, value);
        if (value) js.data.myScores[e.id] = value;
        else delete js.data.myScores[e.id];
        ctx.changed();
      } catch (err) {
        ctx.say(`Couldn't save the score: ${ctx.errText(err)}`);
      }
      ctx.render();
    }
    async function saveTop(list) {
      try {
        await manageContest(ctx.reviewerKey(), { action: "top3", id: js.id, posts: list });
        js.top = list.slice();
        js.data.contest.top3 = list.slice();
        ctx.say(list.length ? "Top places saved." : "Top places cleared: places come from the scores.");
      } catch (err) {
        ctx.say(`Couldn't save the top places: ${ctx.errText(err)}`);
      }
      ctx.render();
    }
    const SCORES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const SCORE_NAMES = { 1: "Extremely poor", 1.5: "Very poor", 2: "Poor", 2.5: "Neutral", 3: "OK for the game", 3.5: "Decent", 4: "Good", 4.5: "Very good", 5: "Extremely good" };
    function judgingView() {
      const id = judgeContestId();
      if (!id) return h("p", { class: "wz-gl-note", text: "No contest is running." });
      if (js.error) return h("div", { class: "wz-gl-issues", text: js.error });
      if (!js.data || js.id !== id) {
        loadJudging(true);
        return h("p", { class: "wz-gl-note", text: "Loading the entries\u2026" });
      }
      const d = js.data, c = d.contest;
      const owner = ctx.who() && ctx.who().role === "owner";
      const scores = d.scores;
      const n = d.entries.length;
      const done = n - unscored();
      const headBar = h(
        "div",
        { class: "wz-gl-bar" },
        h("b", { text: `Judging: ${c.title}` }),
        h("span", { class: "dim", text: c.status === "open" ? ` \xB7 entries close ${when(c.closesAt)}` : " \xB7 entries closed" }),
        h("span", { class: "wz-gl-grow" }),
        h("span", { text: `You've scored ${done} of ${n}` }),
        button("\u21BB Refresh", () => loadJudging(true))
      );
      const notes = [h("p", { class: "wz-gl-note", text: "Score each entry 1 (extremely poor) to 5 (extremely good), in half points: 2.5 is neutral, 3 means it would be OK in the game. Click your score again to take it back. Other judges' scores stay hidden." })];
      if (owner && scores) notes.push(h("p", { class: "wz-gl-note", text: "The deadline has passed, so you see everyone's scores. Places go by average score, unless you pick the top 3 below. Publish the results in Contests." }));
      let topBar = null;
      if (owner && scores) {
        const changedTop = JSON.stringify(js.top) !== JSON.stringify(c.top3 || []);
        topBar = h(
          "div",
          { class: "wz-gl-bar" },
          h("span", { text: js.top.length ? `Top places by hand: ${js.top.map((pid, i) => `${PLACES[i]} #${pid}`).join(", ")}` : "Top places: by score" }),
          button("Save top places", () => saveTop(js.top.filter(Boolean)), { primary: changedTop }),
          js.top.length ? button("Use scores instead", () => saveTop([])) : null
        );
      }
      const extra = (e) => {
        const parts = [];
        if (scores) {
          const s = scores[e.id];
          parts.push(h("span", { class: "wz-gl-avg", text: s ? `avg ${s.avg.toFixed(2)} \xB7 ${s.n} judge${s.n === 1 ? "" : "s"}` : "no scores yet" }));
          if (s && s.by) parts.push(h("span", { class: "by", text: s.by.map((b) => `${b.name} ${b.score}`).join(", ") }));
          if (owner) {
            const at = js.top.indexOf(e.id);
            parts.push(h("select", { title: "Place it by hand", onchange: (ev) => {
              const want = Number(ev.target.value);
              js.top = js.top.filter((x) => x !== e.id);
              if (want) {
                js.top.splice(want - 1, 0, e.id);
                js.top = js.top.slice(0, 3);
              }
              ctx.render();
            } }, h("option", { value: "0", text: "place: by score", selected: at < 0 }), PLACES.map((p, i) => h("option", { value: String(i + 1), text: p, selected: at === i }))));
          }
        }
        return parts;
      };
      if (!n) return h("div", {}, headBar, notes, h("p", { class: "wz-gl-note", text: "No approved entries yet. Approve them in Uploads." }));
      const sorted = scores ? d.entries.slice().sort((a, b) => ((scores[b.id] || {}).avg || 0) - ((scores[a.id] || {}).avg || 0)) : d.entries;
      const items = sorted.map((e) => {
        const mine = d.myScores[e.id] || 0;
        const btns = h(
          "div",
          { class: "wz-gl-scores", title: "Your score" },
          SCORES.map((k) => h("button", { type: "button", class: `wz-gl-scorebtn${mine === k ? " on" : ""}${k % 1 ? " half" : ""}`, text: String(k), title: `${k}: ${SCORE_NAMES[k]}`, onclick: () => score(e, k) }))
        );
        return entryItem({ ...e, status: "approved" }, { below: h("div", { class: "wz-gl-judge" }, btns, extra(e)) });
      });
      return h("div", {}, headBar, notes, topBar, h("div", { class: "wz-gl-grid" }, items));
    }
    async function run(body, ok) {
      cf.busy = true;
      ctx.render();
      try {
        const r = await manageContest(ctx.reviewerKey(), body);
        ctx.say(ok(r));
        js.at = 0;
        await refresh(true);
      } catch (e) {
        ctx.say(ctx.errText(e));
      }
      cf.busy = false;
      ctx.render();
    }
    function form(c) {
      if (c && cf.editFor !== c.id) Object.assign(cf, { editFor: c.id, title: c.title, rules: c.rules || "", closes: toLocalInput(c.closesAt), max: c.maxEntries });
      if (!c && cf.editFor) Object.assign(cf, { editFor: null, title: "", rules: "", closes: "", max: 3 });
      const input = (key, props) => h("input", { ...props, value: String(cf[key]), oninput: (e) => {
        cf[key] = e.target.value;
      } });
      return h(
        "div",
        { class: "wz-gl-form" },
        h("label", { text: "Title" }),
        input("title", { type: "text", maxLength: 60, placeholder: "e.g. Heart of the Underground" }),
        h("label", { text: "Theme and rules" }),
        h("textarea", { maxLength: 1500, placeholder: "What to make, and any rules", text: cf.rules, oninput: (e) => {
          cf.rules = e.target.value;
        } }),
        h("label", { text: "Deadline" }),
        input("closes", { type: "datetime-local" }),
        h("label", { text: "Entries per player" }),
        input("max", { type: "number", min: 1, max: 10, step: 1, style: { width: "60px" } })
      );
    }
    const fields = () => {
      const closesAt = fromLocalInput(cf.closes);
      return { title: cf.title.trim(), rules: cf.rules.trim(), closesAt, maxEntries: Math.round(Number(cf.max)) };
    };
    function manageView() {
      if (!cs.list) return h("p", { class: "wz-gl-note", text: "Loading the contests\u2026" });
      const cur = active();
      const out = [];
      if (cur) {
        const save = button(cf.busy ? "Saving\u2026" : "Save changes", () => {
          const f = fields();
          if (!f.title || !f.closesAt) return ctx.say("Fill in a title and a deadline.");
          run({ action: "edit", id: cur.id, ...f }, () => "Contest updated.");
        }, { primary: true });
        save.disabled = cf.busy;
        const publish = removeButton({ rerender: ctx.render }, cur, { label: "Publish results", confirm: "Publish? This is final.", title: "Archive the contest: places are frozen, entries join the gallery, judge keys stop working", run: () => run({ action: "archive", id: cur.id }, () => `Results of "${cur.title}" published.`) });
        publish.disabled = cur.status === "open";
        if (cur.status === "open") publish.title = "Available once the deadline has passed";
        out.push(h(
          "div",
          { class: "wz-gl-cbox" },
          h("div", { class: "wz-gl-bar" }, h("b", { text: `Running: ${cur.title}` }), h("span", { class: "dim", text: ` \xB7 ${cur.status === "open" ? `entries close ${when(cur.closesAt)} (${inTime(cur.closesAt)})` : "judging"} \xB7 ${cur.entries} approved entr${cur.entries === 1 ? "y" : "ies"}` })),
          form(cur),
          h(
            "div",
            { class: "wz-gl-bar" },
            save,
            publish,
            h("span", { class: "wz-gl-grow" }),
            removeButton({ rerender: ctx.render }, cur, { label: "Delete contest", confirm: "Delete it and its entries?", title: "For mistakes and tests: removes the contest and everything entered in it", run: () => run({ action: "delete", id: cur.id }, () => "Contest deleted.") })
          ),
          h("p", { class: "wz-gl-note", text: "Judge keys (in Reviewers) work for this contest until you publish the results. Score entries in Judging." })
        ));
      } else {
        const start = button(cf.busy ? "Starting\u2026" : "Start contest", () => {
          const f = fields();
          if (!f.title || !f.closesAt) return ctx.say("Fill in a title and a deadline.");
          if (f.closesAt <= Date.now()) return ctx.say("The deadline must be in the future.");
          run({ action: "create", ...f }, (r) => `Started "${r.contest.title}".`);
        }, { primary: true });
        start.disabled = cf.busy;
        out.push(h("div", { class: "wz-gl-cbox" }, h("b", { text: "Start a contest" }), form(null), h("div", { class: "wz-gl-bar" }, start)));
      }
      const past = cs.list.filter((c) => c.status === "archived");
      if (past.length) {
        out.push(h("div", { class: "wz-gl-csub", text: "Past contests" }), h("div", { class: "wz-gl-revlog" }, past.map((c) => h(
          "div",
          { class: "wz-gl-bar" },
          h("b", { text: c.title }),
          h("span", { class: "dim", text: `ended ${when(c.closesAt)} \xB7 ${c.entries} entr${c.entries === 1 ? "y" : "ies"}` }),
          h("span", { class: "wz-gl-grow" }),
          removeButton({ rerender: ctx.render }, c, { label: "Delete", confirm: "Delete it and its entries?", title: "Remove this contest from the archive, with its entries", run: () => run({ action: "delete", id: c.id }, () => "Contest deleted.") })
        ))));
      }
      return h("div", {}, out);
    }
    return { state: cs, refresh, active, shownActive, slots, view, layout, judgingView, manageView, loadJudging, unscored, judgeContestId };
  }

  // ../wz/packages/card-maker/gallery/keybox.js
  var REVIEW_KEY = "wizascript.cardMaker.galleryReview";
  var REVIEW_WHO = "wizascript.cardMaker.galleryReviewWho";
  var ROLE_NAMES = { owner: "owner", reviewer: "reviewer", judge: "judge" };
  var reviewerKey = () => {
    try {
      return String(GM_getValue(REVIEW_KEY, "") || "");
    } catch (e) {
      return "";
    }
  };
  var reviewerWho = () => {
    try {
      return JSON.parse(GM_getValue(REVIEW_WHO, "null"));
    } catch (e) {
      return null;
    }
  };
  var keyLabel = () => {
    const who = reviewerKey() && reviewerWho();
    return who ? `Key: ${who.name} (${ROLE_NAMES[who.role] || "reviewer"})` : "Redeem Key";
  };
  setGalleryKeyBridge({ get: () => reviewerKey(), put: (k) => redeemKey(k) });
  var listeners3 = [];
  var onKeyChange = (fn) => {
    listeners3.push(fn);
  };
  var changed2 = () => listeners3.slice().forEach((f) => {
    try {
      f();
    } catch (e) {
    }
  });
  function forgetKey() {
    if (!reviewerKey()) return false;
    GM_deleteValue(REVIEW_KEY);
    GM_deleteValue(REVIEW_WHO);
    changed2();
    return true;
  }
  async function redeemKey(raw) {
    const k = typeof raw === "string" ? raw.trim() : "";
    if (!k) throw new Error("Enter the key you were given.");
    let me;
    try {
      me = await reviewWhoami(k);
    } catch (e) {
      throw new Error(e && e.code === "not_admin" ? "That key isn't valid." : e && e.code === "key_expired" ? "That key has expired." : e && e.code === "rate_limited" ? "Too many wrong keys. Try again in an hour." : e && e.message || "Couldn't check the key.");
    }
    GM_setValue(REVIEW_KEY, k);
    GM_setValue(REVIEW_WHO, JSON.stringify({ name: me.name, role: me.role }));
    changed2();
    return me;
  }
  function recheckKey(onGone) {
    const k = reviewerKey();
    if (!k) return;
    reviewWhoami(k).then((me) => {
      const who = JSON.stringify({ name: me.name, role: me.role });
      if (GM_getValue(REVIEW_WHO, "") === who) return;
      GM_setValue(REVIEW_WHO, who);
      changed2();
    }, (e) => {
      if (e && (e.code === "key_expired" || e.code === "not_admin") && forgetKey()) {
        onGone(e.code === "key_expired" ? "Your gallery key has expired, so it was removed." : "Your gallery key was revoked, so it was removed.");
      }
    });
  }
  function keyBox({ reviewWhere = "in the title bar" } = {}) {
    const wrap = h("div", { class: "wz-key-box" });
    const status = h("p", { class: "wz-key-status" });
    const show = (text, ok) => {
      status.textContent = text;
      status.style.color = ok ? "#7f7" : "#f77";
    };
    function draw2() {
      wrap.replaceChildren();
      const who = reviewerKey() && reviewerWho();
      const input = h("input", { type: "password", placeholder: "Key", autocomplete: "off", spellcheck: false });
      let busy = false;
      const submit = async () => {
        if (busy) return;
        busy = true;
        go2.disabled = true;
        show("Checking\u2026", true);
        try {
          if (isDeviceCode(input.value)) throw new Error("That's a device code: use the \u{1F4F1} button next to this one.");
          const me = await redeemKey(input.value);
          draw2();
          show(me.role === "judge" ? `Redeemed. You're judging as ${me.name}: press Review ${reviewWhere}.` : `Redeemed. You're reviewing as ${me.name}.`, true);
        } catch (e) {
          show(e.message, false);
        }
        busy = false;
        go2.disabled = false;
      };
      const go2 = button("Redeem", submit, { primary: true });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
      if (who) {
        wrap.append(
          h("p", {}, "Active key: ", h("b", { text: who.name }), ` (${ROLE_NAMES[who.role] || "reviewer"}).`),
          h("p", { class: "dim", text: `Review is ${reviewWhere}.` }),
          h("p", {}, button("Remove key", () => {
            forgetKey();
            draw2();
            show("Key removed.", true);
          }, { cls: "wz-key-danger" }))
        );
      } else {
        wrap.append(h("p", { text: "Enter a key you were given to review gallery uploads or judge a contest." }));
      }
      wrap.append(h("div", { class: "wz-key-row" }, input, go2), status);
      if (!who) setTimeout(() => input.focus(), 50);
    }
    draw2();
    return wrap;
  }
  var DEVICE_TITLE = "Link a Mobile Account";
  var fmtLeft = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1e3));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  function deviceBox({ notLinked = "Link your account first (Link my account), then make the code here." } = {}) {
    const wrap = h("div", { class: "wz-key-box wz-dev-box" });
    let timer = null;
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const back = () => button("Back", () => {
      stop();
      choose();
    });
    let carry = true;
    function choose() {
      const acct = linkedAccount();
      const who = reviewerKey() && reviewerWho();
      const box = who ? h(
        "label",
        { class: "wz-dev-carry" },
        h("input", { type: "checkbox", checked: carry, onchange: (e) => {
          carry = e.target.checked;
        } }),
        ` Bring my gallery key (${who.name}, ${ROLE_NAMES[who.role] || "reviewer"}) too`
      ) : null;
      wrap.replaceChildren(
        h("p", { text: "Use the Card Gallery on your phone or another computer with the same Undercards account." }),
        h(
          "div",
          { class: "wz-dev-choices" },
          button("Generate a code", generate, { primary: true, title: "On a device where your account is linked" }),
          button("Redeem a code", redeem, { title: "On the new device" })
        ),
        box,
        h("p", { class: "dim", text: acct ? `This device is linked as ${acct}.` : "This device isn't linked yet." })
      );
    }
    async function generate() {
      stop();
      if (!linkedAccount()) {
        wrap.replaceChildren(h("p", { class: "wz-key-status", style: "color:#f77", text: `This device isn't linked. ${notLinked}` }), h("p", {}, back()));
        return;
      }
      wrap.replaceChildren(h("p", { text: "Making a code\u2026" }));
      let r;
      try {
        r = await linkShare(carry);
      } catch (e) {
        wrap.replaceChildren(h("p", { class: "wz-key-status", style: "color:#f77", text: e && e.message || "Couldn't reach the Wizascript server." }), h("p", {}, back()));
        return;
      }
      if (!wrap.isConnected) return;
      const code = h("div", { class: "wz-dev-code", text: r.code, title: "Select to copy" });
      const left = h("span", { class: "dim" });
      const tick = () => {
        if (!wrap.isConnected) return stop();
        const ms = r.expiresAt - Date.now();
        if (ms <= 0) {
          stop();
          left.textContent = "Expired. Make a new one.";
          code.style.opacity = ".35";
          return;
        }
        left.textContent = `Expires in ${fmtLeft(ms)}. Works once.`;
      };
      timer = setInterval(tick, 1e3);
      tick();
      wrap.replaceChildren(
        h("p", { text: `A code for ${linkedAccount() || r.account}:` }),
        code,
        h("p", {}, left),
        r.carries ? h("p", { text: `It also brings your gallery key (${r.carries.name}, ${ROLE_NAMES[r.carries.role] || r.carries.role}). Keep the code to yourself.` }) : null,
        r.keyDropped ? h("p", { class: "wz-key-status", style: "color:#f77", text: "Your gallery key isn't valid anymore, so the code doesn't bring it." }) : null,
        h("p", { class: "dim", text: "On the other device, open the Card Gallery (the website, or Card Maker in Wizascript), press \u{1F4F1}, then Redeem a code." }),
        h("div", { class: "wz-key-row" }, back(), button("New code", generate))
      );
    }
    function redeem() {
      stop();
      const acct = linkedAccount();
      const input = h("input", { type: "text", placeholder: "WZL-XXXX-XXXX", autocomplete: "off", spellcheck: false, class: "wz-dev-input" });
      const status = h("p", { class: "wz-key-status" });
      const show = (text, ok) => {
        status.textContent = text;
        status.style.color = ok ? "#7f7" : "#f77";
      };
      let busy = false;
      const submit = async () => {
        if (busy) return;
        if (!isDeviceCode(input.value)) {
          show("Codes look like WZL-XXXX-XXXX.", false);
          return;
        }
        busy = true;
        go2.disabled = true;
        show("Checking\u2026", true);
        try {
          const r = await redeemDeviceCode(input.value);
          input.value = "";
          show(`Linked as ${r.account}.${r.key ? ` Your gallery key came too (${r.key.name}, ${ROLE_NAMES[r.key.role] || r.key.role}).` : ""}`, true);
        } catch (e) {
          show(e.message, false);
        }
        busy = false;
        go2.disabled = false;
      };
      const go2 = button("Redeem", submit, { primary: true });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
      wrap.replaceChildren(
        h("p", { text: "Enter the code from a device where your account is linked (\u{1F4F1} \u2192 Generate a code there)." }),
        ...acct ? [h("p", { class: "dim", text: `This device is linked as ${acct}; a code switches it to the code's account.` })] : [],
        h("div", { class: "wz-key-row" }, input, go2),
        status,
        h("p", {}, back())
      );
      setTimeout(() => input.focus(), 50);
    }
    choose();
    return wrap;
  }
  var KEYBOX_CSS = `
.wz-key-btn { position: absolute; left: 8px; bottom: 8px; z-index: 30; width: 30px; height: 30px; border-radius: 15px; padding: 0;
  background: #000; color: #bbb; border: 1px solid #666; font-size: 16px; line-height: 28px; cursor: pointer; opacity: .55; }
.wz-key-btn:hover, .wz-key-btn:focus-visible { opacity: 1; color: #fff; border-color: #fff; }
.wz-key-btn.on { color: #ffd84a; border-color: #ffd84a; opacity: .9; }
.wz-key-back { position: absolute; inset: 0; z-index: 40; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; padding: 16px; }
.wz-key-dialog { width: min(440px, 100%); background: #0d0d0d; border: 2px solid #fff; border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,.8); font-size: 14px; color: #fff; }
.wz-key-dhead { padding: 10px 14px; border-bottom: 1px solid #444; font-size: 18px; }
.wz-key-dialog > .wz-key-box { padding: 12px 14px; }
.wz-key-dfoot { display: flex; justify-content: flex-end; padding: 8px 14px; border-top: 1px solid #444; }
.wz-key-box p { margin: 0 0 10px; }
.wz-key-box .dim { color: #aaa; font-size: 13px; }
.wz-key-row { display: flex; gap: 6px; }
.wz-key-row input { flex: 1; min-width: 0; height: 28px; background: #222; color: #fff; border: 1px solid #666; border-radius: 3px; padding: 0 8px; font: 14px Arial, sans-serif; }
.wz-key-row input:focus { border-color: #8ea6e8; outline: none; }
.wz-key-box .wz-cm-btn, .wz-key-dfoot .wz-cm-btn { height: 28px; padding: 0 14px; }
.wz-key-status { min-height: 1.2em; margin-top: 8px !important; }
.wz-cm-btn.wz-key-danger { background: #6b2f2f; border-color: #bf6f6f; }
.wz-key-btn.wz-dev-btn { left: 44px; font-size: 15px; }
.wz-dev-choices { display: flex; gap: 8px; margin: 0 0 10px; }
.wz-key-box .wz-dev-choices .wz-cm-btn { flex: 1; height: 40px; font-size: 15px; }
.wz-dev-code { font: 24px "DTM-Mono", "DTM Mono", monospace; letter-spacing: 2px; text-align: center; padding: 8px; margin: 0 0 8px; background: #000; border: 1px solid #666; user-select: all; }
.wz-key-row input.wz-dev-input { text-transform: uppercase; }
.wz-dev-carry { display: block; margin: 0 0 10px; font-size: 13px; cursor: pointer; }
`;

  // ../wz/packages/card-maker/gallery/panel.js
  var STYLE_ID = "wizascript-cardgallery-style";
  var TYPES = ["Monster", "Spell", "Enchantment", "Artifact"];
  var COLORS = ["#e6b422", "#4aa3df", "#e05a5a", "#5cc46a", "#b07de0", "#e08a3c", "#3cc8c0", "#d65ca8"];
  var TYPE_COLOR = { Monster: "#f0003c", Spell: "#41fcff", Enchantment: "#fca500", Artifact: "gold" };
  var SOURCE_LABEL = { feildmaster: "feildmaster's editor", sernon: "UC Editor", picture: "picture" };
  var SIZES = [["small", "Small", 0.75, "Small cards"], ["medium", "Medium", 1, "Full-size cards"], ["large", "Large", 0, "Zoom cards to fill the width"]];
  var GAP = 10;
  var CSS = `
.wz-gl-panel { --wz-gl-z: .6; position: absolute; inset: 0; z-index: 7; overflow: auto; background: #0d0d0d; padding: 10px; display: none; user-select: text; font: 12px Arial, sans-serif; color: #fff; }
.wz-gl-panel.on { display: block; }
.wz-gl-panel.on.browse { display: flex; flex-direction: column; overflow: hidden; }
.wz-gl-panel.browse > .wz-gl-content { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.wz-gl-panel.browse > .wz-gl-content > .wz-gl-browse { flex: 1 1 auto; height: auto; }
.wz-gl-panel.browse > .wz-gl-content > .wz-gl-cv { flex: 1 1 auto; min-height: 0; }
.wz-gl-preview-as { background: #3a1f5a; border: 1px solid #b07de0; color: #e6d4ff; padding: 1px 4px 1px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; }
.wz-gl-tokenwarn { border: 2px solid #e07a7a; background: #241010; padding: 8px 12px; margin: 0 0 12px; font-size: 14px; }
.wz-gl-viewas { margin: 0; font-weight: normal; display: flex; align-items: center; gap: 6px; }
.wz-gl-viewas select { height: 22px !important; flex: 1; }
/* Review: roomy, with a side menu (dev16) */
.wz-gl-rv { font-size: 14px; line-height: 1.45; }
.wz-gl-rv .wz-cm-btn { height: 28px; font-size: 13px; padding: 0 12px; }
.wz-gl-rv .wz-gl-note { font-size: 13px; }
.wz-gl-rv input[type="text"], .wz-gl-rv select { height: 28px !important; font-size: 13px !important; }
.wz-gl-rv .wz-gl-revpost { padding: 12px 14px; border-width: 2px; }
.wz-gl-rv .wz-gl-revmeta { font-size: 15px; margin-bottom: 10px; }
.wz-gl-rv .wz-gl-revactions .wz-cm-btn { height: 34px; padding: 0 22px; font-size: 14px; }
.wz-gl-rv .wz-gl-revlog { gap: 8px; font-size: 14px; }
.wz-gl-rv .wz-gl-scorebtn { width: 26px; height: 24px; font-size: 13px; }
.wz-gl-rside { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 18px; align-items: start; }
.wz-gl-rmenu { position: sticky; top: 0; display: flex; flex-direction: column; border: 2px solid #fff; background: #000; }
.wz-gl-rmenu button { display: flex; justify-content: space-between; align-items: center; background: none; border: 0; color: #bbb; padding: 10px 12px; text-align: left; font: 15px "DTM-Mono", "DTM Mono", "WZ DTM Mono", monospace; cursor: pointer; }
.wz-gl-rmenu button + button { border-top: 1px solid #333; }
.wz-gl-rmenu button:hover { color: #fff; background: #151515; }
.wz-gl-rmenu button.on { background: #ffd84a; color: #000; }
.wz-gl-rmenu .n { background: #e05a5a; color: #fff; border-radius: 9px; padding: 0 6px; font: 11px/16px Arial, sans-serif; }
.wz-gl-rmenu .who { padding: 10px 12px; border-top: 2px solid #fff; font-size: 12px; opacity: .8; }
/* phones (the gallery website): the Review menu goes on top as a row of buttons */
@media (max-width: 640px) {
  .wz-gl-rside { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .wz-gl-rmenu { position: static; flex-direction: row; flex-wrap: wrap; }
  .wz-gl-rmenu button { flex: 1 1 auto; padding: 8px 10px; font-size: 14px; }
  .wz-gl-rmenu button + button { border-top: 0; border-left: 1px solid #333; }
  .wz-gl-rmenu .who { width: 100%; }
}
.wz-gl-ctag { display: inline-block; background: #3a2f0a; border: 1px solid #ffd84a; color: #ffd84a; font-size: 10px; padding: 0 4px; margin-left: 6px; }
.wz-gl-target { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 8px; }
.wz-gl-tabs { flex: none; }
.wz-gl-part:has(.wz-gl-wide) { width: calc(355px * var(--wz-gl-z) + 14px); }
.wz-gl-toggle.on, .wz-cm-btn.wz-gl-on { background: #4464bd; border-color: #8ea6e8; }
.wz-cm-btn.wz-gl-primary { background: #2f6b3a; border-color: #6fbf7e; }
.wz-cm-btn:disabled { opacity: .4; cursor: default; }
.wz-gl-panel input[type="text"], .wz-gl-panel select { color: #fff !important; background: #222 !important; border: 1px solid #666 !important; border-radius: 3px; font: 11px Arial, sans-serif; height: 22px; padding: 0 4px; box-shadow: none; }
.wz-gl-panel input[type="text"]::placeholder { color: #999; opacity: 1; }
.wz-gl-panel input[type="text"]:focus, .wz-gl-panel select:focus { border-color: #8ea6e8 !important; outline: none; }
.wz-gl-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
.wz-gl-tabs { border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 10px; }
.wz-gl-status { opacity: .85; margin-left: 6px; }
.wz-gl-sizes { display: inline-flex; gap: 2px; align-items: center; }
.wz-gl-sizes .wz-cm-btn { min-width: 0; padding: 0 6px; }
.wz-gl-note { opacity: .7; margin: 0 0 8px; }
.wz-gl-grow { flex: 1 1 auto; }
.wz-gl-picker { border: 1px solid #444; background: #151515; padding: 6px 8px; margin: 8px 0; }
.wz-gl-picker label { cursor: pointer; font-weight: normal; }
.wz-gl-pgroup { margin: 5px 0; }
.wz-gl-pparts { display: flex; flex-wrap: wrap; gap: 2px 14px; margin: 2px 0 0 18px; }
.wz-gl-pparts .done { opacity: .5; }
.wz-gl-type { font-size: 10px; text-transform: uppercase; }
.wz-gl-sets { margin: 4px 0; }
.wz-gl-set { display: inline-flex; align-items: center; gap: 4px; margin: 2px 8px 2px 0; padding: 2px 6px; border-left: 6px solid; }
.wz-gl-tray { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.wz-gl-part { width: calc(176px * var(--wz-gl-z) + 14px); border: 2px solid #444; padding: 4px; position: relative; background: #111; }
.wz-gl-part.sel { border-color: #fff; background: #223; }
.wz-gl-part input, .wz-gl-part select { width: 100%; margin-bottom: 2px; }
.wz-gl-zoom { zoom: var(--wz-gl-z); cursor: pointer; margin: 0 auto 4px; width: max-content; }
.wz-gl-badge { position: absolute; top: -8px; left: -8px; width: 22px; height: 22px; border-radius: 11px; color: #000; font-weight: bold; text-align: center; line-height: 22px; z-index: 9; }
.wz-gl-x { position: absolute; top: 2px; right: 2px; z-index: 9; min-width: 0 !important; padding: 0 5px !important; height: 18px !important; line-height: 16px !important; }
.wz-gl-from { display: block; opacity: .55; font-size: 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.wz-gl-preview { white-space: pre-wrap; max-height: 260px; overflow: auto; background: #151515 !important; color: #ddd !important; border: 1px solid #444 !important; border-radius: 3px; padding: 6px; margin-top: 10px; font: 12px monospace; }
.wz-gl-acct { display: inline-flex; align-items: center; gap: 4px; margin-right: 6px; white-space: nowrap; }
.wz-gl-acct b { color: #ffd84a; }
.wz-gl-acct-err { color: #ffb4b4; }
.wz-gl-panel .dim { opacity: .7; }
.wz-cm-btn.wz-gl-small { height: 18px; line-height: 16px; padding: 0 5px; font-size: 10px; }
.wz-gl-link { margin: 0 0 10px; padding: 8px 10px; border: 2px solid #ffd84a; background: #17150c; }
.wz-gl-link ol { margin: 6px 0; padding-left: 20px; }
.wz-gl-link li { margin: 4px 0; }
.wz-gl-line { background: #000 !important; color: #fff !important; border: 1px solid #666; padding: 1px 6px; font: 13px monospace; user-select: all; }
.wz-gl-revposts { display: flex; flex-direction: column; gap: 12px; }
.wz-gl-revpost { border: 1px solid #444; background: #111; padding: 8px; }
.wz-gl-revmeta { margin-bottom: 6px; }
.wz-gl-revpost .wz-gl-item { align-items: flex-start; display: inline-flex; }
.wz-gl-revactions { margin: 8px 0 0; }
.wz-gl-revactions input { flex: 1 1 240px; }
.wz-gl-hreason { color: #ffb4b4; }
.wz-gl-done.failed { border-color: #e07a7a; background: #241010; }
.wz-gl-upload { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; padding: 8px 10px; border: 2px solid #2f6b3a; background: #0f1a11; }
.wz-gl-upload.open { display: block; }
.wz-gl-revlist { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; max-height: 360px; overflow: auto; }
.wz-gl-rev { border: 1px solid #444; background: #111; padding: 4px 6px; }
.wz-gl-revtabs { margin-bottom: 8px; }
.wz-gl-ctx { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #444; font-size: 13px; }
.wz-gl-ctxhead { display: block; background: none; border: 0; color: #ddd; cursor: pointer; font: 13px Arial, sans-serif; padding: 0; text-align: left; }
.wz-gl-ctxhead:hover b { text-decoration: underline; }
.wz-gl-ctxsame { color: #ffb44a; font-weight: bold; }
.wz-gl-ctxlist { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.wz-gl-ctxitem { border: 1px solid #333; background: #0b0b0b; padding: 6px; max-width: 100%; }
.wz-gl-ctxitem.same { border-color: #ffb44a; }
.wz-gl-ctxitem.gone .wz-gl-revcards { opacity: .75; }
.wz-gl-ctxmeta { font-size: 12px; margin-bottom: 4px; }
.wz-gl-loglist .undone { opacity: .55; }
.wz-gl-loglist .wz-gl-remove { margin-left: 8px; }
.wz-gl-guide { margin: 0 0 10px; padding: 8px 12px; border: 2px solid #4aa3df; background: #0c1620; font-size: 13px; line-height: 1.45; max-width: 980px; }
.wz-gl-guide ul { margin: 4px 0 0; padding-left: 20px; }
.wz-gl-guide li { margin: 3px 0; }
.wz-gl-guide .head { display: flex; align-items: center; gap: 8px; }
.wz-gl-revlog { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.wz-gl-newkey { margin: 8px 0; display: flex; flex-direction: column; gap: 6px; border-color: #ff0; }
.wz-gl-key { flex: 1; min-width: 0; font-family: monospace; }
.wz-gl-revhead { margin-bottom: 3px; }
.wz-gl-revcards { display: flex; gap: 3px; --wz-gl-z: .45; }
.wz-gl-revcards .wz-gl-zoom { margin: 0; cursor: default; }
.wz-gl-issues { color: #ffb4b4; margin: 4px 0; }
.wz-gl-revfoot { margin: 6px 0 0; }
.wz-gl-by { opacity: .8; }
.wz-gl-done { margin: 8px 0; padding: 8px 10px; border: 2px solid #6fbf7e; background: #102414; }
.wz-gl-done ul { margin: 4px 0 6px 18px; padding: 0; }
.wz-gl-grid { display: flex; flex-wrap: wrap; gap: 12px 10px; align-items: flex-end; }
.wz-gl-item { max-width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.wz-gl-item.set { padding: 3px 4px 2px; border: 1px solid #444; border-radius: 4px; background: #141414; }
.wz-gl-setname { font-size: 11px; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.wz-gl-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; align-items: flex-end; }
.wz-gl-row > .wz-gl-zoom { margin: 0; cursor: default; }
.wz-gl-votes { display: flex; gap: 4px; align-items: center; }
.wz-gl-votes .wz-cm-btn { height: 18px; min-width: 20px; padding: 0 4px; font-size: 10px; line-height: 16px; }
.wz-gl-score { display: inline-block; min-width: 24px; text-align: center; font-weight: bold; }
.wz-gl-hover { position: fixed; z-index: 50; pointer-events: none; background: #000; border: 2px solid #fff; border-radius: 4px; padding: 6px; display: none; box-shadow: 0 6px 24px rgba(0,0,0,.8); color: #fff; font: 12px Arial, sans-serif; }
.wz-gl-hover.on { display: block; }
.wz-gl-hcard { zoom: 1.1; }
.wz-gl-hinfo { margin-top: 5px; line-height: 1.45; max-width: 200px; }
.wz-gl-hinfo b { font-size: 13px; }
.wz-gl-hinfo .dim { opacity: .7; }
${TILE_CSS}
${BROWSE_CSS}
${CONTEST_CSS}
${KEYBOX_CSS}
${NOTES_CSS}
`;
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  var setColor = (set) => COLORS[(set.letter.charCodeAt(0) - 65) % COLORS.length];
  var sameCard = (p, source, group, raw) => p.source === source && p.editorGroup === group && p.name === (raw.name || "") && p.type === raw.type;
  var privacyLine = (text) => h(
    "div",
    { class: "dim wz-gl-privacy", style: { margin: "4px 0 0", fontSize: "12px" } },
    text + " ",
    h("a", { href: PRIVACY_URL, target: "_blank", rel: "noopener", text: "Privacy" })
  );
  function buildGalleryPanel({ requestRead, editorLabel, wheelPages, reviewerKey: reviewerKey2 = () => "", onKeyRejected = () => {
  }, linkSteps: linkSteps2 = null, watchLink = false, submitNote = null }) {
    injectStyle();
    const draft2 = getDraft();
    let tab = draft2.parts.length ? "browse" : "submit";
    let open = false;
    if (draft2.browseProto) {
      delete draft2.browseProto;
      saveDraft();
    }
    const browse = { list: "new", page: 0, dir: null, mineOnly: false, likedOnly: false };
    if (draft2.proto) {
      delete draft2.proto;
      saveDraft();
    }
    draft2.gone = Object.fromEntries(Object.entries(draft2.gone || {}).filter(([, at]) => Date.now() - at < 30 * 6e4));
    let viewAs = "";
    const listeners4 = [];
    const notify = () => listeners4.forEach((f) => f());
    let browseCtl = null;
    let read = null;
    let readTimer = null;
    let reviewing = false;
    let lastUpload = null;
    let uploading = false;
    let submitTo = null;
    const acct = { loaded: false, loading: false, account: null, cooldownUntil: null, votes: {}, posts: [], contest: null, error: "", at: 0 };
    let linking = null;
    const gal = { approved: [], totals: {}, base: {}, at: 0, loading: false, error: "" };
    const voteQueue = createVoteQueue({
      onSent(part) {
        Object.entries(part).forEach(([id, v]) => {
          if (v) acct.votes[id] = v;
          else delete acct.votes[id];
        });
      },
      onError(e) {
        say(`Your votes couldn't be sent yet (${e.message}). They'll be tried again.`);
      }
    });
    const author = () => acct.account || "";
    const blankRev = () => ({
      list: [],
      posts: {},
      at: 0,
      loading: false,
      error: "",
      busy: {},
      reasons: {},
      who: null,
      section: "uploads",
      log: null,
      logOnly: "",
      reviewers: null,
      pause: null,
      pauseNote: "",
      pausing: false,
      newKey: null,
      newName: "",
      newRole: "reviewer",
      adding: false,
      sectionError: "",
      ctx: {},
      ctxOpen: {}
    });
    let rev = blankRev();
    const realRole = () => rev.who ? rev.who.role : null;
    const role = () => realRole() === "owner" && viewAs ? viewAs : realRole();
    const isOwner = () => role() === "owner";
    const isJudge = () => role() === "judge";
    async function refreshReview(force) {
      const key = reviewerKey2();
      if (!key || rev.loading || !force && rev.at && Date.now() - rev.at < 3e4) return;
      rev.loading = true;
      try {
        if (!rev.who) rev.who = await reviewWhoami(key);
        if (force) rev.ctx = {};
        if (realRole() === "judge") {
          rev.at = Date.now();
          rev.error = "";
          contests.loadJudging(force);
          return;
        }
        contests.refresh();
        notes.refreshStaff(force);
        if (realRole() === "owner" && !rev.health) rev.health = await getHealth().catch(() => null);
        const r = await reviewPending(key);
        rev.list = r && r.posts || [];
        rev.error = "";
        rev.at = Date.now();
        for (const p of rev.list) {
          if (!rev.posts[p.id]) rev.posts[p.id] = await reviewPost(key, p.id).catch(() => null);
        }
      } catch (e) {
        if (e.code === "not_admin" || e.code === "key_expired") {
          rev.loading = false;
          onKeyRejected(e.code);
          return;
        }
        rev.error = errText(e);
      } finally {
        rev.loading = false;
        notify();
        if (open && tab === "review") render();
      }
    }
    async function decide(id, approve) {
      rev.busy[id] = approve ? "Approving\u2026" : "Rejecting\u2026";
      render();
      try {
        await reviewDecide(reviewerKey2(), id, approve, rev.reasons[id]);
        rev.list = rev.list.filter((p) => p.id !== id);
        delete rev.posts[id];
        say(approve ? `Approved ${id}. It's in the gallery now.` : rev.reasons[id] ? `Rejected ${id}. The reason went to them as a note (Review \u2192 Notes).` : `Rejected ${id}.`);
        notes.refreshStaff(true);
        if (approve) gal.at = 0;
      } catch (e) {
        say(`Couldn't ${approve ? "approve" : "reject"} ${id}: ${errText(e)}`);
      }
      delete rev.busy[id];
      notify();
      render();
    }
    const uploadList = () => rev.list;
    const uploadPost = (p) => rev.posts[p.id];
    function uploadsView() {
      const list = uploadList();
      const head = h(
        "div",
        { class: "wz-gl-bar" },
        h("b", { text: rev.loading && !rev.at ? "Loading uploads\u2026" : `${list.length} upload${list.length === 1 ? "" : "s"} waiting` }),
        h("span", { class: "wz-gl-grow" }),
        button("\u21BB Refresh", () => refreshReview(true), { title: "Look for new uploads" })
      );
      if (rev.error) return h("div", {}, head, h("div", { class: "wz-gl-issues", text: rev.error }));
      if (!list.length && rev.at) return h("div", {}, head, h("p", { class: "wz-gl-note", text: "Nothing to review. New uploads appear here." }));
      const one = (p) => {
        const post = uploadPost(p);
        const reason = h("input", { type: "text", placeholder: "Reason (optional; sent to them as a note they can answer)", maxLength: 300, value: rev.reasons[p.id] || "", oninput: (e) => {
          rev.reasons[p.id] = e.target.value;
        } });
        const approveBtn = button(rev.busy[p.id] || "Approve", () => decide(p.id, true), { primary: true, title: p.contest ? "Accept it into the contest" : "Add it to the gallery (one commit on the gallery branch)" });
        const rejectBtn = button("Reject", () => decide(p.id, false), { title: "Don't add it; the author sees it as not approved" });
        approveBtn.disabled = rejectBtn.disabled = !!rev.busy[p.id] || !post;
        return h(
          "div",
          { class: "wz-gl-revpost" },
          h(
            "div",
            { class: "wz-gl-revmeta" },
            h("b", { text: p.title || "(no name)" }),
            p.contest ? h("span", { class: "wz-gl-ctag", text: `Contest: ${p.contestTitle || p.contest}`, title: "Entered in this contest: check it follows the theme and rules" }) : null,
            h("span", { class: "dim", text: ` ${p.kind === "set" ? `set of ${post ? post.parts.length : "?"}` : post ? post.parts[0].type : ""} \xB7 by ` }),
            h("b", { text: p.author }),
            h("span", { class: "dim", text: ` \xB7 ${new Date(p.postedAt).toLocaleString()} \xB7 #${p.id}` })
          ),
          post ? h(
            "div",
            { class: `wz-gl-item${p.kind === "set" ? " set" : ""}` },
            p.kind === "set" ? h("div", { class: "wz-gl-sethead" }, h("div", { class: "wz-gl-setname", text: post.title })) : null,
            h("div", { class: "wz-gl-row" }, post.parts.map((c) => hoverable(h("div", { class: "wz-gl-zoom" }, tile(c)), c, null)))
          ) : h("p", { class: "wz-gl-note", text: "Loading its cards\u2026" }),
          h(
            "div",
            { class: "wz-gl-bar wz-gl-revactions" },
            approveBtn,
            rejectBtn,
            reason,
            button("Note\u2026", () => noteOn({ id: p.id, title: p.title }), { title: "Ask the author something before deciding (they can answer)" })
          ),
          contextBox(p, post)
        );
      };
      const note = h("p", { class: "wz-gl-note", text: "Each upload is shown exactly as it will look in Browse. Approving adds it to the gallery for everyone (contest entries: to the contest)." });
      return h("div", {}, head, note, h("div", { class: "wz-gl-revposts" }, list.map(one)));
    }
    const CTX_LABEL = { approved: "in the gallery", pending: "waiting", rejected: "rejected", removed: "taken down" };
    const CTX_WAS = { approved: "it was in the gallery", pending: "it was waiting", rejected: "it was rejected", removed: "it was taken down" };
    const daysAgo2 = (t) => t ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : 0;
    const nameKey = (x) => String(x || "").trim().toLowerCase();
    function loadContext(id) {
      if (rev.ctx[id]) return;
      rev.ctx[id] = { loading: true };
      reviewContext(reviewerKey2(), id).then((d) => {
        rev.ctx[id] = { data: d || { posts: [] } };
      }, (e) => {
        rev.ctx[id] = { error: errText(e) };
      }).then(() => {
        if (open && tab === "review") render();
      });
    }
    function contextBox(p, post) {
      loadContext(p.id);
      const c = rev.ctx[p.id];
      if (!c || c.loading) return h("div", { class: "wz-gl-ctx dim", text: "Looking for their other posts\u2026" });
      if (c.error) return h("div", { class: "wz-gl-ctx wz-gl-issues", text: `Their other posts couldn't be loaded: ${c.error}` });
      const d = c.data;
      const list = d.posts || [];
      const where = d.contest ? `in ${d.contest.title || "this contest"}` : "in the gallery";
      const alts = d.accounts && d.accounts.length > 1 ? ` Accounts: ${d.accounts.join(", ")}.` : "";
      if (!list.length) return h("div", { class: "wz-gl-ctx dim", text: `No other posts ${where}.${alts}` });
      const names = new Set([nameKey(p.title), ...(post && post.parts || []).map((x) => nameKey(x.name))].filter(Boolean));
      const same = (o) => names.has(nameKey(o.title)) || (o.parts || []).some((x) => names.has(nameKey(x.name)));
      const nSame = list.filter(same).length;
      const counts = {};
      list.forEach((o) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k === "deleted" ? "deleted" : CTX_LABEL[k] || k}`).join(", ");
      const isOpen = rev.ctxOpen[p.id] !== void 0 ? rev.ctxOpen[p.id] : nSame > 0;
      const head = h(
        "button",
        { type: "button", class: "wz-gl-ctxhead", title: "Everything this player (and any alt that shared their install) has posted here", onclick: () => {
          rev.ctxOpen[p.id] = !isOpen;
          render();
        } },
        h("b", { text: `${isOpen ? "\u25BE" : "\u25B8"} Their other posts ${where}: ${list.length}` }),
        nSame ? h("span", { class: "wz-gl-ctxsame", text: ` \xB7 ${nSame} with a matching name` }) : null,
        h("span", { class: "dim", text: ` (${summary}).${alts}` })
      );
      if (!isOpen) return h("div", { class: "wz-gl-ctx" }, head);
      const items = list.map((o) => {
        const shown = o.status === "approved" && o.parts ? withArt(o) : o;
        const label = o.status === "deleted" ? `deleted by them (${CTX_WAS[o.deletedFrom] || "earlier"})` : CTX_LABEL[o.status] || o.status;
        const info = { author: o.author, days: daysAgo2(o.postedAt), status: o.status === "rejected" ? "rejected" : "approved", reason: o.reason };
        return h(
          "div",
          { class: `wz-gl-ctxitem${same(o) ? " same" : ""}${o.status === "approved" ? "" : " gone"}` },
          h(
            "div",
            { class: "wz-gl-ctxmeta" },
            h("b", { text: o.title || "(no name)" }),
            h("span", { class: "dim", text: ` \xB7 ${label}${o.reason ? `: ${o.reason}` : ""} \xB7 #${o.id}${o.author !== d.author ? ` \xB7 ${o.author}` : ""}` })
          ),
          shown.parts ? h("div", { class: "wz-gl-revcards" }, shown.parts.map((x) => hoverable(h("div", { class: "wz-gl-zoom" }, tile(x)), x, info))) : h("div", { class: "dim", text: "Its cards weren't kept." })
        );
      });
      return h("div", { class: "wz-gl-ctx open" }, head, h("div", { class: "wz-gl-ctxlist" }, items));
    }
    function reviewView() {
      if (!reviewerKey2()) return h("p", { class: "wz-gl-note", text: "Review is off." });
      const running = contests.active();
      const nUp = uploadList().length, nJudge = contests.unscored();
      const judging = ["judging", "Judging", nJudge];
      const sections = isJudge() ? [judging] : [["uploads", "Uploads", nUp]];
      if (!isJudge()) {
        if (running) sections.push(judging);
        if (staffNotes()) sections.push(["notes", "Notes", notes.staffUnread()]);
        sections.push(["log", "Log", 0]);
      }
      if (isOwner()) sections.push(["contests", "Contests", 0], ["reviewers", "Reviewers", 0], ["switches", "Kill switches", 0]);
      if (!sections.some(([k]) => k === rev.section)) {
        rev.section = sections[0][0];
        if (rev.section === "judging") contests.loadJudging(true);
      }
      const who = rev.who ? `${isJudge() ? "Judging" : "Reviewing"} as ${rev.who.name}${realRole() === "owner" ? " (owner)" : ""}${viewAs ? `, previewing ${viewAs}` : ""}` : "";
      const body = rev.section === "notes" ? notes.staffView() : rev.section === "log" ? logView() : rev.section === "reviewers" ? reviewersView() : rev.section === "switches" ? switchesView() : rev.section === "judging" ? contests.judgingView() : rev.section === "contests" ? contests.manageView() : uploadsView();
      const count = (n) => n ? h("span", { class: "n", text: String(n) }) : null;
      const menu = h(
        "div",
        { class: "wz-gl-rmenu wz-gl-revtabs" },
        sections.map(([k, label, n]) => h("button", { type: "button", class: rev.section === k ? "on" : "", onclick: () => openSection(k) }, h("span", { text: label }), count(n))),
        h("div", { class: "who wz-gl-rwho", text: who }),
        realRole() === "owner" ? h("div", { class: "who" }, viewAsControl()) : null
      );
      return h("div", { class: "wz-gl-rv" }, h("div", { class: "wz-gl-rside" }, menu, h("div", {}, tokenWarning(), body)));
    }
    function tokenWarning() {
      const d = realRole() === "owner" && rev.health ? rev.health.tokenDaysLeft : null;
      if (d === null || d === void 0 || d >= 30) return null;
      const when2 = rev.health.tokenExpires ? ` (${new Date(rev.health.tokenExpires.replace(" UTC", "Z").replace(" ", "T")).toLocaleDateString()})` : "";
      return h("div", { class: "wz-gl-issues wz-gl-tokenwarn" }, d <= 0 ? `The gallery server's GitHub key has run out${when2}. Approvals and contest results can't be published until you make a new one: see "Once a year" in the Worker's README.` : `The gallery server's GitHub key runs out in ${d} day${d === 1 ? "" : "s"}${when2}. Make a new one before then: see "Once a year" in the Worker's README.`);
    }
    function openSection(k) {
      rev.section = k;
      rev.sectionError = "";
      if (k !== "reviewers") rev.newKey = null;
      if (k === "log") loadLog();
      if (k === "notes") {
        notes.reset();
        notes.refreshStaff(true);
      }
      if (k === "reviewers") {
        loadReviewers();
        contests.refresh();
      }
      if (k === "switches") loadPause();
      if (k === "judging") contests.loadJudging(true);
      if (k === "contests") contests.refresh(true);
      render();
    }
    const ago2 = (t) => {
      if (!t) return "never";
      const m = Math.max(0, Math.round((Date.now() - t) / 6e4));
      return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
    };
    async function loadLog() {
      try {
        rev.log = (await reviewLog(reviewerKey2(), realRole() === "owner" ? rev.logOnly : "")).log;
        rev.sectionError = "";
      } catch (e) {
        rev.sectionError = errText(e);
      }
      if (open && tab === "review") render();
    }
    async function undoEntry(l) {
      try {
        const r = await reviewUndo(reviewerKey2(), l.n);
        say(l.action === "score" ? `Undid ${l.who}'s score on "${l.title || ""}".` : `Undid "${l.title || ""}" (${ACTIONS[l.action] || l.action} by ${l.who}). It's ${r && r.status === "approved" ? "back in the gallery" : "waiting for review again"}.`);
        if (l.post) delete draft2.gone[l.post];
        gal.at = 0;
        if (l.action === "score") contests.loadJudging(true);
        else {
          refreshReview(true);
          contests.refresh(true);
        }
      } catch (err) {
        say(`Couldn't undo it: ${errText(err)}`);
      }
      loadLog();
    }
    async function loadReviewers() {
      try {
        rev.reviewers = (await reviewersList(reviewerKey2())).reviewers;
        rev.sectionError = "";
      } catch (e) {
        rev.sectionError = errText(e);
      }
      if (open && tab === "review") render();
    }
    const ACTIONS = {
      approve: "approved",
      reject: "rejected",
      remove: "removed",
      add_reviewer: "added reviewer",
      add_judge: "added judge",
      revoke_reviewer: "revoked key of",
      contest_create: "started contest",
      contest_edit: "edited contest",
      contest_archive: "published the results of",
      contest_delete: "deleted contest",
      undo: "undid",
      undo_score: "undid a score on",
      score: "scored",
      note_open: "started a note on",
      note_close: "closed the note on",
      pause: "set"
    };
    function logLine(l) {
      const canUndo = realRole() === "owner" && !viewAs && l.undo && l.undo.ok;
      const what = l.action === "score" && !l.detail ? "cleared their score on" : ACTIONS[l.action] || l.action;
      return h(
        "div",
        { class: l.undoneAt ? "undone" : "" },
        h("b", { text: l.who }),
        ` ${what} `,
        l.post ? h("span", { text: `"${l.title || ""}" #${l.post}` }) : h("b", { text: l.detail || "" }),
        l.action === "score" && l.detail ? [" ", h("b", { text: l.detail })] : null,
        l.action === "score" && l.prev ? h("span", { class: "dim", text: ` (was ${l.prev})` }) : null,
        l.post && l.detail && l.action !== "score" && !/^note_/.test(l.action) ? h("span", { class: "dim", text: ` (${l.detail})` }) : null,
        /^note_/.test(l.action) && l.detail && staffNotes() ? [" ", h("button", { type: "button", class: "wz-nt-btn", text: "View", title: "Read this note", onclick: () => {
          rev.section = "notes";
          notes.openThread(l.detail, "staff");
        } })] : null,
        l.post && !/^note_/.test(l.action) && staffNotes() ? [" ", h("button", { type: "button", class: "wz-nt-btn", text: "\u2709", title: "Start a note with the post's author", onclick: () => noteOn({ id: l.post, title: l.title }) })] : null,
        h("span", { class: "dim", text: ` \xB7 ${ago2(l.at)}` }),
        l.undoneAt ? h("span", { class: "dim", text: ` \xB7 undone by ${l.undoneBy || "the owner"}` }) : null,
        canUndo ? removeButton({ rerender: render }, l, { label: "Undo", confirm: "Undo it?", title: l.action === "approve" ? "Take it out of the gallery and put it back in Uploads" : l.action === "reject" ? "Put it back in Uploads" : l.action === "remove" ? "Put it back where it was" : "Give back the judge's score before this", run: undoEntry }) : null
      );
    }
    function logView() {
      const owner = realRole() === "owner" && !viewAs;
      const pick = (k) => {
        rev.logOnly = k;
        rev.log = null;
        render();
        loadLog();
      };
      const filters = owner ? h("span", { class: "wz-gl-sizes" }, [["", "All"], ["decisions", "Decisions"], ["scores", "Judge scores"]].map(([k, label]) => button(label, () => pick(k), { cls: (rev.logOnly || "") === k ? "wz-gl-on" : "", title: k === "scores" ? "Every score judges gave (only you see these)" : "" }))) : null;
      const head = h("div", { class: "wz-gl-bar" }, h("b", { text: "Recent review actions" }), filters, h("span", { class: "wz-gl-grow" }), button("\u21BB Refresh", loadLog));
      const note = owner ? h("p", { class: "wz-gl-note", text: "You can undo approvals, rejections, removals and judge scores: only the latest one for each post, and not after its author deleted it." }) : null;
      if (rev.sectionError) return h("div", {}, head, h("div", { class: "wz-gl-issues", text: rev.sectionError }));
      if (!rev.log) return h("div", {}, head, h("p", { class: "wz-gl-note", text: "Loading\u2026" }));
      if (!rev.log.length) return h("div", {}, head, h("p", { class: "wz-gl-note", text: "Nothing yet." }));
      return h("div", {}, head, note, h("div", { class: "wz-gl-revlog wz-gl-loglist" }, rev.log.map(logLine)));
    }
    async function addReviewer() {
      const name = rev.newName.trim();
      if (!name) return say("Type the reviewer's name first.");
      rev.adding = true;
      render();
      try {
        const judge = rev.newRole === "judge" && contests.active();
        const r = judge ? await reviewerAddJudge(reviewerKey2(), name) : await reviewerAdd(reviewerKey2(), name);
        rev.newKey = { name: r.name, key: r.key, role: r.role };
        rev.newName = "";
        await loadReviewers();
      } catch (e) {
        say(`Couldn't add ${name}: ${errText(e)}`);
      }
      rev.adding = false;
      render();
    }
    async function revokeReviewer(r) {
      try {
        await reviewerRevoke(reviewerKey2(), r.id);
        say(`Revoked ${r.name}'s key. It stops working now.`);
        await loadReviewers();
      } catch (e) {
        say(`Couldn't revoke ${r.name}: ${errText(e)}`);
        render();
      }
    }
    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => false);
      return Promise.resolve(false);
    }
    function reviewersView() {
      const nameBox = h("input", { type: "text", placeholder: "Their name", maxLength: 30, value: rev.newName, oninput: (e) => {
        rev.newName = e.target.value;
      }, onkeydown: (e) => {
        if (e.key === "Enter") addReviewer();
      } });
      const running = contests.active();
      if (!running) rev.newRole = "reviewer";
      const judge = rev.newRole === "judge";
      const addBtn = button(rev.adding ? "Adding\u2026" : judge ? "Add judge" : "Add reviewer", addReviewer, { primary: true, title: judge ? `Make a judge key for "${running.title}"` : "Make a new review key for them" });
      addBtn.disabled = rev.adding;
      const roleBtns = running ? [
        button("Reviewer", () => {
          rev.newRole = "reviewer";
          render();
        }, { cls: !judge ? "wz-gl-on" : "", title: "Reviews uploads and can remove posts. Can also score contests." }),
        button(`Judge: ${running.title}`, () => {
          rev.newRole = "judge";
          render();
        }, { cls: judge ? "wz-gl-on" : "", title: "Only scores this contest's entries; stops working when its results are published" })
      ] : null;
      const parts = [
        h("p", { class: "wz-gl-note", text: "Each person gets their own key. Reviewers approve, reject and remove posts, and score contests. Judges only score the running contest, and their key stops working when its results are published. Only your key can add or revoke keys." }),
        h("div", { class: "wz-gl-bar" }, roleBtns, nameBox, addBtn)
      ];
      if (rev.newKey) {
        const keyBox2 = h("input", { type: "text", readOnly: true, value: rev.newKey.key, class: "wz-gl-key", onfocus: (e) => e.target.select() });
        parts.push(h(
          "div",
          { class: "wz-gl-rev wz-gl-newkey" },
          h("div", {}, h("b", { text: `${rev.newKey.name}'s ${rev.newKey.role === "judge" ? "judge " : ""}key` }), h("span", { class: "dim", text: " (shown once: it isn't stored anywhere, so copy it now)" })),
          h(
            "div",
            { class: "wz-gl-bar" },
            keyBox2,
            button("Copy", () => copyText(rev.newKey.key).then((ok) => {
              if (ok) say("Copied.");
              else {
                keyBox2.focus();
                say("Press Ctrl+C to copy.");
              }
            })),
            button("Done", () => {
              rev.newKey = null;
              render();
            })
          ),
          h("div", { class: "dim", text: "Send it to them privately (a DM, not a channel). They enter it with the key button (\u26BF) at the bottom left of the gallery, in the Card Maker or on the gallery website." })
        ));
      }
      if (rev.sectionError) parts.push(h("div", { class: "wz-gl-issues", text: rev.sectionError }));
      else if (!rev.reviewers) parts.push(h("p", { class: "wz-gl-note", text: "Loading\u2026" }));
      else if (!rev.reviewers.length) parts.push(h("p", { class: "wz-gl-note", text: "No reviewers yet." }));
      else parts.push(h("div", { class: "wz-gl-revlog" }, rev.reviewers.map((r) => h(
        "div",
        { class: "wz-gl-bar" },
        h("b", { text: r.name }),
        h("span", { class: "dim", text: `${r.role === "judge" ? `judge${running && running.id === r.contest ? ` (${running.title})` : ""}` : "reviewer"} \xB7 added ${ago2(r.addedAt)} \xB7 last used ${ago2(r.lastUsedAt)}` }),
        h("span", { class: "wz-gl-grow" }),
        removeButton({ rerender: render }, r, { label: "Revoke", confirm: "Revoke?", title: `Stop ${r.name}'s key working`, run: revokeReviewer })
      ))));
      return h("div", {}, ...parts);
    }
    async function loadPause() {
      try {
        rev.pause = await pauseGet(reviewerKey2());
        rev.pauseNote = rev.pause.note || "";
        rev.sectionError = "";
      } catch (e) {
        rev.sectionError = errText(e);
      }
      if (open && tab === "review") render();
    }
    async function setPause(change) {
      if (rev.pausing) return;
      rev.pausing = true;
      render();
      try {
        rev.pause = await pauseSet(reviewerKey2(), { ...change, note: rev.pauseNote.trim() });
        say("Saved. Every player sees it within about 15 seconds.");
      } catch (e) {
        say(`Couldn't change it: ${errText(e)}`);
      }
      rev.pausing = false;
      render();
    }
    function switchesView() {
      if (rev.sectionError) return h("div", { class: "wz-gl-issues", text: rev.sectionError });
      if (!rev.pause) return h("p", { class: "wz-gl-note", text: "Loading\u2026" });
      const row = (k, label, what) => {
        const on = !!rev.pause[k];
        const armed = rev.pauseArmed === k;
        const b = button(rev.pausing ? "\u2026" : on ? `Turn ${label} back on` : armed ? `Tap again to pause ${label}` : `Pause ${label}`, () => {
          if (on) return setPause({ [k]: false });
          if (!armed) {
            rev.pauseArmed = k;
            render();
            setTimeout(() => {
              if (rev.pauseArmed === k) {
                rev.pauseArmed = null;
                render();
              }
            }, 3e3);
            return;
          }
          rev.pauseArmed = null;
          setPause({ [k]: true });
        }, { primary: on, title: what });
        if (!on) {
          b.style.background = armed ? "#c0392b" : "#6b1d1d";
          b.style.borderColor = "#e55";
          b.style.color = "#fff";
        }
        b.disabled = rev.pausing;
        Object.assign(b.style, { minHeight: "44px", height: "auto", width: "100%", maxWidth: "360px", fontSize: "15px", whiteSpace: "normal" });
        return h(
          "div",
          { class: "wz-gl-rev", style: { padding: "10px" } },
          h("div", {}, h("b", { text: label }), " ", h("span", { class: on ? "red" : "green", style: { color: on ? "#f77" : "#7f7" }, text: on ? "PAUSED" : "running" })),
          h("div", { class: "dim", text: what }),
          h("div", { style: { marginTop: "6px" } }, b)
        );
      };
      const note = h("input", { type: "text", maxLength: 200, value: rev.pauseNote, placeholder: "Optional message for players (e.g. Back tomorrow.)", style: { width: "100%", maxWidth: "420px" }, oninput: (e) => {
        rev.pauseNote = e.target.value;
      } });
      return h(
        "div",
        {},
        h("p", { class: "wz-gl-note", text: "Stop the server answering players, one area at a time. Your key keeps working, so you can switch it back from here. Browsing approved posts still works (they're on GitHub)." }),
        row("gallery", "Card Gallery", "Uploads, votes, totals, notes, contests, and review for every key but yours."),
        row("stats", "Usage Statistics", "Statistics, sending games, Profile and History extras. Games wait on players' devices; Download / Delete My Data still work."),
        h("div", { class: "wz-gl-bar", style: { marginTop: "8px" } }, note),
        h("p", { class: "dim", text: rev.pause.at ? `Last changed ${ago2(rev.pause.at)}${rev.pause.by ? ` by ${rev.pause.by}` : ""}. A flood of traffic needs Cloudflare's own switch (see the handbook).` : "A flood of traffic needs Cloudflare's own switch (see the handbook)." })
      );
    }
    async function deleteMine(e) {
      try {
        const r = await deleteOwnPost(e.id);
        const was = r && r.was || e.status;
        const wasEntry = acct.posts.some((p) => p.id === e.id && p.contest && (p.status === "pending" || p.status === "approved"));
        delete draft2.uploads[e.id];
        if (was === "approved") {
          draft2.gone[e.id] = Date.now();
          gal.approved = gal.approved.filter((p) => p.id !== e.id);
        }
        saveDraft();
        acct.posts = acct.posts.filter((p) => p.id !== e.id);
        say(wasEntry ? `Withdrew "${e.title}". Its slot is free again.` : was === "pending" ? `Cancelled "${e.title}".` : was === "approved" ? `Deleted "${e.title}" from the gallery.` : `Deleted "${e.title}".`);
        if (wasEntry) {
          refreshMe(true);
          contests.refresh(true);
        }
        render();
      } catch (err) {
        say(`Couldn't take it back: ${errText(err)}`);
        render();
      }
    }
    async function removePost(e) {
      try {
        await reviewRemove(reviewerKey2(), e.id);
        say(`Removed ${e.id} from the gallery.`);
        draft2.gone[e.id] = Date.now();
        saveDraft();
        gal.approved = gal.approved.filter((p) => p.id !== e.id);
        render();
        refreshGallery(true);
      } catch (err) {
        say(`Couldn't remove ${e.id}: ${errText(err)}`);
      }
    }
    const currentVotes = () => {
      const cur = { ...acct.votes };
      Object.entries(voteQueue.pending()).forEach(([id, v]) => {
        if (v) cur[id] = v;
        else delete cur[id];
      });
      return cur;
    };
    const errText = (e) => e instanceof ApiError ? e.message : "Something went wrong.";
    onAccountChange((name) => {
      if (name !== acct.account) {
        linking = null;
        refreshMe(true);
      }
    });
    const contests = createContests({
      say: (t) => say(t),
      render: () => render(),
      changed: () => {
        notify();
        if (open && (tab === "contest" || tab === "review" || tab === "submit")) render();
      },
      errText,
      hoverable: (el, p, e) => hoverable(el, p, e),
      acct,
      draft: draft2,
      reviewerKey: reviewerKey2,
      who: () => rev.who ? { ...rev.who, role: role() } : null,
      wheelPages: () => !wheelPages || wheelPages(),
      hideHover: () => hideHover(),
      keyRejected: (code) => onKeyRejected(code),
      refreshMe: (f) => refreshMe(f),
      deleteMine: (e) => deleteMine(e),
      startEntry(id) {
        submitTo = id;
        setView("submit");
        say("Add the cards to enter, then Review upload.");
      }
    });
    const notes = createNotes({
      reviewerKey: reviewerKey2,
      isStaff: () => !!reviewerKey2() && (realRole() === "owner" || realRole() === "reviewer"),
      say: (t) => say(t),
      render: () => {
        if (open) render();
      },
      errText,
      changed: () => {
        notify();
        if (open && (tab === "notes" || tab === "review" || tab === "browse")) render();
      }
    });
    const staffNotes = () => !!reviewerKey2() && !isJudge() && role() !== "player" && (realRole() === "owner" || realRole() === "reviewer");
    function noteOn(post) {
      tab = "review";
      rev.section = "notes";
      notes.startNote(post);
      setView("review");
    }
    async function refreshMe(force) {
      if (acct.loading || !force && acct.loaded && Date.now() - acct.at < 3e4) return;
      acct.loading = true;
      try {
        const me = await getMe();
        Object.assign(acct, { loaded: true, account: me.account || null, cooldownUntil: me.cooldownUntil || null, votes: me.votes || {}, posts: me.posts || [], contest: me.contest || null, error: "", at: Date.now() });
        accountChanged(acct.account, acct.cooldownUntil);
        if (acct.account) notes.refreshMine(force);
        pruneUploads(Object.fromEntries(acct.posts.map((p) => [p.id, p.status])), new Set(gal.approved.map((p) => p.id)));
      } catch (e) {
        acct.error = errText(e);
      } finally {
        acct.loading = false;
        if (open) render();
      }
    }
    async function refreshGallery(force) {
      if (gal.loading || !force && gal.at && Date.now() - gal.at < 6e4) return;
      gal.loading = true;
      if (open && tab === "browse") render();
      try {
        const [approved, totals] = await Promise.all([getIndex(), getTotals()]);
        gal.approved = approved;
        gal.totals = totals && totals.totals || {};
        gal.base = { ...acct.votes };
        gal.error = "";
        gal.at = Date.now();
      } catch (e) {
        gal.error = errText(e);
      } finally {
        gal.loading = false;
        if (open) render();
      }
    }
    let linkWatch = null;
    function stopWatch() {
      clearInterval(linkWatch);
      linkWatch = null;
    }
    async function startLink() {
      say("Getting a link code\u2026");
      try {
        linking = await linkStart();
        say("");
        if (watchLink) {
          stopWatch();
          const until = Math.min(Date.now() + 18e4, linking.expiresAt || Infinity);
          linkWatch = setInterval(() => {
            if (!linking || Date.now() > until) return stopWatch();
            checkLink(true);
          }, 5e3);
        }
      } catch (e) {
        say(errText(e));
      }
      render();
    }
    let checking3 = false;
    async function checkLink(quiet) {
      if (checking3) return;
      checking3 = true;
      if (!quiet) say("Looking for your line in void\u2026");
      try {
        const r = await linkCheck();
        if (r.linked) {
          linking = null;
          stopWatch();
          acct.account = r.account;
          acct.cooldownUntil = r.cooldownUntil || null;
          accountChanged(r.account, r.cooldownUntil, true);
          say(`Linked as ${r.account}.`);
          refreshMe(true);
          refreshGallery(true);
        } else if (!quiet) say(r.message || "Not seen yet. Send the line in void, then check again.");
        else {
          checking3 = false;
          return;
        }
      } catch (e) {
        if (e.code === "cooldown") {
          stopWatch();
          say(`This install switched accounts less than 24 hours ago. You can switch again ${new Date(e.extra.cooldownUntil).toLocaleString()}.`);
        } else if (e.code === "code_expired") {
          linking = null;
          stopWatch();
          say("That code expired. Press Link my account again.");
        } else if (!quiet) say(errText(e));
      }
      checking3 = false;
      render();
    }
    function accountBox() {
      if (acct.error && !acct.loaded) {
        return h("span", { class: "wz-gl-acct" }, h("span", { class: "wz-gl-acct-err", text: "Gallery server unreachable" }), " ", button("Retry", () => {
          acct.error = "";
          refreshMe(true);
        }));
      }
      if (!acct.loaded) return h("span", { class: "wz-gl-acct dim", text: "Checking your account\u2026" });
      if (acct.account) {
        return h(
          "span",
          { class: "wz-gl-acct", title: "Your posts and votes count as this Undercards account" },
          "Linked as ",
          h("b", { text: acct.account }),
          " ",
          linking ? null : button("Switch", () => startLink(), { title: "Link this install to a different Undercards account (once a day at most)", cls: "wz-gl-small" })
        );
      }
      return h("span", { class: "wz-gl-acct" }, linking ? h("span", { class: "dim", text: "Linking\u2026" }) : button("Link my account", () => startLink(), { primary: true, title: "Prove which Undercards account you are, once, to post and vote" }));
    }
    function linkBox() {
      if (!linking) return null;
      const mins = Math.max(0, Math.round((linking.expiresAt - Date.now()) / 6e4));
      const line = h("code", { class: "wz-gl-line", text: linking.line });
      const sendBtn = button("Open void with it typed in", () => {
        if (!openVoid(linking.line)) say("This page has no chat. Copy the line and send it in void from another page.");
      }, { primary: true, title: "Opens chat room 0 with the line filled in. You press Enter." });
      sendBtn.disabled = !canOpenVoid();
      const steps = linkSteps2 ? linkSteps2({ line: linking.line, say }) : [h(
        "li",
        {},
        "Send this line in void (chat room 0) from the account you want to post and vote as: ",
        line,
        " ",
        sendBtn,
        canOpenVoid() ? null : h("span", { class: "dim", text: " (no chat on this page: send it from another page)" })
      )];
      return h(
        "div",
        { class: "wz-gl-link" },
        h("b", { text: "Link your Undercards account" }),
        h(
          "ol",
          {},
          ...steps,
          h("li", {}, linkWatch ? "Then come back here: this page notices by itself, or press " : "Then: ", button("Check link", () => checkLink(), { primary: true }), h("span", { class: "dim", text: ` The code works for ${mins} more minute${mins === 1 ? "" : "s"}.` }))
        ),
        acct.account ? h("div", { class: "dim", text: `Switching from ${acct.account}: an install can switch accounts once a day, and accounts that share an install count as one voter.` }) : null,
        privacyLine("Linking keeps your account name, its Undercards id and this device on the Wizascript server."),
        button("Cancel", () => {
          linking = null;
          stopWatch();
          say("");
          render();
        }, { cls: "wz-gl-small" })
      );
    }
    const status = h("span", { class: "wz-gl-status" });
    const say = (t) => {
      status.textContent = t;
    };
    const tabs = h("div", { class: "wz-gl-bar wz-gl-tabs" });
    const content = h("div", { class: "wz-gl-content" });
    const hover = h("div", { class: "wz-gl-hover" });
    const panel = h("div", { class: "wz-gl-panel" }, tabs, content, hover);
    const fileInput = h("input", { type: "file", accept: ".uceditor,.json,application/json,image/png", multiple: true, style: { display: "none" } });
    panel.appendChild(fileInput);
    const sizeOf = () => SIZES.find((x) => x[0] === draft2.cardSize) || SIZES[1];
    function applyZoom() {
      let z = sizeOf()[2];
      if (!z) {
        const w = content.clientWidth || panel.clientWidth - 20;
        const pad2 = tab === "submit" ? 14 + 4 : 0;
        const cols = Math.max(1, Math.floor((w + GAP) / (176 + pad2 + GAP)));
        z = Math.max(0.5, Math.min(2.5, ((w + GAP) / cols - GAP - pad2) / 176));
      }
      z = Math.round(z * 100) / 100;
      if (panel.style.getPropertyValue("--wz-gl-z") === String(z)) return false;
      panel.style.setProperty("--wz-gl-z", String(z));
      return true;
    }
    let fitTimer = null, lastBox = "";
    new ResizeObserver(() => {
      if (!open) return;
      const box = panel.clientWidth + "x" + panel.clientHeight;
      if (box === lastBox) return;
      lastBox = box;
      const zoomed = !sizeOf()[2] && applyZoom();
      if (!zoomed && tab !== "browse" && tab !== "contest") return;
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => {
        if (tab === "browse" && browseCtl) browseCtl.layout();
        else if (tab === "contest") contests.layout();
        else refit();
      }, 120);
    }).observe(panel);
    function sizeButtons() {
      return h(
        "span",
        { class: "wz-gl-sizes", title: "Card size" },
        h("small", { text: "Size ", style: { opacity: ".7" } }),
        SIZES.map(([key, label, , title]) => button(label, () => {
          draft2.cardSize = key;
          browse.page = 0;
          saveDraft();
          render();
        }, { title, cls: sizeOf()[0] === key ? "wz-gl-on" : "" }))
      );
    }
    function refit() {
      content.querySelectorAll(".wz-gl-name, .wz-gl-text > div, .wz-gl-arttext").forEach((el) => {
        el.style.fontSize = "";
      });
      fitText(content);
    }
    let hoverFor = null;
    function showHover(anchor, p, e) {
      hoverFor = anchor;
      const info = e ? h(
        "div",
        { class: "wz-gl-hinfo" },
        h("span", { class: "dim", text: "By " }),
        h("b", { text: e.author || "you" }),
        h("br"),
        h("span", { class: "dim", text: (e.status === "pending" ? "Uploaded " : "Posted ") + (e.days ? `${e.days} day${e.days === 1 ? "" : "s"} ago` : "today") }),
        e.status === "pending" ? [h("br"), h("span", { class: "dim", text: "Awaiting approval" })] : null,
        e.status === "rejected" ? [h("br"), h("span", { class: "wz-gl-hreason", text: e.reason ? `Not approved: ${e.reason}` : "Not approved" })] : null
      ) : null;
      const card = h("div", { class: "wz-gl-hcard" }, tile(p));
      hover.replaceChildren(...[card, info].filter(Boolean));
      hover.classList.add("on");
      requestAnimationFrame(() => {
        if (hoverFor !== anchor) return;
        fitText(hover);
        const r = anchor.getBoundingClientRect(), box = panel.getBoundingClientRect(), hr = hover.getBoundingClientRect();
        let x = r.right + 8;
        if (x + hr.width > box.right - 4) x = r.left - hr.width - 8;
        if (x < box.left + 4) x = Math.max(box.left + 4, Math.min(box.right - hr.width - 4, r.left));
        const y = Math.max(box.top + 4, Math.min(box.bottom - hr.height - 4, r.top + r.height / 2 - hr.height / 2));
        hover.style.left = x + "px";
        hover.style.top = y + "px";
      });
    }
    function hideHover() {
      hoverFor = null;
      hover.classList.remove("on");
    }
    const hoverable = (el, p, e) => {
      el.addEventListener("mouseenter", () => showHover(el, p, e));
      el.addEventListener("mouseleave", () => {
        if (hoverFor === el) hideHover();
      });
      return el;
    };
    panel.addEventListener("scroll", hideHover, { passive: true });
    function setViewAs(v) {
      viewAs = v === "owner" ? "" : v;
      rev.section = "";
      notify();
      render();
    }
    function viewAsControl() {
      if (realRole() !== "owner") return null;
      return h(
        "label",
        { class: "wz-gl-viewas", title: "See the gallery as another role would. Only the screens change: the server still treats your key as the owner's." },
        "View as ",
        h(
          "select",
          { onchange: (e) => setViewAs(e.target.value) },
          [["owner", "Owner"], ["reviewer", "Reviewer"], ["judge", "Judge"], ["player", "Player"]].map(([v, l]) => h("option", { value: v, text: l, selected: (viewAs || "owner") === v }))
        )
      );
    }
    const viewAsBadge = () => viewAs ? h("span", { class: "wz-gl-preview-as" }, `Viewing as ${viewAs} `, button("Stop", () => setViewAs("owner"), { cls: "wz-gl-small", title: "Back to your own view" })) : null;
    function render() {
      hideHover();
      browseCtl = null;
      if (!open) return;
      if (tab === "review" && !(reviewerKey2() && role() !== "player")) {
        tab = "browse";
        notify();
      }
      tabs.replaceChildren(...[accountBox(), notesButton(), viewAsBadge(), status, h("span", { class: "wz-gl-grow" }), sizeButtons()].filter(Boolean));
      panel.classList.toggle("browse", tab === "browse" || tab === "contest");
      applyZoom();
      if (tab === "browse") {
        const ctl = browseCtl = browseTab();
        content.replaceChildren(...[linkBox(), ctl.el].filter(Boolean));
        ctl.layout();
        requestAnimationFrame(() => {
          if (browseCtl === ctl) ctl.layout();
        });
      } else if (tab === "review") {
        content.replaceChildren(reviewView());
        requestAnimationFrame(refit);
      } else if (tab === "notes") {
        content.replaceChildren(...[linkBox(), notes.mineView()].filter(Boolean));
        requestAnimationFrame(refit);
      } else if (tab === "contest") {
        content.replaceChildren(...[linkBox(), contests.view()].filter(Boolean));
        contests.layout();
        requestAnimationFrame(() => {
          if (open && tab === "contest") contests.layout();
        });
      } else {
        content.replaceChildren(...[linkBox(), submitView()].filter(Boolean));
        requestAnimationFrame(refit);
      }
    }
    function notesButton() {
      if (!acct.account || !notes.hasMine()) return null;
      const n = notes.mineUnread();
      return button(n ? `Notes (${n} new)` : "Notes", () => {
        notes.reset();
        setView("notes");
      }, { cls: `${tab === "notes" ? "wz-gl-on" : ""}${n ? " wz-gl-primary" : ""}`, title: "Notes from the gallery staff about your posts" });
    }
    function setView(v) {
      if (tab === "browse" && v !== "browse") voteQueue.flush();
      if (v === "editor") {
        open = false;
        panel.classList.remove("on");
        hideHover();
      } else {
        tab = v;
        open = true;
        panel.classList.add("on");
        render();
        refreshMe();
        if (v === "browse") refreshGallery();
        if (v === "review") refreshReview(true);
        if (v === "notes") notes.refreshMine(true);
        if (v === "contest" || v === "submit") contests.refresh();
      }
      notify();
    }
    checkFrameImages().then(() => {
      if (open) render();
    });
    whenFontsReady().then(() => {
      if (open) render();
    });
    let fontTimer = null;
    onFontsChange(() => {
      clearTimeout(fontTimer);
      fontTimer = setTimeout(() => {
        if (open) render();
      }, 50);
    });
    onArtPicsChange(() => {
      if (!open) return;
      if (tab === "browse" && browseCtl) browseCtl.layout();
      else if (tab === "contest") contests.layout();
    });
    const changed3 = () => {
      tidySets();
      saveDraft();
      lastUpload = null;
      render();
    };
    const guide = { text: null, loading: false };
    function loadGuide() {
      if (guide.text || guide.loading) return;
      guide.loading = true;
      getGuidelines().then((t) => {
        guide.text = t;
        guide.loading = false;
        if (open && tab === "submit") render();
      });
    }
    const rich = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const setGuide = (show) => {
      draft2.hideGuide = !show;
      saveDraft();
      render();
    };
    function guideBox() {
      loadGuide();
      if (draft2.hideGuide) return null;
      const g = parseGuidelines(guide.text || DEFAULT_GUIDELINES);
      return h(
        "div",
        { class: "wz-gl-guide" },
        h(
          "div",
          { class: "head" },
          h("b", { text: g.title || "Gallery guidelines" }),
          h("span", { class: "wz-gl-grow" }),
          button("Hide", () => setGuide(false), { cls: "wz-gl-small", title: "Hide the guidelines (Guidelines, above, shows them again)" })
        ),
        g.intro.map((t) => h("div", { html: rich(t) })),
        h("ul", {}, g.rules.map((t) => h("li", { html: rich(t) })))
      );
    }
    function submitView() {
      const sel = draft2.parts.filter((p) => p.sel);
      const bar = h(
        "div",
        { class: "wz-gl-bar" },
        button("Read from this editor", () => {
          const problem = requestRead();
          if (problem) return say(problem);
          clearTimeout(readTimer);
          readTimer = setTimeout(() => say("No answer from the editor. Wait for it to finish loading, then try again."), 4e3);
          say(`Reading ${editorLabel()}\u2026`);
        }, { primary: true, title: "List the cards you've made in the editor open here" }),
        button("Add files\u2026", () => fileInput.click(), { title: "UC Editor's group file (.uceditor), feildmaster's editor's Export file (.json), or card PNGs" }),
        button("Link selected", () => {
          makeSet(draft2.parts.filter((p) => p.sel));
          changed3();
        }, { title: "Make the selected parts one set" }),
        button("Unlink selected", () => {
          draft2.parts.filter((p) => p.sel).forEach((p) => {
            p.group = null;
            p.sel = false;
          });
          changed3();
        }),
        draft2.hideGuide ? button("Guidelines", () => setGuide(true), { title: "What gets accepted into the gallery" }) : null,
        h("span", { class: "wz-gl-grow" }),
        removeAllButton()
      );
      bar.children[2].disabled = sel.length < 2 || sel.length > SET_CAP;
      if (sel.length > SET_CAP) bar.children[2].title = `Sets can have up to ${SET_CAP} cards`;
      bar.children[3].disabled = !sel.some((p) => p.group);
      const note = h("p", { class: "wz-gl-note", text: draft2.parts.length ? "Click parts to select them, then Link selected to make a set. Anything not in a set is submitted on its own." : submitNote || "Make cards in the editor, then Read from this editor and tick the ones to add. Files work too." });
      return h("div", {}, guideBox(), bar, note, lastUpload ? uploadedBox() : null, draft2.parts.length ? uploadBox() : null, read && !reviewing ? picker() : null, setsRow(), tray());
    }
    let removeArmed = false;
    function removeAllButton() {
      const b = button(removeArmed ? "Click again to remove all" : "Remove all", () => {
        if (!draft2.parts.length) return;
        if (!removeArmed) {
          removeArmed = true;
          render();
          setTimeout(() => {
            if (removeArmed) {
              removeArmed = false;
              render();
            }
          }, 3e3);
          return;
        }
        removeArmed = false;
        draft2.parts.length = 0;
        draft2.groups.length = 0;
        reviewing = false;
        changed3();
      }, { title: "Empty your gallery draft" });
      b.disabled = !draft2.parts.length;
      return b;
    }
    function picker() {
      const n = read.groups.reduce((s, g) => s + g.parts.length, 0);
      const added = (g, raw) => draft2.parts.some((p) => sameCard(p, read.source, g.name, raw));
      const free = (g) => g.parts.filter((raw) => !added(g, raw));
      const box = h(
        "div",
        { class: "wz-gl-picker" },
        h(
          "div",
          { class: "wz-gl-bar" },
          h("b", { text: `In ${read.label}: ${n} card${n === 1 ? "" : "s"} in ${read.groups.length} group${read.groups.length === 1 ? "" : "s"}` }),
          button("Add ticked", () => addTicked(false), { primary: true }),
          button("Add ticked as one set", () => addTicked(true)),
          h("span", { class: "wz-gl-grow" }),
          button("Close list", () => {
            read = null;
            render();
          })
        )
      );
      if (!n) box.appendChild(h("p", { class: "wz-gl-note", text: "Nothing saved in this editor yet." }));
      read.groups.forEach((g) => {
        const open2 = free(g);
        const all = h("input", {
          type: "checkbox",
          checked: open2.length > 0 && open2.every((r) => r.pick),
          disabled: !open2.length,
          onchange: (e) => {
            open2.forEach((r) => {
              r.pick = e.target.checked;
            });
            render();
          }
        });
        box.appendChild(h(
          "div",
          { class: "wz-gl-pgroup" },
          h("label", {}, all, " ", h("b", { text: g.name }), h("small", { text: ` (${g.parts.length})` })),
          open2.length > 1 ? [" ", ((b) => {
            if (open2.length > SET_CAP) {
              b.disabled = true;
              b.title = `Sets can have up to ${SET_CAP} cards. Tick some and use Add ticked as one set.`;
            }
            return b;
          })(button("Add this group as a set", () => {
            read.groups.forEach((x) => x.parts.forEach((r) => {
              r.pick = x === g && !added(g, r);
            }));
            addTicked(g.name);
          }))] : null,
          h("div", { class: "wz-gl-pparts" }, g.parts.map((raw) => {
            const done = added(g, raw);
            return h(
              "label",
              { class: done ? "done" : "" },
              h("input", { type: "checkbox", checked: !!raw.pick && !done, disabled: done, onchange: (e) => {
                raw.pick = e.target.checked;
                render();
              } }),
              " ",
              h("span", { class: "wz-gl-type", text: raw.type, style: { color: TYPE_COLOR[raw.type] || "#fff" } }),
              " ",
              raw.name || "(no name)",
              done ? h("i", { text: " added" }) : null
            );
          }))
        ));
      });
      return box;
    }
    async function addTicked(asSet) {
      const picked = [];
      read.groups.forEach((g) => g.parts.forEach((raw) => {
        if (raw.pick && !draft2.parts.some((p) => sameCard(p, read.source, g.name, raw))) picked.push({ raw, group: g.name });
      }));
      if (!picked.length) return say("Tick some cards first.");
      if (asSet && picked.length > SET_CAP) return say(`Sets can have up to ${SET_CAP} cards. Untick some, or add them on their own.`);
      say(`Adding ${picked.length}\u2026`);
      const added = [];
      for (const { raw, group } of picked) {
        const part = await partFromRaw(raw, { source: read.source, from: read.label, editorGroup: group });
        part.id = nextId();
        draft2.parts.push(part);
        added.push(part);
      }
      if (asSet && added.length > 1) makeSet(added, typeof asSet === "string" ? asSet : "");
      read.groups.forEach((g) => g.parts.forEach((r) => {
        r.pick = false;
      }));
      say(`Added ${added.length} part${added.length === 1 ? "" : "s"}${asSet && added.length > 1 ? " as a set" : ""}.`);
      changed3();
    }
    function setsRow() {
      if (!draft2.groups.length) return null;
      return h("div", { class: "wz-gl-sets" }, draft2.groups.map((set) => h(
        "span",
        { class: "wz-gl-set", style: { borderColor: setColor(set) } },
        h("b", { text: set.letter }),
        h("input", { type: "text", placeholder: "Set name", maxLength: 40, value: set.name, oninput: (e) => {
          set.name = e.target.value;
          saveDraft();
        } }),
        `${draft2.parts.filter((p) => p.group === set.id).length} parts`
      )));
    }
    function tray() {
      return h("div", { class: "wz-gl-tray" }, draft2.parts.map((p) => {
        const set = draft2.groups.find((g) => g.id === p.group);
        const zoom = h("div", { class: "wz-gl-zoom", title: "Click to select", onclick: () => {
          p.sel = !p.sel;
          render();
        } }, tile(p));
        const name = h("input", { type: "text", placeholder: "Name", maxLength: 40, value: p.name, oninput: (e) => {
          p.name = e.target.value;
          saveDraft();
          if (!p.picture) {
            zoom.replaceChildren(tile(p));
            requestAnimationFrame(() => fitText(zoom));
          }
        } });
        const type = p.source === "picture" ? h("select", { onchange: (e) => {
          p.type = e.target.value;
          changed3();
        } }, TYPES.map((t) => h("option", { selected: t === p.type }, t))) : h("div", { style: { fontSize: "11px" }, text: p.type });
        return h(
          "div",
          { class: `wz-gl-part${p.sel ? " sel" : ""}` },
          set ? h("span", { class: "wz-gl-badge", text: set.letter, style: { background: setColor(set) } }) : null,
          button("\xD7", () => {
            draft2.parts.splice(draft2.parts.indexOf(p), 1);
            changed3();
          }, { title: "Remove this part", cls: "wz-gl-x" }),
          zoom,
          type,
          name,
          h("small", { class: "wz-gl-from", text: `${SOURCE_LABEL[p.source] || p.source} \xB7 ${p.editorGroup}${p.note ? " \xB7 " + p.note : ""}`, title: `${p.from} \xB7 ${p.editorGroup}${p.artFrom ? " \xB7 art from " + p.artFrom : ""}${p.note ? " \xB7 " + p.note : ""}` })
        );
      }));
    }
    function problems() {
      const out = [];
      if (!acct.loaded) out.push(acct.error ? `Unable to Submit: the gallery server can't be reached (${acct.error})` : "Checking your account\u2026");
      else if (!author()) out.push("Unable to Submit: link your Undercards account first (Link my account, at the top).");
      const s = targetSlots();
      if (submitTo && !s) out.push("That contest isn't taking entries any more. Upload to the gallery instead.");
      if (s && entries().length > s.left) out.push(s.left ? `This contest takes ${s.left} more entr${s.left === 1 ? "y" : "ies"} from you (${s.used} of ${s.max} used). A set counts as one.` : `You've used all ${s.max} entries in this contest. Withdraw one in the Contest tab to free a slot.`);
      const unnamed = draft2.parts.filter((p) => !p.name).length;
      const unnamedSets = draft2.groups.filter((g) => !g.name).length;
      if (unnamed) out.push(`${unnamed} card${unnamed === 1 ? " has" : "s have"} no name yet.`);
      if (unnamedSets) out.push(`${unnamedSets} set${unnamedSets === 1 ? " has" : "s have"} no name yet.`);
      return out.concat(uploadProblems(entries()));
    }
    function targetSlots() {
      const s = contests.slots();
      if (!submitTo) return null;
      return s && s.contest.id === submitTo ? s : null;
    }
    function targetPicker() {
      const s = contests.slots();
      if (!s && !submitTo) return null;
      if (!s) {
        submitTo = null;
        return null;
      }
      return h(
        "div",
        { class: "wz-gl-target" },
        h("span", { text: "Upload to:" }),
        button("Gallery", () => {
          submitTo = null;
          render();
        }, { cls: !submitTo ? "wz-gl-on" : "", title: "The main gallery, voted on by everyone" }),
        button(`Contest: ${s.contest.title} (${s.left} of ${s.max} left)`, () => {
          submitTo = s.contest.id;
          render();
        }, { cls: submitTo ? "wz-gl-on" : "", title: `Enter these in the contest. Entries close ${new Date(s.contest.closesAt).toLocaleString()}.` })
      );
    }
    function uploadBox() {
      const list = entries();
      const nCards = draft2.parts.length;
      const summary = `${list.length} entr${list.length === 1 ? "y" : "ies"} (${nCards} card${nCards === 1 ? "" : "s"})`;
      if (!reviewing) {
        const s = targetSlots();
        return h(
          "div",
          { class: "wz-gl-upload" },
          h("span", { text: `Ready to upload: ${summary}${s ? `, into ${s.contest.title}` : ""}.` }),
          h("span", { class: "wz-gl-grow" }),
          button("Review upload", () => {
            reviewing = true;
            render();
            panel.scrollTop = 0;
          }, { primary: true, title: "See exactly what will be sent before uploading" })
        );
      }
      const issues = problems();
      const rows = list.map((e) => h(
        "div",
        { class: "wz-gl-rev" },
        h(
          "div",
          { class: "wz-gl-revhead" },
          h("b", { text: e.kind === "set" ? `Set ${e.label}: ${e.title || "(no name)"}` : e.title || "(no name)" }),
          h("small", { text: e.kind === "set" ? ` ${e.parts.length} cards` : ` ${e.parts[0].type}` })
        ),
        h("div", { class: "wz-gl-revcards" }, e.parts.map((p) => h("div", { class: "wz-gl-zoom" }, tile(p))))
      ));
      const into = targetSlots();
      const go2 = button(uploading ? "Uploading\u2026" : into ? "Enter in Contest" : "Upload to Gallery", () => doUpload(), { primary: true, title: issues.length ? issues[0] : "Send these for approval" });
      go2.disabled = issues.length > 0 || uploading;
      return h(
        "div",
        { class: "wz-gl-upload open" },
        targetPicker(),
        h(
          "div",
          { class: "wz-gl-bar" },
          h("b", { text: into ? `Enter ${summary} in ${into.contest.title}` : `Upload ${summary}` }),
          h("span", { class: "wz-gl-grow" }),
          h("span", { class: "wz-gl-by", text: author() ? `Posting as ${author()}` : "" })
        ),
        h("div", { class: "wz-gl-revlist" }, rows),
        issues.length ? h("div", { class: "wz-gl-issues" }, issues.map((t) => h("div", { text: t }))) : null,
        privacyLine("Your posts are public, with your account name, until you delete them."),
        h(
          "div",
          { class: "wz-gl-note", style: { margin: "6px 0 0" } },
          "Before uploading, check it follows the guidelines. ",
          draft2.hideGuide ? button("Show guidelines", () => {
            setGuide(true);
            panel.scrollTop = 0;
          }, { cls: "wz-gl-small" }) : h("span", { text: "(They're at the top of this page.)" })
        ),
        h(
          "div",
          { class: "wz-gl-bar wz-gl-revfoot" },
          h("span", { class: "wz-gl-note", style: { margin: 0 }, text: into ? "Each set and single card is one entry, checked against the contest's rules. Approved entries show in the Contest tab, and join the gallery when the results are out." : "Each set and single card is sent as its own entry, for approval. Approved ones show in Browse for everyone." }),
          h("span", { class: "wz-gl-grow" }),
          button("Back", () => {
            reviewing = false;
            render();
          }),
          go2
        )
      );
    }
    async function doUpload() {
      if (problems().length || uploading) return render();
      uploading = true;
      render();
      let sent = [], error = "";
      try {
        sent = await uploadEntries(entries(), (i, n) => {
          if (n > 1 && i < n) say(`Uploading part ${i + 1} of ${n}\u2026`);
        }, targetSlots() ? submitTo : null);
      } catch (e) {
        sent = e.extra && e.extra.sent || [];
        error = errText(e);
      }
      uploading = false;
      if (sent.length) markUploaded(sent);
      reviewing = !!error && !sent.length;
      read = null;
      lastUpload = sent.length || error ? { posts: sent, error, contest: sent.length && sent[0].contest ? contests.active() : null } : null;
      say(error ? sent.length ? `Uploaded ${sent.length}; the rest didn't go: ${error}` : `Upload failed: ${error}` : `Uploaded ${sent.length} entr${sent.length === 1 ? "y" : "ies"}.`);
      if (sent.length) {
        refreshMe(true);
        if (lastUpload.contest) {
          submitTo = null;
          contests.refresh(true);
        }
      }
      render();
    }
    function uploadedBox() {
      const posts = lastUpload.posts;
      if (!posts.length) {
        return h("div", { class: "wz-gl-done failed" }, h("b", { text: "Nothing was uploaded." }), " ", lastUpload.error, " ", button("Dismiss", () => {
          lastUpload = null;
          render();
        }));
      }
      const cards = posts.reduce((n, e) => n + e.local.parts.length, 0);
      return h(
        "div",
        { class: `wz-gl-done${lastUpload.error ? " failed" : ""}` },
        h("div", {}, h("b", { text: `\u2713 ${lastUpload.contest ? `Entered in ${lastUpload.contest.title}` : "Sent for approval"}: ${posts.length} entr${posts.length === 1 ? "y" : "ies"} (${cards} card${cards === 1 ? "" : "s"})` })),
        h("ul", {}, posts.map((e) => h("li", { text: e.kind === "set" ? `${e.title} (set of ${e.local.parts.length})` : `${e.title} (${e.local.parts[0].type})` }))),
        lastUpload.error ? h("div", { class: "wz-gl-issues", text: `The rest weren't sent: ${lastUpload.error} They're still in your draft below.` }) : null,
        h("div", { class: "wz-gl-note", style: { margin: "0 0 6px" }, text: lastUpload.contest ? "They're checked against the contest's rules first. See them under Your entries in the Contest tab." : "They show under My posts as awaiting approval, and in Browse for everyone once approved." }),
        lastUpload.contest ? button("See the contest", () => {
          lastUpload = null;
          setView("contest");
        }, { primary: true }) : button("See my posts", () => {
          browse.mineOnly = true;
          browse.likedOnly = false;
          browse.list = "new";
          browse.page = 0;
          lastUpload = null;
          setView("browse");
        }, { primary: true }),
        " ",
        button("Dismiss", () => {
          lastUpload = null;
          render();
        })
      );
    }
    fileInput.addEventListener("change", async () => {
      const files = [...fileInput.files];
      fileInput.value = "";
      for (const f of files) {
        try {
          const isJson = /\.json$/i.test(f.name) || f.type === "application/json";
          const text = isJson ? await readFile(f, "readAsText") : null;
          if (isJson && !isFeildmasterExport(text)) {
            say(`${f.name} isn't an Export file from feildmaster's editor.`);
            continue;
          }
          if (isJson) {
            say(`Reading ${f.name}\u2026`);
            const fx = await readFeildmasterFile(text);
            const groups = fx.groups.map((g) => {
              const fresh = g.parts.filter((r) => !draft2.parts.some((p) => sameCard(p, "feildmaster", g.name, r)));
              return { name: g.name, parts: g.parts.map((r) => ({ ...r, pick: fresh.includes(r) })) };
            });
            const n = groups.reduce((k, g) => k + g.parts.length, 0), nNew = groups.reduce((k, g) => k + g.parts.filter((r) => r.pick).length, 0);
            const noArt = groups.reduce((k, g) => k + g.parts.filter((r) => r.artNote).length, 0);
            read = { source: "feildmaster", label: `${f.name} (feildmaster's editor file)`, groups };
            say(!n ? `${f.name}: no cards or artifacts in it.` : nNew ? `${f.name}: ${nNew} new card(s), ticked.${noArt ? ` ${noArt} use his built-in art, which couldn't be loaded yet: add them as PNG pictures instead.` : ""} Untick any you don't want, then Add ticked.` : `${f.name}: all ${n} card(s) are in your draft already.`);
          } else if (/\.uceditor$/i.test(f.name)) {
            const g = readUcEditorFile(await readFile(f, "readAsText"));
            const fresh = g.parts.filter((r) => !draft2.parts.some((p) => sameCard(p, "sernon", g.name, r)));
            read = { source: "sernon", label: `${f.name} (UC Editor file)`, groups: [{ name: g.name, parts: g.parts.map((r) => ({ ...r, pick: fresh.includes(r) })) }] };
            say(fresh.length ? `${f.name}: ${fresh.length} new card(s), ticked. Untick any you don't want, then Add ticked.` : `${f.name}: all ${g.parts.length} card(s) are in your draft already.`);
          } else {
            const stem = f.name.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "").trim();
            const pics = await picturesFromPng(await readFile(f, "readAsDataURL"), { from: f.name, editorGroup: stem });
            pics.forEach((p) => {
              p.id = nextId();
              draft2.parts.push(p);
            });
            say(`${f.name}: ${pics.length} picture part(s) added. Pictures need their names typed.`);
          }
        } catch (e) {
          say(`Couldn't read ${f.name}.`);
        }
      }
      changed3();
    });
    function browseTab() {
      const own = acct.posts.filter((p) => !p.contest && (p.status === "pending" || p.status === "rejected") && draft2.uploads[p.id]).map((p) => ({ id: p.id, status: p.status, reason: p.reason, postedAt: p.postedAt, kind: draft2.uploads[p.id].kind, title: draft2.uploads[p.id].title, parts: draft2.uploads[p.id].parts }));
      acct.posts.filter((p) => !p.contest && p.status === "approved" && draft2.uploads[p.id] && !gal.approved.some((a) => a.id === p.id)).forEach((p) => own.push({ id: p.id, status: "pending", postedAt: p.postedAt, kind: draft2.uploads[p.id].kind, title: draft2.uploads[p.id].title, parts: draft2.uploads[p.id].parts }));
      const list = allEntries({ approved: gal.approved.filter((p) => !draft2.gone[p.id]), own, totals: gal.totals, baseVotes: gal.base, current: currentVotes(), account: acct.account });
      return browseView({
        state: browse,
        wheelPages: () => !wheelPages || wheelPages(),
        onPage: hideHover,
        entries: list,
        note: gal.error ? `Couldn't load the gallery: ${gal.error}` : acct.account ? "" : "Link your account to vote.",
        emptyText: gal.loading && !gal.at ? "* Loading the gallery\u2026" : gal.error && !gal.at ? "* Couldn't load the gallery. Try again in a moment." : "",
        hoverable,
        rerender: render,
        onRefresh: () => {
          voteQueue.flush();
          refreshMe(true);
          refreshGallery(true);
        },
        onRemove: reviewerKey2() && (role() === "owner" || role() === "reviewer") ? removePost : null,
        onDelete: deleteMine,
        // ✉: staff start a note on a post; authors open the note on theirs.
        onNote: staffNotes() ? (e) => noteOn({ id: e.id, title: e.title }) : null,
        noteFor: (e) => e.mine ? notes.mineFor(e.id) : null,
        openNote: (t) => {
          notes.reset();
          setView("notes");
          notes.openThread(t.id, "author");
        },
        vote(e, dir) {
          if (!acct.account) {
            say("Link your Undercards account to vote: press Link my account at the top.");
            return;
          }
          const cur = currentVotes()[e.id] || 0;
          voteQueue.add(e.id, cur === dir ? 0 : dir);
          render();
        }
      });
    }
    return {
      el: panel,
      isOpen: () => open,
      isReviewer: () => !!reviewerKey2() && role() !== "player",
      pendingCount: () => !reviewerKey2() ? 0 : isJudge() ? contests.unscored() : rev.list.length + (staffNotes() ? notes.staffUnread() : 0),
      // A "new message" popup was clicked: open that note.
      openNote(id) {
        notes.reset();
        setView("notes");
        notes.openThread(id, "author");
      },
      // The Card Maker opened: the reviewer's count of uploads waiting.
      opened() {
        if (reviewerKey2()) refreshReview();
      },
      // ___ucReviewList turned review on or off.
      reviewerChanged() {
        rev = blankRev();
        if (reviewerKey2()) refreshReview(true);
        else if (open && tab === "review") {
          setView("browse");
          return;
        }
        notify();
        if (open) render();
      },
      setOpen(on) {
        setView(on ? tab : "editor");
      },
      view: () => open ? tab : "editor",
      setView,
      onChange(f) {
        listeners4.push(f);
      },
      // Send queued votes now (the Card Maker is closing or being minimised).
      flush: () => voteQueue.flush(),
      receiveCards(data) {
        clearTimeout(readTimer);
        read = { source: data.source, label: editorLabel(data.source), groups: (data.groups || []).map((g) => ({ name: g.name, parts: (g.parts || []).map((p) => ({ ...p, pick: false })) })) };
        const n = read.groups.reduce((s, g) => s + g.parts.length, 0);
        say(`Found ${n} card${n === 1 ? "" : "s"}. Tick what to add.`);
        tab = "submit";
        if (open) render();
      }
    };
  }

  // ../wz/packages/card-maker/editors.js
  var EDITORS = {
    feildmaster: {
      label: "feildmaster's Template Editor",
      url: "https://undercard.feildmaster.com/",
      origin: "https://undercard.feildmaster.com"
    },
    sernon: {
      label: "UC Editor (sernon158)",
      url: "https://sernon158.github.io/uc-editor/",
      origin: "https://sernon158.github.io"
    }
  };
  var EDITOR_LABELS = Object.values(EDITORS).map((e) => e.label);
  var FRAME_MESSAGE = "wizascript-card-maker";

  // src/link-steps.js
  var UC_URL = "https://undercards.net/";
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  var isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || "");
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => false);
    return Promise.resolve(false);
  }
  function linkSteps({ line, say }) {
    const lineEl = h("code", { class: "wz-gl-line", text: line });
    const copyBtn = button("Copy", () => copy(line).then((ok) => say(ok ? "Copied. Paste it in void's chat box." : "Select the line and copy it (Ctrl+C).")), { primary: true, title: "Copy the line" });
    const keys = isMac ? "\u2318 + Option + J" : "F12 (or Ctrl + Shift + J)";
    return [
      h(
        "li",
        {},
        "Open ",
        h("a", { href: UC_URL, target: "_blank", rel: "noopener", text: "undercards.net" }),
        " in another tab, logged in as the account you want to post and vote as.",
        isMobile ? h("div", { class: "dim", text: "Linking needs a computer: phone browsers have no console." }) : null
      ),
      h("li", {}, "There, open the browser console: press ", h("b", { text: keys }), " and pick the ", h("b", { text: "Console" }), " tab."),
      h(
        "li",
        {},
        "Type ",
        h("code", { class: "wz-gl-line", text: "openRoom(0)" }),
        " and press Enter. Void (chat room 0) opens.",
        h("div", { class: "dim", text: "Type it yourself. Never paste code someone sends you into the console." })
      ),
      h("li", {}, "Copy this line and send it in void's chat box (not the console): ", lineEl, " ", copyBtn)
    ];
  }

  // src/style.js
  var SITE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; display: flex; flex-direction: column; overflow: hidden; background: #0d0d0d; color: #fff; font: 12px Arial, sans-serif; }
a { color: #8ec5ff; }
.dim { opacity: .7; }

/* buttons, as in the Card Maker */
.wz-cm-btn { flex: none; min-width: 24px; height: 22px; padding: 0 6px; border: 1px solid #777; border-radius: 3px;
  background: #333; color: #fff; font: 13px Arial, sans-serif; line-height: 20px; cursor: pointer; }
.wz-cm-btn:hover { background: #444; border-color: #aaa; }

/* top bar */
.wz-site-top { flex: none; height: 46px; display: flex; align-items: center; gap: 14px; padding: 0 14px; background: #000; border-bottom: 2px solid #fff; }
.wz-site-brand { display: flex; align-items: center; gap: 8px; color: #fff; text-decoration: none; font: 20px $FONT; white-space: nowrap; }
.wz-site-brand img { width: 24px; height: 24px; image-rendering: pixelated; }
.wz-site-nav { display: flex; height: 30px; border: 2px solid #fff; background: #000; }
.wz-site-nav button { display: flex; align-items: center; gap: 6px; background: none; border: 0; color: #ccc; padding: 0 14px; font: 15px $FONT; cursor: pointer; }
.wz-site-nav button + button { border-left: 2px solid #fff; }
.wz-site-nav button:hover { color: #fff; background: #222; }
.wz-site-nav button.on { background: #ffd84a; color: #000; }
.wz-site-nav .ic { font-size: 13px; }
.wz-site-nav .count { background: #e05a5a; color: #fff; border-radius: 8px; padding: 0 5px; font: 10px/14px Arial, sans-serif; }
.wz-site-nav button.on .count { background: #000; color: #ffd84a; }
.wz-site-grow { flex: 1 1 auto; }
.wz-cm-btn.wz-site-help-btn { width: 28px; height: 28px; border-radius: 14px; font: bold 15px Arial, sans-serif; padding: 0; }

/* the gallery and the editors share the space under the top bar */
.wz-site-main { flex: 1 1 auto; min-height: 0; position: relative; }
.wz-gl-panel.wz-site-panel { padding: 12px 18px; }
/* Browse's and Contest's bottom bars start after the key button */
.wz-site-panel .wz-gl-foot { padding-left: 32px; }
.wz-site-editors { position: absolute; inset: 0; display: flex; flex-direction: column; }
.wz-site-ebar { flex: none; display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #1a1a1a; border-bottom: 1px solid #444; }
.wz-site-etabs { display: flex; gap: 4px; }
.wz-site-credit { opacity: .7; }
.wz-site-ehost { flex: 1 1 auto; min-height: 0; position: relative; background: #111; }
.wz-site-ehost iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #111; }
.wz-site-ehost iframe[hidden] { display: none; }
.wz-site-enote { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 12px; background: #3a2a00; border-bottom: 1px solid #e0a800; }
.wz-site-enote[hidden] { display: none; }
.wz-cm-btn.wz-gl-on { background: #4464bd; border-color: #8ea6e8; }

.wz-site-privacy { color: #aaa; font-size: 13px; margin-right: 10px; text-decoration: none; }
.wz-site-privacy:hover { color: #fff; text-decoration: underline; }

/* key button, bottom left */
.wz-site-keybtn { position: fixed; left: 10px; bottom: 10px; z-index: 40; width: 30px; height: 30px; border-radius: 15px; padding: 0;
  background: #000; color: #bbb; border: 1px solid #666; font-size: 16px; line-height: 28px; cursor: pointer; opacity: .55; }
.wz-site-keybtn:hover, .wz-site-keybtn:focus-visible { opacity: 1; color: #fff; border-color: #fff; }
.wz-site-keybtn.on { color: #ffd84a; border-color: #ffd84a; opacity: .9; }
.wz-site-keybtn.wz-site-devbtn { left: 46px; font-size: 15px; }

/* post notes: "new message" popup, bottom right */
.wz-site-notepop { position: fixed; right: 14px; bottom: 14px; z-index: 45; display: none; align-items: stretch; background: #000; border: 2px solid #ffd84a; border-radius: 4px; box-shadow: 0 4px 18px rgba(0,0,0,.7); max-width: calc(100vw - 100px); }
.wz-site-notepop.on { display: flex; }
.wz-site-notepop-main { display: flex; align-items: center; gap: 8px; background: none; border: 0; color: #fff; padding: 10px 12px; font: 14px Arial, sans-serif; cursor: pointer; text-align: left; }
.wz-site-notepop-main .ic { color: #ffd84a; font-size: 16px; }
.wz-site-notepop-x { background: none; border: 0; border-left: 1px solid #444; color: #aaa; padding: 0 10px; font-size: 18px; cursor: pointer; }
.wz-site-notepop-x:hover, .wz-site-notepop-main:hover { color: #fff; }

/* dialogs */
.wz-site-dback { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; padding: 16px; }
.wz-site-dialog { width: min(440px, 100%); background: #0d0d0d; border: 2px solid #fff; border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,.8); font-size: 14px; }
.wz-site-dhead { padding: 10px 14px; border-bottom: 1px solid #444; font: 18px $FONT; }
.wz-site-dialog > div:nth-child(2) { padding: 12px 14px; }
.wz-site-dfoot { display: flex; justify-content: flex-end; padding: 8px 14px; border-top: 1px solid #444; }
.wz-site-dialog p { margin: 0 0 10px; }
.wz-site-help ul { margin: 0 0 10px; padding-left: 20px; }
.wz-site-help li { margin: 4px 0; }
.wz-site-krow { display: flex; gap: 6px; }
.wz-site-krow input { flex: 1; min-width: 0; height: 28px; background: #222; color: #fff; border: 1px solid #666; border-radius: 3px; padding: 0 8px; font: 14px Arial, sans-serif; }
.wz-site-krow input:focus { border-color: #8ea6e8; outline: none; }
.wz-site-key .wz-cm-btn, .wz-site-dfoot .wz-cm-btn { height: 28px; padding: 0 14px; }
.wz-site-kstatus { min-height: 1.2em; margin-top: 8px !important; }
.wz-cm-btn.wz-site-danger { background: #6b2f2f; border-color: #bf6f6f; }

/* a short message (key removed, etc.) */
.wz-site-toast { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 90; background: #000; border: 2px solid #fff; padding: 8px 14px; font-size: 13px; display: none; }
.wz-site-toast.on { display: block; }

/* the linking steps are longer here than in Wizascript */
.wz-site-panel .wz-gl-link { font-size: 13px; max-width: 900px; }
.wz-site-panel .wz-gl-link li { margin: 6px 0; }

/* narrow screens: icons only */
@media (max-width: 760px) {
  .wz-site-nav button { padding: 0 9px; }
  .wz-site-nav button > span:not(.ic):not(.count) { display: none; }
  .wz-site-brand span { display: none; }
  .wz-site-credit { display: none; }
}
`;

  // src/main.js
  var VIEWS = [["editor", "Editor", "\u270E"], ["browse", "Browse", "\u25A4"], ["contest", "Contest", "\u2605"], ["submit", "Submit", "\u2B06"], ["review", "Review", "\u2713"]];
  var EDITOR_KEY = "wizascript.site.editor";
  var CREDIT = { feildmaster: "by feildmaster", sernon: "by sernon158" };
  var SHORT = { feildmaster: "feildmaster's Template Editor", sernon: "UC Editor" };
  var style = document.createElement("style");
  style.textContent = SITE_CSS.replace(/\$FONT/g, CARD_FONT);
  document.head.appendChild(style);
  var gallery = null;
  function keyChanged() {
    syncKeyButton();
    if (gallery) gallery.reviewerChanged();
    syncNav();
  }
  onKeyChange(keyChanged);
  function forgetKey2(message) {
    if (forgetKey() && message) toast(message);
  }
  var openDialog = null;
  function dialog(title, body) {
    closeDialog();
    const close = button("Close", () => closeDialog(), { cls: "wz-site-dclose" });
    const box = h(
      "div",
      { class: "wz-site-dialog", role: "dialog", "aria-label": title },
      h("div", { class: "wz-site-dhead" }, h("b", { text: title })),
      body,
      h("div", { class: "wz-site-dfoot" }, close)
    );
    const back = h("div", { class: "wz-site-dback", onclick: (e) => {
      if (e.target === back) closeDialog();
    } }, box);
    document.body.appendChild(back);
    openDialog = back;
    return box;
  }
  function closeDialog() {
    if (openDialog) {
      openDialog.remove();
      openDialog = null;
    }
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openDialog) closeDialog();
  });
  var toastTimer = null;
  var toastEl = h("div", { class: "wz-site-toast" });
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("on"), 5e3);
  }
  function openKeyDialog() {
    dialog("Redeem Key", keyBox({ reviewWhere: "in the top bar" }));
  }
  function openDeviceDialog() {
    dialog(DEVICE_TITLE, deviceBox({ notLinked: "Link your account first (Link my account in Browse or Submit), or redeem a code from a linked device." }));
  }
  function openHelp() {
    dialog("Card Gallery", h(
      "div",
      { class: "wz-site-help" },
      h("p", { text: "Custom Undercards cards made by players, the same gallery as Wizascript's Card Maker." }),
      h(
        "ul",
        {},
        h("li", {}, h("b", { text: "Browse" }), ": everyone's approved cards. Vote with \u25B2 \u25BC once your account is linked."),
        h("li", {}, h("b", { text: "Contest" }), ": the running contest and past results. The organizers judge entries."),
        h("li", {}, h("b", { text: "Editor" }), ": make cards in either community editor."),
        h("li", {}, h("b", { text: "Submit" }), ": add your cards (UC Editor's .uceditor download, or a card PNG), then upload them for approval.")
      ),
      h("p", { class: "dim", text: "Posting and voting need your Undercards account linked once (Link my account). Your link, draft and votes are kept in this browser." }),
      h("p", { class: "dim" }, "Card editors by feildmaster and sernon158, shown with their permission. Made by Wiza; not an official Undercards site.")
    ));
  }
  var nav = h("nav", { class: "wz-site-nav" }, VIEWS.map(([v, label, icon]) => h(
    "button",
    { type: "button", "data-view": v, onclick: () => go(v) },
    h("span", { class: "ic", text: icon }),
    h("span", { text: label }),
    v === "review" ? h("span", { class: "count" }) : null
  )));
  var top = h(
    "header",
    { class: "wz-site-top" },
    h(
      "a",
      { class: "wz-site-brand", href: "#browse", onclick: (e) => {
        e.preventDefault();
        go("browse");
      } },
      h("img", { src: "pack.png", alt: "" }),
      h("span", { text: "Card Gallery" })
    ),
    nav,
    h("span", { class: "wz-site-grow" }),
    h("a", { class: "wz-site-privacy", href: PRIVACY_URL, target: "_blank", rel: "noopener", text: "Privacy", title: "What the Card Gallery keeps, and how to see or delete it" }),
    button("?", openHelp, { cls: "wz-site-help-btn", title: "What is this?" })
  );
  var editorPane = h("section", { class: "wz-site-editors" });
  var main = h("main", { class: "wz-site-main" }, editorPane);
  var keyBtn = h("button", { type: "button", class: "wz-site-keybtn", onclick: openKeyDialog, "aria-label": "Redeem Key" }, h("span", { text: "\u26BF" }));
  function syncKeyButton() {
    keyBtn.title = keyLabel();
    keyBtn.classList.toggle("on", !!(reviewerKey() && reviewerWho()));
  }
  var devBtn = h("button", { type: "button", class: "wz-site-keybtn wz-site-devbtn", onclick: openDeviceDialog, title: DEVICE_TITLE, "aria-label": DEVICE_TITLE }, h("span", { text: "\u{1F4F1}" }));
  document.body.append(top, main, keyBtn, devBtn, toastEl);
  syncKeyButton();
  var frames = {};
  var editorKey = EDITORS[GM_getValue(EDITOR_KEY, "")] ? GM_getValue(EDITOR_KEY, "") : "sernon";
  var editorTabs = h("div", { class: "wz-site-etabs" });
  var editorNote = h("div", { class: "wz-site-enote", hidden: true });
  var editorHost = h("div", { class: "wz-site-ehost" });
  editorPane.append(h(
    "div",
    { class: "wz-site-ebar" },
    editorTabs,
    h("span", { class: "wz-site-grow" }),
    h("span", { class: "wz-site-credit" }),
    button("Open in its own tab \u2197", () => window.open(EDITORS[editorKey].url, "_blank", "noopener"), { title: "The editor on its own site" })
  ), editorNote, editorHost);
  function drawEditorBar() {
    editorTabs.replaceChildren(...Object.keys(EDITORS).map((k) => button(SHORT[k], () => showEditor(k), { cls: k === editorKey ? "wz-gl-on" : "", title: EDITORS[k].label })));
    editorPane.querySelector(".wz-site-credit").textContent = CREDIT[editorKey] || "";
  }
  function showEditor(key) {
    editorKey = key;
    GM_setValue(EDITOR_KEY, key);
    if (!frames[key]) {
      const el = h("iframe", { src: EDITORS[key].url, title: EDITORS[key].label, allow: "clipboard-write" });
      const f = frames[key] = { el, status: "loading", helper: false };
      el.addEventListener("load", () => {
        if (f.status === "loading") f.status = "ready";
        updateEditorNote();
      });
      editorHost.appendChild(el);
    }
    Object.entries(frames).forEach(([k, f]) => {
      f.el.hidden = k !== key;
    });
    drawEditorBar();
    updateEditorNote();
  }
  function updateEditorNote() {
    const f = frames[editorKey];
    editorNote.replaceChildren();
    editorNote.hidden = true;
    if (!f || editorKey !== "feildmaster") return;
    if (f.status === "broken") {
      editorNote.append(
        h("span", { text: "feildmaster's editor didn't start inside this page." }),
        button("Open its site \u2197", () => window.open(EDITORS.feildmaster.url, "_blank", "noopener"))
      );
      editorNote.hidden = false;
    }
  }
  window.addEventListener("message", (e) => {
    if (!e.data || e.data.tag !== FRAME_MESSAGE) return;
    const key = Object.keys(frames).find((k) => frames[k].el.contentWindow === e.source);
    if (!key || e.origin !== EDITORS[key].origin) return;
    const f = frames[key];
    f.helper = true;
    if (e.data.type === "cards") {
      if (gallery) gallery.receiveCards({ ...e.data, source: key });
      return;
    }
    if (e.data.status) {
      f.status = e.data.status;
      updateEditorNote();
    }
  });
  gallery = buildGalleryPanel({
    requestRead: () => {
      const f = frames[editorKey];
      if (!f) return "Open an editor first (Editor, in the top bar).";
      if (f.status === "loading") return "The editor is still loading.";
      if (!f.helper) return "Reading straight from an editor needs Wizascript. Without it, use Add files\u2026: UC Editor's group download (.uceditor) or a card PNG.";
      f.el.contentWindow.postMessage({ tag: FRAME_MESSAGE, type: "read" }, EDITORS[editorKey].origin);
      return null;
    },
    editorLabel: (key) => EDITORS[key || editorKey].label,
    wheelPages: () => true,
    reviewerKey,
    onKeyRejected: (code) => forgetKey2(code === "key_expired" ? "Your gallery key has expired, so it was removed." : "Your gallery key was revoked, so it was removed."),
    linkSteps,
    watchLink: true,
    submitNote: "Make cards in an editor (Editor, in the top bar) and save them to a file: UC Editor's group download (.uceditor), or feildmaster's Export \u2192 Download (.json). Then Add files\u2026. With Wizascript installed, Read from this editor works too."
  });
  gallery.el.classList.add("wz-site-panel");
  main.appendChild(gallery.el);
  gallery.onChange(syncNav);
  function syncNav() {
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
  var current = null;
  function go(view, { replace = false } = {}) {
    if (!VIEWS.some(([v]) => v === view) && view !== "notes") view = "browse";
    if (view === "review" && !gallery.isReviewer()) view = "browse";
    if (view === current) return;
    current = view;
    const hash = "#" + view;
    if (location.hash !== hash) history[replace ? "replaceState" : "pushState"](null, "", hash);
    document.body.dataset.view = view;
    if (view === "editor") {
      gallery.setView("editor");
      showEditor(editorKey);
    } else gallery.setView(view);
    syncNav();
  }
  window.addEventListener("popstate", () => go(location.hash.slice(1)));
  window.addEventListener("pagehide", () => gallery.flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") gallery.flush();
  });
  checkFrameImages();
  go(location.hash.slice(1) || "browse", { replace: true });
  gallery.opened();
  recheckKey(toast);
  var notePop = h("div", { class: "wz-site-notepop", role: "status" });
  document.body.appendChild(notePop);
  setTimeout(async () => {
    const fresh = await newNoteAlerts({ every: 6e4 }).catch(() => []);
    if (!fresh.length) return;
    const openIt = () => {
      notePop.classList.remove("on");
      go("notes");
      gallery.openNote(fresh[0].id);
    };
    notePop.replaceChildren(
      h("button", { type: "button", class: "wz-site-notepop-main", onclick: openIt }, h("span", { class: "ic", text: "\u2709" }), h("span", { text: alertText(fresh) })),
      h("button", { type: "button", class: "wz-site-notepop-x", title: "Dismiss", text: "\xD7", onclick: () => notePop.classList.remove("on") })
    );
    notePop.classList.add("on");
  }, 1500);
  GM_deleteValue("wizascript.site.samples");
})();

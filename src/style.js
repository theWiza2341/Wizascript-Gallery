// src/style.js
//
// The page around the gallery panel. The panel and its cards bring their
// own styles (Wizascript's gallery CSS); this adds what the Card Maker's
// window normally gives them (border-box sizing, the .wz-cm-btn buttons)
// plus the top bar, the editors, the key button and dialogs.
// $FONT is replaced with the card font stack (DTM-Mono).

export const SITE_CSS = `
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

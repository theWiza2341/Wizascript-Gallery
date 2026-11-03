// build.mjs — builds app.js from src/ plus Wizascript's gallery code.
//
//   node build.mjs [path to a Wizascript checkout]    (default: ../wizascript)
//
// "@wz/..." imports in src/ point at that checkout's packages/ folder, so the
// site always uses the same gallery code as the userscript. Needs esbuild
// (npm install esbuild). The site itself is plain files: GitHub Pages serves
// index.html, app.js and pack.png as they are; nothing runs on GitHub.

import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const wz = resolve(process.argv[2] || resolve(here, "../wizascript"));
if (!existsSync(resolve(wz, "packages/card-maker/gallery/panel.js"))) {
  console.error(`No Wizascript checkout at ${wz} (pass its path as the first argument).`);
  process.exit(1);
}
const version = JSON.parse(readFileSync(resolve(here, "package.json"), "utf8")).version;
const wzVersion = JSON.parse(readFileSync(resolve(wz, "package.json"), "utf8")).version;

await build({
  entryPoints: [resolve(here, "src/main.js")],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: resolve(here, "app.js"),
  alias: { "@wz": resolve(wz, "packages") },
  // Wizascript's build loads these as data URLs; the site doesn't use them,
  // but a gallery module could import one later.
  loader: { ".png": "dataurl", ".gif": "dataurl" },
  banner: { js: `// Wizascript Card Gallery website ${version} (gallery code from Wizascript ${wzVersion}). Built by build.mjs from src/; edit src/, not this file.` },
  legalComments: "none",
  logLevel: "warning"
});
console.log(`Built app.js (site ${version}, Wizascript ${wzVersion})`);

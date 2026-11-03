# Wizascript Card Gallery (website)

The Card Gallery from Wizascript's Card Maker, as a website for players who don't use the userscript:
**https://thewiza2341.github.io/wizascript-gallery/**

It is the same gallery, not a copy. Both use the same gallery server (the `wizascript-gallery-worker` Cloudflare Worker) and the same `gallery` branch of `theWiza2341/Wizascript`. Posts, votes, contests, account links and review keys are shared 1:1.

## What's here

| File | What it is |
|---|---|
| `index.html` | The page. |
| `app.js` | Everything the page runs, built by `build.mjs`. **Don't edit it by hand.** |
| `pack.png` | The icon. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. |
| `src/` | The site's own code (the top bar, editors, key button, linking steps). |
| `build.mjs`, `package.json` | How `app.js` is built. |

The gallery itself (Browse, Contest, Submit, Review, the card drawing) is Wizascript's own code. `build.mjs` bundles it from a Wizascript checkout (`packages/card-maker/gallery/`), so a fix there reaches both after a rebuild.

## Turning on GitHub Pages (once)

1. In this repo on GitHub: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Set **Branch** to **main** and the folder to **/ (root)**, then **Save**.
4. Wait a minute or two. The page shows the site's address at the top once it's live.

The repo must be **Public** for Pages on a free account.

## Updating

Upload the changed files through GitHub's website (drag the **folders**, e.g. `src`, not the files inside them). Pages republishes within a minute or two of every upload to `main`. A refresh with Ctrl+F5 skips the browser's cache.

Nothing here notifies Wizascript players: this repo is separate from Wizascript.

## Building `app.js` (for whoever builds it)

```
npm install
node build.mjs ../wizascript      # path to a Wizascript checkout
```

## Dev builds: sample data

Dev builds mix made-up entries into Browse and Contest (a **Samples** switch in the top bar), so layouts can be judged before there are many real posts. Samples are never sent anywhere; votes on them stay on the page.

**To remove for release:** delete `src/samples.js` and the two lines in `src/main.js` that mention it, then rebuild.

## What the site keeps in your browser

Your link to your Undercards account (the install credentials), your Submit draft and any review key you redeemed. They're kept in this site's local storage, under `wzg:`. Clearing the site's data unlinks this browser; linking again is allowed (the once-a-day limit only applies to switching to a different account).

## Credits

Card editors by feildmaster (Template Editor) and sernon158 (UC Editor), shown with their permission. Card frames, rarity icons and the card font are the game's own, loaded from undercards.net with the Undercards team's OK. Not an official Undercards site.

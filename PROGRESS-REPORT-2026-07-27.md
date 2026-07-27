# Raphaelle Constant — site · progress report

**Date:** 2026-07-27
**Live:** https://raphaelle-constant.vercel.app/ (Vercel, auto-deploys from `main`)
**Scope:** everything built since the initial repo seed (kickoff brief in `CLAUDE.md`).
**Stack:** pure static HTML/CSS/JS, no framework, no build step (unchanged, by design).

---

## 1. New home-page sections

### "Ses modules" — video strip (`#modules`)
- Horizontal card strip injected after the hero, distinct from the audio reportages ("watch" vs "listen").
- Data in **`modules.json`** (`{url, show, title, place, dur, thumb, video?}`), seeded with the confirmed Yasmine reel + placeholders.
- Cards **open the reel on Instagram in a new tab** (`target="_blank"`).
- Carousel always shows **10 cards** (padded with "Bientôt" slots).

### "En images" — Carnet photo grid (`#gallery`)
- Masonry grid + dynamic country filters + full-screen lightbox (keyboard, prev/next, "Voir sur Instagram" link).
- Data in **`photos.json`**; filter chips build themselves from the tags present; adaptive caption note.
- **Populated with 42 photos curated from her Instagram grid** (see §9 for the method). RFI-branded cards and photos of Raphaelle herself were excluded. Stored at 500px in `photos/rc_*.jpg` — a **stopgap demo set**; the daily API sync (§3) will replace it with full-res once her Creator account is connected.

### Live palette / "ambiance" switcher
- Floating control (bottom-left) with 4 palettes: **Sur le terrain** (default), **L'uniforme**, **Indigo & sable**, **Terre & baie**.
- Swaps the whole-page colour tokens live; choice persists per device and **carries across pages**.
- Default stays "Sur le terrain" until Raphaelle picks.

---

## 2. Reportages — full RFI archive, curated feature set
`build-podcasts.mjs` rewritten to crawl **all** ~9 pages of her RFI author page (785 posts on RFI; ~195 relevant items).
- Reads each item's **audio duration** (JSON-LD), decodes HTML entities, and **collapses re-broadcast duplicates**.
- **Two outputs:** **`episodes.json`** = featured set (~44, what the site renders); **`episodes-all.json`** = full archive (~175) for a future "toute son œuvre" view.
- **Featured rule** ("Broad"): featured if the URL is tagged `reportage`, it's from a reportage/documentary show (*Si loin si proche*, *L'Atelier des médias*), or it's in `curation.json`. Studio talk-show credits (Priorité Santé, Le Conseil Santé) are excluded. Duration can't identify her reportages because RFI credits her on full 30–49 min studio episodes.
- **`curation.json`** `{include, exclude}` is the editorial override (seeded with the original 14; a sanity check enforces they survive).
- **`reportages.html`**: dynamic **Émission + Lieu (country)** filters (combined AND), "+N à écouter aussi" companion badges, "Toute son œuvre sur RFI →" link.

---

## 3. Instagram photo auto-sync pipeline (built; pending activation)
The compliant, durable way to keep the Carnet fed with her own photos.
- **`build-photos.mjs`** — official Instagram Graph API (Instagram Login), downloads full-res into `photos/`, writes `photos.json`. Whole grid (`IG_MAX_PHOTOS`=60), albums flattened, **videos/reels skipped**. Safe: missing/invalid token leaves the grid untouched, exits 0.
- **`.github/workflows/update-photos.yml`** — daily sync + manual run, optional token auto-rotation.
- **`INSTAGRAM-SETUP.md`** — one-time runbook (Creator account → Meta app → `IG_TOKEN` secret).
- **Status:** needs `IG_TOKEN` (Raphaelle authenticates her Creator account). Until then the 42 curated photos (§9) stand in.

---

## 4. Shared design-token system (single source of truth)
- **`tokens.css`** is the ONE place for colours, palette ambiances (`[data-theme]`), type (`--font-*`), spacing, motion tokens (`--ease-*`, `--dur-*`, `--stagger`), and shared UI classes.
- Both pages link it first and reference `var(--token)`; inline `:root` blocks removed; font-family and nav-background literals converted to tokens.
- **Rule going forward:** don't hard-code colours/fonts/timings in a page — add a token.
- **`ui.js`** — shared behaviour: image **skeleton loader** (fade-in on load; shimmer clears on load/error) and **`rcStagger()`** staggered scroll-reveal.

---

## 5. UX polish
- **Staggered "lazy" reveal on every card collection** (home strip, reportages grid, modules, photos) via `rcStagger`.
- **Skeleton + lazy loading** on all covers/photos.
- **10-card carousels** (home strip = 10 latest; modules padded to 10).
- **All card links open in a new tab.**
- **Complete favicon set** (ico / 16 / 32 / apple) on every page.
- **Name spelling** — dropped the tréma site-wide: "Raphaëlle" → **"Raphaelle"** (mixed-case + all-caps nav brand; RFI author-page URLs left URL-encoded).
- **Top nav trimmed** to: À écouter · En vidéo · En images · Reportages · Contact (Manifeste & Profil removed from the nav; sections remain on the page).
- **Fixed:** reportages cards were invisible until a filter was clicked (whole-grid IntersectionObserver threshold could never be met on a tall grid) — now revealed per-card via `rcStagger`.

---

## 6. What's live right now
Home hero + 10-card reportage strip · Ses modules (10) · En images (42 real photos) · palette switcher · Manifeste · Émissions · Profil · Contact — and `reportages.html` with 44 featured reportages, dual filters, and the 175-item archive behind the data. All committed and deployed.

---

## 7. Outstanding / next steps
1. **Connect the Instagram API** (`IG_TOKEN`, per `INSTAGRAM-SETUP.md`) to replace the 42 stopgap photos with an auto-updating full-res feed.
2. **Custom domain** `raphaelle.socialdynamix.co` — Vercel + DNS CNAME (§6 of `CLAUDE.md`).
3. **Activate FormSubmit** — submit the contact form once, click the confirmation email.
4. **Palette** — set the chosen ambiance as default once Raphaelle picks.
5. **Modules** — decide whether to keep 10 slots (mostly "Bientôt") or show only real reels; optional teaser clips.
6. Optionally **top up the Carnet toward 60** — a few originals from her, or the API once live.

---

## 8. Key files
| File | Purpose |
|---|---|
| `index.html` / `reportages.html` | the two pages (inline-rendered from JSON) |
| `tokens.css` | design tokens + palette ambiances + shared UI classes (single source) |
| `ui.js` | shared behaviour: image skeleton + staggered reveal |
| `episodes.json` / `episodes-all.json` | featured reportages (~44) / full archive (~175) |
| `modules.json` / `photos.json` | video modules / Carnet photos |
| `curation.json` | editorial include/exclude for featured reportages |
| `build-podcasts.mjs` / `build-photos.mjs` | RFI crawler / Instagram sync |
| `.github/workflows/*.yml` | daily automation (podcasts + photos) |
| `INSTAGRAM-SETUP.md` | one-time Instagram API setup runbook |
| `photos/` | committed image assets (RFI covers, curated IG photos `rc_*.jpg`) |
| `resources/` | reference component demos (gitignored) |

---

## 9. ♻️ Reusable playbook — pulling photos from an Instagram grid
*Documented because this will recur across projects. This is the manual "grab it now" method; the official API (§3) is the durable production path and should be preferred whenever there's time to set up a token.*

### When to use which
- **Preferred / durable:** the official Instagram API (`build-photos.mjs` pattern). Needs a Business/Creator account + a Meta app + `IG_TOKEN`. Full-res, auto-updating, ToS-compliant. Use for anything permanent.
- **Stopgap / one-off demo:** the browser harvest below. Fragile, manual, lower-res, and against Instagram's ToS — only for the account owner's own content, with their logged-in session and explicit go-ahead. Expect to redo it via the API later.

### Hard prerequisites (all required)
1. **The user logs into Instagram themselves** in their own Chrome (never enter credentials for them). Drive it via the **claude-in-chrome** MCP using that logged-in profile.
2. **Allow downloads for instagram.com in Chrome** *before starting*: `chrome://settings/content/automaticDownloads` → add `https://www.instagram.com` to "Allowed to automatically download multiple files." Without this, every download is silently blocked.
3. Confirm the browser is the **same machine** as the shell environment if you plan to read the downloaded file from `~/Downloads`.

### The pitfalls that cost the most time (avoid these)
- **The public grid is login-walled** — a logged-out browser sees zero posts. Must use the user's logged-in session.
- **Image URLs are redacted** by the extension (signed query strings) — you cannot read `img.src`. Instead `fetch()` the image in-page and work with the **bytes/blob** (that's allowed and is what you actually want).
- **Instagram's CSP** blocks `fetch()` to `localhost` and to `data:` URLs. So: no posting to a local upload server; and to re-encode a stored dataURL, load it via `new Image()` (img-src allows data:), not `fetch()`.
- **The grid is virtualised** — off-screen posts leave the DOM. You must fetch each image *while it's on screen*, interleaving scroll + fetch. Accumulate into a `window.__imgs` array keyed by a `Set` of seen permalinks.
- **Synthetic scroll doesn't paginate** — `window.scrollTo` won't load more. Use the computer tool's **real wheel scroll** to trigger Instagram's loader.
- **The tab crashes / closes if you hold too much in memory** — storing full-res base64 for dozens of posts OOMs the renderer (symptoms: frozen screenshots, tab vanishes, `window.__imgs` lost). **Downscale on capture (~500px, JPEG q0.72)** and it survives.
- **Downloads:** the *first* automatic download may slip through, then Chrome blocks the rest until the site is allow-listed (prereq #2). A **single bundled file** download is far more reliable than 50 individual ones.

### The flow that worked
1. Navigate the claude-in-chrome tab to the profile (inherits the logged-in session). Confirm not login-walled.
2. Loop: **real wheel-scroll** (computer tool) → run an in-page pass that, for each new `a[href*="/p/"]` post, `fetch`es the image → `createImageBitmap` → draw to a canvas **downscaled to ~500px** → `canvas.toDataURL('image/jpeg',0.72)` → push `{permalink, b64}` into `window.__imgs` (dedupe by permalink). Skip `/reel/` (those are the RFI collabs).
3. Repeat until you have enough (~60 raw to net ~40 clean).
4. **Bundle + download once:** `JSON.stringify(window.__imgs)` → `Blob` → `<a download>` click. One file (`rc_photos.json`) lands in Downloads.
5. **Decode locally** (Node): base64 → `ig_NN.jpg`, and generate a small contact-sheet `index.html`.
6. **Filter visually in a stable browser** (the in-app Claude Browser, *not* the flaky IG tab): serve the contact sheet, screenshot it, and exclude by eye — here that meant RFI-branded cards (red *rfi* logo / text overlays baked into the pixels), RFI-mic shots, and any photo of the person themselves (shot by others → copyright). No DOM signal exists for these; it must be the eye.
7. Copy the kept files into `photos/`, write `photos.json` (`{img, permalink, cap, place, tag}`), commit, deploy.

### Result this time
59 raw pulled → **42 kept** (17 excluded: RFI-branded + photos of her). Netting exactly N clean is unpredictable because a reporter's feed is heavy on branded content; plan to top up from originals or the API.

---

*Commits this cycle: `4c60642` → current `main`.*

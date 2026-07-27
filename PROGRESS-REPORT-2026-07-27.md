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
- Cards now **open the reel on Instagram in a new tab** (was an in-page embed lightbox; changed per request so all card media opens `_blank`).
- Carousel always shows **10 cards** (padded with "Bientôt" slots).

### "En images" — Carnet photo grid (`#gallery`)
- Masonry grid + dynamic country filters + full-screen lightbox (keyboard, prev/next, "Voir sur Instagram" link).
- Data in **`photos.json`**; filter chips build themselves from the tags present; adaptive caption note.
- Currently shows **7 sample photos** — her real photos are the one outstanding item (see §7).

### Live palette / "ambiance" switcher
- Floating control (bottom-left) with 4 palettes: **Sur le terrain** (default), **L'uniforme**, **Indigo & sable**, **Terre & baie**.
- Swaps the whole-page colour tokens live; choice persists per device and **carries across pages**.
- Default stays "Sur le terrain" until Raphaelle picks.

---

## 2. Reportages — full RFI archive, curated feature set
`build-podcasts.mjs` rewritten to crawl **all** ~9 pages of her RFI author page (785 posts total on RFI; ~195 relevant items).
- Reads each item's **audio duration** (JSON-LD), decodes HTML entities, and **collapses re-broadcast duplicates**.
- **Two outputs:**
  - **`episodes.json`** — the **featured set (~44)** the site renders.
  - **`episodes-all.json`** — the **full archive (~175)** for a future "toute son œuvre" view.
- **Featured rule** (decided together — "Broad"): a piece is featured if its URL is tagged `reportage`, it's from a reportage/documentary show (*Si loin si proche*, *L'Atelier des médias*), or it's in `curation.json`. Studio talk-show credits (Priorité Santé episodes, Le Conseil Santé) are excluded. Duration alone can't identify her reportages because RFI credits her on full 30–49 min studio episodes.
- **`curation.json`** `{include, exclude}` is the editorial override (seeded with the original 14 so they always survive; a sanity check enforces it).
- **`reportages.html`** now has dynamic **Émission + Lieu (country)** filters (combined AND), "+N à écouter aussi" companion badges, and a "Toute son œuvre sur RFI →" link.

---

## 3. Instagram photo auto-sync pipeline (built; pending activation)
The compliant, durable way to fill the Carnet with her own photos.
- **`build-photos.mjs`** — pulls her own photos via the official Instagram Graph API (Instagram Login), downloads full-res into `photos/`, writes `photos.json`. Whole grid (newest `IG_MAX_PHOTOS`=60), albums flattened, **videos/reels skipped** (so no RFI reel collabs). Safe by design: missing/invalid token leaves the grid untouched and exits 0.
- **`.github/workflows/update-photos.yml`** — daily sync + manual run, commits changes, optional token auto-rotation.
- **`INSTAGRAM-SETUP.md`** — one-time runbook (Creator account → Meta app → `IG_TOKEN` secret).
- **Status: needs the `IG_TOKEN` secret** (Raphaelle authenticates her Creator account). Until then the gallery shows the 7 samples.

---

## 4. Shared design-token system (single source of truth)
- **`tokens.css`** is now the ONE place for colours, palette ambiances (`[data-theme]`), type (`--font-*`), spacing, motion tokens (`--ease-*`, `--dur-*`, `--stagger`), and shared UI classes.
- Both `index.html` and `reportages.html` link it first and reference `var(--token)`; inline `:root` blocks removed; font-family and nav-background literals converted to tokens.
- **Rule going forward:** don't hard-code colours/fonts/timings in a page — add a token.
- **`ui.js`** — shared behaviour loaded by both pages: image **skeleton loader** (fade-in on load; shimmer clears on load/error) and **`rcStagger()`** staggered scroll-reveal.

---

## 5. UX polish
- **Staggered "lazy" reveal on every card collection** — home reportage strip, reportages grid, modules strip, photos grid — each card animates in as it scrolls into view (`rcStagger`).
- **Skeleton + lazy loading** on all covers/photos (fixes blank-while-loading on slow connections). Reportages grid covers are `loading="lazy"`; home strip stays eager (scroll-snap gotcha).
- **10-card carousels** (home strip = 10 latest; modules padded to 10).
- **All card links open in a new tab** (`target="_blank"`) — home strip, reportages cards + latest, and modules.
- **Complete favicon set** (ico / 16 / 32 / apple-touch) on every page.
- **Name spelling** — dropped the tréma site-wide: "Raphaëlle" → **"Raphaelle"** (both mixed-case and the all-caps nav brand; the RFI author-page URLs are left URL-encoded and untouched).

### Fixed
- **Reportages cards were invisible** until a filter was clicked — the whole-grid reveal used an IntersectionObserver threshold that a 44-card grid could never meet. Now revealed per-card via `rcStagger`.

---

## 6. What's live right now
Home hero + 10-card reportage strip · Ses modules (10) · En images (7 samples) · palette switcher · Manifeste · Émissions · Profil · Contact — and `reportages.html` with 44 featured reportages, dual filters, and the archive of 175 behind the data. All committed and deployed.

---

## 7. Outstanding / next steps
1. **Fill the Carnet with her real photos** — either (a) she/you send ~60 originals (a folder or Drive/Dropbox link) and I wire them in, or (b) connect the Instagram API (`IG_TOKEN`, per `INSTAGRAM-SETUP.md`). *Note: an attempt to scrape her public grid was abandoned — Chrome blocks downloads from instagram.com at the browser level, so it wasn't reliable.*
2. **Custom domain** `raphaelle.socialdynamix.co` — add in Vercel + DNS CNAME (§6 of `CLAUDE.md`).
3. **Activate FormSubmit** — submit the contact form once and click the confirmation email so leads arrive.
4. **Palette** — apply the chosen ambiance as the default once Raphaelle picks (currently a live preview only).
5. **Modules** — decide whether to keep 10 slots (mostly "Bientôt") or show only real reels until more are posted; optional teaser clips.

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
| `resources/` | reference component demos (gitignored) |

*Commits this cycle: `4c60642` → `72c37bf`.*

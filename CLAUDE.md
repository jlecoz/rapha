# Raphaëlle Constant — site — project kickoff (for Claude Code)

Rename this to **`CLAUDE.md`** in the repo root so Claude Code auto-loads it as context. It's the single brief to (1) stand the site up in its own repo and (2) add two new sections — **"Ses modules"** and **"En images"** — then publish at a subdomain.

---

## 0. Current state (already done by the user)
- **Local repo:** `~/Documents/GitHub/rapha/` — created, pushed to GitHub, **connected in Vercel**.
- **Vercel deploy URL:** https://raphaelle-constant.vercel.app/ (Vercel project: `raphaelle-constant`).
- **Target custom domain:** `raphaelle.socialdynamix.co` (still to add in Vercel + DNS — §6).
- The repo is empty/near-empty. The job is to **seed it, inject two new sections, and ship** — the infra already exists.
- ⚠️ The **device bridge is not connected to this chat**, so all commands below are for **Claude Code to run inside the repo** (or paste into a terminal).

---

## 1. ★ FIRST TASK — connect it all in Claude Code, then inject "Modules" + "En images"
Do these in order, in `~/Documents/GitHub/rapha/`.

### 1a. Seed the repo from the live source (both repos are local → it's a copy)
```bash
cd ~/Documents/GitHub/rapha
cp -R ~/Documents/GitHub/social-dynamix/public/rapha/. .   # trailing /. also copies .github, dotfiles
grep -l "hero-title" index.html          # confirm the MOTION index (hero tunes in) is the one copied
grep -c "__LEAD_EMAIL__" index.html       # must be 0; if not: replace with jonathan.lecoz@gmail.com
grep -rn "/rapha/" . --include=*.html --include=*.json --include=*.js   # remove any subfolder prefixes (now root-served)
```
The canonical files: `index.html` (motion home), `reportages.html`, `episodes.json`, `build-podcasts.mjs`, `package.json`, `vercel.json`, the favicons, `apple-touch-icon.png`, `.github/workflows/update-podcasts.yml`. Clean `vercel.json` of any `/rapha` rewrites (it's a buildless static site).

### 1b. Add the new component files to the repo
The user has these as downloads (delivered this session) — copy them in: `modules.html`, `modules.json`, `discover-modules.mjs`, `MODULES-HANDOFF.md`, `photos.html`, `palette-playground.html`, `palette-garderobe.html`, and this file as `CLAUDE.md`. Keep the standalone `modules.html` / `photos.html` as reference; the real work is lifting their sections into `index.html` (next).

### 1c. Inject the **"Ses modules"** section into `index.html`
The **video strip** — deliberately distinct from the audio reportage posters (16:9 thumbnail + info panel = "watch"; poster = "listen"). Everything you need is in **`modules.html`** (component + `MODULES-HANDOFF.md` for notes).
- **Where:** a new `<section class="modules">` **immediately after the hero's reportage scroll strip** (flow: *listen to the latest reportages → watch the short modules → manifeste*). Also add a **nav link** "En vidéo" / "Modules".
- **What to lift from `modules.html`:** the `.modules` + `.modcard` + lightbox CSS into the page `<style>`; the `<section class="modules">` + `<div class="lb">` markup; and the module `<script>` (SEED + `fetch('modules.json')` + card render + IntersectionObserver video play/pause + the **official Instagram `embed.js` lightbox**). It already inherits the site tokens.
- **Data:** ship **`modules.json`** as an external file (already seeded with the confirmed Yasmine reel `/reel/DbQcpWWji7Q/` + "Bientôt" placeholder slots). Each entry: `{url, show, title, place, dur, thumb, video?}`. Adding a module = paste a reel URL (10-sec workflow in `MODULES-HANDOFF.md`).
- **Cards** open the real reel in a lightbox via Instagram's official embed (no API token). The optional `video` field autoplays a short muted self-hosted teaser clip in the card (Instagram won't serve stable video URLs; re-hosting a trimmed RFI clip wants a quick rights nod).

### 1d. Inject the **"En images"** (Carnet) section into `index.html`
The **photo grid** — masonry, filter-by-country, full-size lightbox with prev/next. Everything is in **`photos.html`**.
- **Where:** a new `<section class="gallery">` **after "Ses modules"** (or after Manifeste, before Profil). Add a **nav link** "En images".
- **What to lift from `photos.html`:** the `.gallery` + `.grid`/`.cell` (CSS-columns masonry) + `.filters` + lightbox CSS; the markup; and the `<script>` (`PHOTOS` list → `build()` → filter → lightbox with keyboard/prev/next).
- **Data:** externalise the inline `PHOTOS` array into **`photos.json`** and `fetch()` it (so it's editable like `episodes.json`). Currently holds **7 real sample photos** (grabbed from Instagram) + a `TARGET` of 40. **The real ~40 come from Raphaëlle's original files** (full-res, rights-clean), grouped by country to match the filters — extend `photos.json` when they arrive.

### 1e. Ship + verify
```bash
git add -A && git commit -m "Standalone site + Ses modules + En images sections" && git push
```
Vercel auto-builds → open **https://raphaelle-constant.vercel.app/**: hero plays, reportage covers load, the **modules strip** scrolls and a card opens the reel in the lightbox, the **photo grid** filters + opens in a lightbox, contact form submits (then click the FormSubmit activation email). Then do the subdomain (§6).

---

## 2. What this is
A static "listening-experience" website for **Raphaëlle Constant**, an independent international radio reporter for **RFI** (Africa-focused audio reportages). Goal: get visitors to press play and *feel* other people's lives. Secondary goal: a lead-gen contact form. Design-forward (cinematic hero, custom motion), not a CMS. **Pure static HTML + CSS + JS — no framework, no build step. Keep it that way.**

---

## 3. Pages & architecture
- **`index.html`** — home: sticky nav → hero (eyebrow equalizer, H1 "Écoutez le monde." tuning in from radio static, typed subtitle, lede) → **horizontal strip of the 6 latest reportages** (link to RFI) → **[NEW] Ses modules** (video strip) → **[NEW] En images** (photo grid) → **Manifeste** → **Profil** → **Contact** (FormSubmit). Portraits are **base64-embedded**.
- **`reportages.html`** — full filterable collection (by show; latest first). Cards **JS-rendered** from `episodes.json` with an inline `SEED` fallback.
- Both pages share the **motion system**: Lenis smooth scroll (unpkg CDN) + IntersectionObserver reveal engine + cinematic radio hero. Degrades gracefully under `prefers-reduced-motion` and if the CDN is blocked.

---

## 4. Design system
- **Fonts (Google):** Anton (display), Oswald (uppercase labels/kickers), Newsreader (body).
- **Palette tokens (current — "Sur le terrain"):** `--ink:#171310` · `--paper:#FBF6EC` · `--sand:#EFE2CA` · `--gold:#E0A24E` · `--ochre:#B96B34` · `--red:#D2321F` (on-air accent) · `--olive:#7C7A45`. In `tokens.css`; pages currently inline their own `:root`. When convenient, wire both pages to `tokens.css` so a palette change is one file.
- **Palette choice pending:** 3 alternatives proposed in `palette-playground.html` / `palette-garderobe.html` (the wardrobe-derived one: black+camel+cream with a berry or teal jewel accent). **Keep the current palette until Raphaëlle picks**; applying = swap the `:root` tokens.
- **Motion signature = "radio":** equalizer label ticks, headline word-rise, portrait blur-resolve, red live-dot. Full spec: `MOTION-SYSTEM-PORTABLE.md`.

---

## 5. Data model & automation
- **`episodes.json`** (14 reportages) — `{id,title,show,showKey,place,date,url,image,blurb}`; `image` = RFI CDN cover (`s.rfi.fr/...w:1024...`, hotlink OK). Refreshed by **`build-podcasts.mjs`** (crawls her RFI author page) via **`.github/workflows/update-podcasts.yml`** daily; **exits 0 on failure** so it never breaks a deploy. Confirm the Action runs from the new repo.
- **`modules.json`** — the video modules (Instagram Reels). Curated/manual (paste a reel URL). Seeded with the Yasmine collab reel + placeholders.
- **`photos.json`** — the "En images" gallery. Externalise from `photos.html`; 7 real samples now, ~40 originals to come.
- Optional `discover-modules.mjs` — best-effort auto-discovery of her reels from her public grid. **Unreliable** (Instagram fights scraping; 401s from CI). Keep the manual paste as source of truth; run the spike only as a bonus.

---

## 6. Deploy `raphaelle.socialdynamix.co`
Vercel project already exists (`raphaelle-constant`, auto-deploying on push). To add the custom domain:
1. Vercel → project `raphaelle-constant` → **Settings → Domains → Add** `raphaelle.socialdynamix.co`.
2. **DNS:** add a **CNAME** `raphaelle` → `cname.vercel-dns.com` wherever `socialdynamix.co` DNS lives (if the domain's nameservers are on Vercel, it auto-configures — just confirm). A subdomain can point at this project without disturbing the apex or `jonny.socialdynamix.co`.
3. Wait for SSL, verify `https://raphaelle.socialdynamix.co`, then **activate FormSubmit** (submit the contact form once, click the email).
4. Only after the subdomain is verified: retire `social-dynamix/public/rapha` or leave a redirect `socialdynamix.co/rapha` → the subdomain.
- **Vercel settings to verify:** Framework Preset = **Other**, Build Command = **empty**, Output/Root = repo root (buildless static). If Vercel auto-guessed a framework, switch to Other.

---

## 7. Backlog (after the first task)
- Apply the **chosen palette** site-wide (once Raphaëlle picks from the playgrounds).
- Fill the **En images** grid with her **~40 original photos**, grouped by country.
- Real **module durations** + optional **autoplay teaser clips** (she exports short muted clips; rights nod from RFI).
- Confirm with her/RFI she's happy featuring the RFI-branded modules.

---

## 8. Gotchas / constraints (learned the hard way)
- **Cover images must be eager-loaded** — `loading="lazy"` inside the scroll-snap strip made browsers defer them forever. Use `decoding="async"`.
- **Portraits are base64** in `index.html` (broke as relative files on the subfolder). Fine embedded; can re-externalise now it's a clean root domain.
- **Lenis + synthetic scroll:** automation's synthetic wheel events don't drive Lenis; real users are fine. Not a bug.
- **A headless/sandbox browser can't reach RFI CDN / unpkg / Instagram** — covers show blank, the IG embed shows its fallback. All fine in a real browser; don't "fix" from a headless screenshot.
- **Modules are RFI-owned collabs** — the official Graph API on *her* account won't return them; that's why the strip uses per-reel official embeds from a curated list, not an API pull.
- Keep it **framework-free and buildless**.

---

## 9. Companion docs (in the project / delivered this session)
`MODULES-HANDOFF.md` (modules strip + auto-discovery notes) · `MOTION-SYSTEM-PORTABLE.md` (motion spec) · `RAPHAELLE-EVOLUTION-NOTES.md` (research + decisions: socials, palettes, modules feasibility) · `raphaelle-cursor-prompts.md` (earlier motion prompts). Standalone component demos to lift from: `modules.html`, `photos.html`, `palette-playground.html`, `palette-garderobe.html`.

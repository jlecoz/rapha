# "En images" — connect the Instagram auto-sync

The Carnet grid renders from `photos.json`. `build-photos.mjs` (run daily by
`.github/workflows/update-photos.yml`) pulls Raphaëlle's own Instagram photos via
the **official** Instagram API, downloads each **full-resolution** image into
`photos/`, and rewrites `photos.json`. New posts then appear on the site
automatically. Until the token below is set, the grid stays on the 7 sample
photos (nothing breaks).

> Why this and not scraping: Instagram's old Basic Display API was shut down
> 2024-12-04, and scraping the public grid is blocked from CI and violates the
> ToS. The official API is the only stable path — and it returns her own photos
> at full resolution. (The RFI "modules"/reels are RFI-owned, so they stay a
> curated list in `modules.json`; this sync is photos only.)

## One-time setup (~15 min, needs a human for the login step)

### 1. Make the account "professional"
In the Instagram app on her phone: **Settings → Account type and tools →
Switch to professional account → Creator** (or Business). Free and reversible;
it doesn't change how her profile looks. The API returns **nothing** for
personal accounts, so this step is required.

### 2. Create a Meta app with "Instagram API with Instagram Login"
1. Go to <https://developers.facebook.com/apps> → **Create app**.
2. Pick a use case that offers **Instagram** (e.g. "Other" → **Business**), name it (e.g. "Raphaelle site").
3. In the app dashboard: **Add product → Instagram → "API setup with Instagram login"**.
4. Under **Business login settings / Generate token**, click **Add account**, log in as **@rapha_constant**, and authorize. Ensure the scope includes **`instagram_business_basic`** (read profile + media).
5. Click **Generate token** for that account. Copy the token.

*No App Review is needed* — you're reading your own connected account in
development mode, which is allowed.

The generated token is **long-lived (~60 days)**. `build-photos.mjs` refreshes it
on every run (see step 4 for auto-rotation).

### 3. Add the token to GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**:
- Name: `IG_TOKEN`
- Value: the token from step 2

### 4. (Optional but recommended) auto-rotate the token
Without this, the token expires in ~60 days and you'd re-paste a fresh one.
To let the workflow rotate it itself:
1. Create a **fine-grained Personal Access Token** (<https://github.com/settings/tokens>) scoped to **this repo only**, with **Secrets: Read and write** permission.
2. Add it as a repo secret named **`GH_PAT`**.

The daily job then writes the refreshed token back into `IG_TOKEN` automatically.

### 5. Test it
Repo → **Actions → "Update photos from Instagram" → Run workflow**. It should
commit `photos.json` + the images under `photos/`, and the live site updates
within a minute of the push. If the token is wrong/missing, the job logs a
warning and leaves the grid untouched (never breaks the site).

## How she controls it, day to day
- **Just post.** New photos (and photo carousels) flow into the Carnet on the
  next daily run. Videos/reels are skipped.
- **Country filter chips appear automatically** when she adds a place hashtag in
  the caption: `#tchad`, `#cameroun`, `#senegal`, `#cotedivoire`, `#mali`,
  `#niger`, `#burkinafaso`, `#benin`, `#rdc`, `#gabon`, `#maroc`, `#paysage`.
  Photos with no place hashtag still show under "Tout". (Filter bar hides itself
  until at least two places exist.)
- The visible caption is her Instagram caption with hashtags/@mentions stripped
  and trimmed to ~100 characters. Each photo's lightbox links back to the post.

## Knobs
- **How many photos:** `IG_MAX_PHOTOS` (default **60**, newest first). Raise it in
  `update-photos.yml` (add `IG_MAX_PHOTOS: "200"` under the step's `env:`) to keep
  more of the grid; higher = more images committed to the repo.
- Deleting a post on Instagram removes it from the grid on the next run (the file
  is rebuilt fresh); the already-downloaded image file stays in `photos/` but is
  no longer referenced.

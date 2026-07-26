#!/usr/bin/env node
/**
 * build-photos.mjs — Raphaëlle Constant / Instagram "Carnet" sync
 * --------------------------------------------------------------
 * Pulls Raphaëlle's own Instagram photos via the OFFICIAL Instagram API
 * (Instagram API with Instagram Login — graph.instagram.com), downloads each
 * full-resolution image into `photos/`, and writes `photos.json`. The website
 * renders "En images" from that JSON — so when she posts a new photo, this
 * script picks it up and the grid updates itself. Nobody edits the HTML.
 *
 * Why the official API (not scraping):
 *   - Instagram's Basic Display API was shut down 2024-12-04.
 *   - Scraping the public grid 401s from CI (datacenter IPs) and breaks the ToS.
 *   - The Graph API returns HER OWN media at full res (media_url), which is
 *     exactly this case. (The RFI "modules"/reels are RFI-owned, so they stay a
 *     curated list — see modules.json. This script is photos only.)
 *
 * Prerequisites (one-time — see INSTAGRAM-SETUP.md):
 *   - @rapha_constant converted to a Business or Creator account.
 *   - A Meta app using "Instagram API with Instagram Login".
 *   - A long-lived access token, provided as the IG_TOKEN env var.
 *
 * Run locally:   IG_TOKEN=xxxx node build-photos.mjs
 * Run in CI:     see .github/workflows/update-photos.yml (daily)
 * Requirements:  Node 18+ (global fetch). No dependencies.
 *
 * Safe by design: if IG_TOKEN is missing or the API fails, the existing
 * photos.json is left untouched and the script exits 0 (never wipes the grid,
 * never breaks a deploy).
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const OUT_JSON   = "photos.json";
const PHOTOS_DIR = "photos";
const TOKEN      = process.env.IG_TOKEN || "";
const GRAPH      = "https://graph.instagram.com";
const MAX_PHOTOS = Number(process.env.IG_MAX_PHOTOS || 60); // newest N kept in the grid (raise for "everything")
const TOKEN_OUT  = "ig-token.txt";                          // refreshed token for the workflow to rotate (gitignored)

/* Country/topic hashtags → {tag used by the filter, label shown}. Only these become
   filter chips; other hashtags are ignored so the filter bar stays about places.
   She controls a photo's country simply by writing e.g. #tchad in the caption. */
const PLACE_TAGS = {
  tchad:        "Tchad",
  cameroun:     "Cameroun",
  senegal:      "Sénégal",       sénégal: "Sénégal",
  cotedivoire:  "Côte d'Ivoire", côtedivoire: "Côte d'Ivoire", coteivoire: "Côte d'Ivoire",
  mali:         "Mali",
  niger:        "Niger",
  burkinafaso:  "Burkina Faso",  burkina: "Burkina Faso",
  benin:        "Bénin",         bénin: "Bénin",
  rdc:          "RD Congo",      congo: "RD Congo",
  gabon:        "Gabon",
  maroc:        "Maroc",
  paysage:      "Paysages",      paysages: "Paysages",
};

const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

async function getJSON(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `${r.status} ${url.split("?")[0]}`);
  return j;
}

// Walk /me/media with pagination until we have enough image items.
async function fetchMedia() {
  const fields =
    "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,children{media_url,media_type,id}";
  let url = `${GRAPH}/me/media?fields=${encodeURIComponent(fields)}&limit=50&access_token=${TOKEN}`;
  const items = [];
  let pages = 0;
  while (url && items.length < MAX_PHOTOS && pages < 12) {
    const page = await getJSON(url);
    for (const m of page.data || []) items.push(m);
    url = page.paging?.next || "";
    pages++;
  }
  return items;
}

// Flatten a media node into individual downloadable images (albums → children).
export function toImages(m) {
  const out = [];
  if (m.media_type === "IMAGE" && m.media_url) {
    out.push({ id: m.id, url: m.media_url, node: m });
  } else if (m.media_type === "CAROUSEL_ALBUM") {
    (m.children?.data || []).forEach((c, i) => {
      if (c.media_type === "IMAGE" && c.media_url) out.push({ id: `${m.id}_${i}`, url: c.media_url, node: m });
    });
  }
  // VIDEO / REELS are intentionally skipped (those live in modules.json).
  return out;
}

export function deriveTag(caption) {
  const tags = [...(caption || "").matchAll(/#([\p{L}0-9_]+)/gu)].map((x) => stripAccents(x[1]).toLowerCase());
  for (const t of tags) if (PLACE_TAGS[t]) return { tag: t.replace(/[^a-z0-9]/g, ""), label: PLACE_TAGS[t] };
  return { tag: "", label: "" };
}

function frMonth(iso) {
  const M = ["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
  const d = new Date(iso);
  return isNaN(d) ? "" : `${M[d.getMonth()]} ${d.getFullYear()}`;
}

export function cleanCaption(caption) {
  let c = (caption || "")
    .replace(/#[\p{L}0-9_]+/gu, "")      // drop hashtags
    .replace(/@[\p{L}0-9_.]+/gu, "")      // drop @mentions
    .replace(/\s+/g, " ")
    .trim();
  if (c.length > 100) c = c.slice(0, 99).replace(/\s+\S*$/, "") + "…";
  return c;
}

async function download(url, id) {
  const file = `${PHOTOS_DIR}/ig_${id}.jpg`;
  if (existsSync(file)) return file;               // already have it — skip re-download
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} image ${id}`);
  if (!existsSync(PHOTOS_DIR)) await mkdir(PHOTOS_DIR, { recursive: true });
  await writeFile(file, Buffer.from(await r.arrayBuffer()));
  return file;
}

async function refreshToken() {
  try {
    const j = await getJSON(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`);
    if (j.access_token) {
      await writeFile(TOKEN_OUT, j.access_token);
      const days = Math.round((j.expires_in || 0) / 86400);
      console.log(`Token refreshed (valid ~${days} days). Wrote ${TOKEN_OUT} for rotation.`);
    }
  } catch (e) {
    console.warn("Token refresh skipped:", e.message);
  }
}

function keepExisting(reason) {
  // never wipe the grid, never fail the deploy. Return cleanly (no process.exit,
  // which can trip a libuv assertion on Windows if a socket is still closing).
  console.warn(`${reason} — leaving ${OUT_JSON} untouched.`);
}

async function main() {
  if (!TOKEN) return keepExisting("No IG_TOKEN set");

  console.log("Fetching Instagram media…");
  let media;
  try {
    media = await fetchMedia();
  } catch (e) {
    return keepExisting(`Instagram API error: ${e.message}`);
  }
  console.log(`Got ${media.length} media items.`);

  const photos = [];
  for (const m of media) {
    for (const img of toImages(m)) {
      if (photos.length >= MAX_PHOTOS) break;
      try {
        const local = await download(img.url, img.id);
        const { tag, label } = deriveTag(m.caption);
        photos.push({
          img: local,
          cap: cleanCaption(m.caption) || label || "Instagram",
          place: label || frMonth(m.timestamp),
          tag,
          permalink: m.permalink || "",
          ts: m.timestamp || "",
        });
        console.log(" ✓", local);
      } catch (e) {
        console.warn(" ✗", img.id, e.message);
      }
    }
  }

  if (!photos.length) return keepExisting("No photos returned");

  photos.sort((a, b) => (a.ts < b.ts ? 1 : -1)); // newest first
  const out = {
    source: "instagram",
    account: "https://www.instagram.com/rapha_constant/",
    updated: new Date().toISOString().slice(0, 10),
    photos,
  };
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${OUT_JSON} with ${photos.length} photos.`);

  await refreshToken();
}

// Run only when invoked directly (so the pure helpers above can be unit-tested via import).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exitCode = 0; });
}

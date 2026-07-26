#!/usr/bin/env node
/**
 * build-podcasts.mjs — Raphaëlle Constant / RFI podcast crawler
 * -------------------------------------------------------------
 * Crawls Raphaëlle's RFI author page, finds every reportage, pulls each
 * episode's cover image (og:image), downloads the covers locally, and writes
 * `episodes.json`. The website renders from that JSON — so when RFI publishes
 * a new episode, this script picks it up and the site updates itself. Nobody
 * ever edits the HTML/CSS.
 *
 * Run locally:   node build-podcasts.mjs
 * Run in CI:     see .github/workflows/update-podcasts.yml (daily)
 *
 * Requirements: Node 18+ (global fetch). No dependencies.
 *
 * NOTE ON CORS: a browser cannot fetch rfi.fr directly (RFI sends no
 * cross-origin header), which is why the crawling happens here, at build time,
 * on a server/CI — not in the visitor's browser.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const AUTHOR_URL = "https://www.rfi.fr/fr/auteur/rapha%C3%ABlle-constant/";
const OUT_JSON = "episodes.json";
const COVERS_DIR = "covers";
const COVER_WIDTH = 1024; // RFI CDN supports /w:NNN/ resizing

// Only these shows are treated as reportages (skip short studio companions
// like "Le Conseil Santé"). Map the RFI URL slug -> {show label, filter key}.
const SHOWS = {
  "priorité-santé":         { show: "Priorité Santé",        key: "sante"  },
  "priorit%c3%a9-sant%c3%a9":{ show: "Priorité Santé",       key: "sante"  },
  "si-loin-si-proche":      { show: "Si loin si proche",     key: "recit"  },
  "8-milliards-de-voisins": { show: "8 milliards de voisins", key: "voisins" },
  "7-milliards-de-voisins": { show: "8 milliards de voisins", key: "voisins" },
  "atelier-des-médias":     { show: "L'Atelier des médias",  key: "medias" },
  "atelier-des-m%c3%a9dias":{ show: "L'Atelier des médias",  key: "medias" },
};

const UA = "Mozilla/5.0 (compatible; RaphaelleSiteBot/1.0)";

async function getText(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function decodeSlug(seg) {
  try { return decodeURIComponent(seg).toLowerCase(); } catch { return seg.toLowerCase(); }
}

// Pull the list of episode links (show slug + episode slug) from the author page.
function parseAuthorLinks(html) {
  const found = new Map(); // href -> {showSlug, dateSlug, url}
  const re = /href="(\/fr\/podcasts\/([^\/"]+)\/(\d{8}-[^"]+))"/g;
  let m;
  while ((m = re.exec(html))) {
    const [, href, showSlug, epSlug] = m;
    const key = decodeSlug(showSlug);
    if (!SHOWS[key]) continue;
    if (found.has(href)) continue;
    const dateSort = epSlug.slice(0, 8);
    found.set(href, {
      showSlug: key,
      sort: dateSort,
      url: "https://www.rfi.fr" + href,
      id: `${dateSort}-${decodeSlug(epSlug).replace(/[^a-z0-9]+/g, "-").slice(9, 60).replace(/^-|-$/g, "")}`,
    });
  }
  return [...found.values()];
}

function meta(html, prop) {
  const r1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const r2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i");
  return (html.match(r1) || html.match(r2) || [])[1] || "";
}

function frDate(iso) {
  // "2026-06-15..." -> "Juin 2026"
  const M = ["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${M[d.getMonth()]} ${d.getFullYear()}`;
}

async function downloadCover(url, id) {
  try {
    const sized = url.replace(/\/w:\d+\//, `/w:${COVER_WIDTH}/`);
    const r = await fetch(sized, { headers: { "User-Agent": UA } });
    if (!r.ok) return url; // fall back to hotlinking the CDN url
    if (!existsSync(COVERS_DIR)) await mkdir(COVERS_DIR, { recursive: true });
    const buf = Buffer.from(await r.arrayBuffer());
    const file = `${COVERS_DIR}/${id}.jpg`;
    await writeFile(file, buf);
    return file; // self-hosted -> always displays, no hotlink/referrer issues
  } catch { return url; }
}

async function main() {
  // Keep any hand-written blurbs from the existing file.
  let prev = {};
  if (existsSync(OUT_JSON)) {
    try {
      const j = JSON.parse(await readFile(OUT_JSON, "utf8"));
      for (const e of j.episodes || []) prev[e.url] = e;
    } catch {}
  }

  console.log("Fetching author page…");
  const authorHtml = await getText(AUTHOR_URL);
  const links = parseAuthorLinks(authorHtml);
  console.log(`Found ${links.length} reportage links.`);

  const episodes = [];
  for (const l of links) {
    const meta0 = SHOWS[l.showSlug];
    try {
      const html = await getText(l.url);
      const title = (meta(html, "og:title") || "").replace(/\s*[-–]\s*RFI.*$/i, "").trim();
      const image = meta(html, "og:image").split("?")[0];
      const published = meta(html, "article:published_time");
      const cover = image ? await downloadCover(image, l.id) : "";
      const old = prev[l.url] || {};
      episodes.push({
        id: l.id,
        title: title || old.title || l.id,
        show: meta0.show,
        showKey: meta0.key,
        place: old.place || "",          // optional editorial field, preserved if set
        date: frDate(published) || old.date || "",
        sort: l.sort,
        url: l.url,
        image: cover,
        blurb: old.blurb || "",          // keep any hand-written one-liner
      });
      console.log(" ✓", title || l.id);
    } catch (e) {
      console.warn(" ✗", l.url, e.message);
      if (prev[l.url]) episodes.push(prev[l.url]); // keep previous data on failure
    }
  }

  episodes.sort((a, b) => (a.sort < b.sort ? 1 : -1)); // newest first
  const out = {
    updated: new Date().toISOString().slice(0, 10),
    source: AUTHOR_URL,
    episodes,
  };
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${OUT_JSON} with ${episodes.length} episodes.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

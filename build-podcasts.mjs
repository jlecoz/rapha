#!/usr/bin/env node
/**
 * build-podcasts.mjs — Raphaëlle Constant / RFI reportage crawler
 * --------------------------------------------------------------
 * Crawls ALL pages of Raphaëlle's RFI author page, reads each item's audio
 * duration, and classifies flagship long-format reportages vs short companion
 * segments (e.g. 2-3-min "Le Conseil Santé" Q&As that ride alongside a big
 * reportage). Writes TWO files:
 *
 *   episodes.json      — the FEATURED set: flagship long-format reportages only
 *                        (newest first). This is what the website renders.
 *   episodes-all.json  — the FULL archive: every item, with durationSec / format /
 *                        companions, for a future "toute son œuvre" view.
 *
 * Editorial control: curation.json { include:{url:true}, exclude:{url:true} }
 * force-features or force-hides fuzzy cases — it always wins over the heuristic.
 * The original 14 hand-picked reportages are seeded into include{} so they can
 * never be dropped by a duration threshold.
 *
 * Cheap daily runs: only NEW article URLs are fetched (diffed against
 * episodes-all.json); known items reuse stored data. First full run ≈ ~350
 * article fetches once, with a politeness delay.
 *
 * Run locally:   node build-podcasts.mjs
 * Run in CI:     .github/workflows/update-podcasts.yml (daily). Node 18+, no deps.
 */

import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const AUTHOR_BASE = "https://www.rfi.fr/fr/auteur/rapha%C3%ABlle-constant";
const OUT_FEATURED = "episodes.json";
const OUT_ALL      = "episodes-all.json";
const CURATION     = "curation.json";
const UA           = "Mozilla/5.0 (compatible; RaphaelleSiteBot/1.0)";

const LONGFORM_MIN = 180;   // seconds — below this an item is a "short" companion (start at 3 min; tune)
const MAX_PAGES    = 30;    // safety cap on pagination
const DELAY_MS     = 300;   // politeness delay between article fetches

// Known shows → {label, key}. Unknown shows fall back to a derived label/key.
const SHOWS = {
  "priorité-santé":         { label: "Priorité Santé",        key: "sante"   },
  "le-conseil-santé":       { label: "Le Conseil Santé",      key: "conseil" }, // companion show (short Q&As)
  "si-loin-si-proche":      { label: "Si loin si proche",     key: "recit"   },
  "8-milliards-de-voisins": { label: "8 milliards de voisins", key: "voisins" },
  "7-milliards-de-voisins": { label: "8 milliards de voisins", key: "voisins" },
  "atelier-des-médias":     { label: "L'Atelier des médias",  key: "medias"  },
  "reportage-afrique":      { label: "Reportage Afrique",     key: "afrique" },
  "aujourd-hui-l-economie": { label: "Aujourd'hui l'économie", key: "eco"    },
};
const COMPANION_SHOW_KEYS = new Set(["conseil"]);
const COMPANION_TITLE_RE  = /comment se prépare|questions? à |le conseil|décryptage|chronique/i;

// "Featured" = her long-format field reportages. Duration alone can't identify them
// (RFI credits her on full 30-49-min studio talk-shows), so a piece is flagship when:
//   its URL is tagged "reportage", OR it's from a reportage/documentary show, OR it's
//   curated-in. Studio companions (Le Conseil Santé) and curated-out are excluded.
const FEATURED_SHOW_KEYS = new Set(["recit", "medias"]); // Si loin si proche · L'Atelier des médias
const REPORTAGE_URL_RE   = /reportage/i;

// Country detection from title/place/slug (for the "Lieu" filter on reportages.html).
const COUNTRIES = ["Tchad","Cameroun","Sénégal","Côte d'Ivoire","Guinée","Maroc","Burkina Faso",
  "Niger","Mali","Bénin","RD Congo","Congo","Gabon","Soudan","Mauritanie","Togo","Ghana",
  "Nigeria","Kenya","Éthiopie","Madagascar","Tunisie","Algérie"];

const UAH = { headers: { "User-Agent": UA } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

// Decode HTML entities RFI puts in og:title (&#039; &amp; &laquo; …).
const decodeEntities = (s) => (s || "")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&hellip;/g, "…");

// Normalised title key for collapsing re-broadcasts (same piece re-aired on a new date).
const normTitle = (t) => stripAccents(decodeEntities(t || "")).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function getText(url) {
  const r = await fetch(url, UAH);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function meta(html, prop) {
  const r1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const r2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i");
  return (html.match(r1) || html.match(r2) || [])[1] || "";
}

// ISO-8601 duration → seconds. Handles "P0DT0H48M30S", "PT8M30S", "PT45S", etc.
function isoToSec(iso) {
  const m = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?/.exec(iso || "");
  if (!m) return 0;
  const [, , , w, d, h, min, s] = m.map((x) => (x ? Number(x) : 0));
  return ((+w) * 7 + (+d)) * 86400 + (+h) * 3600 + (+min) * 60 + Math.round(+s);
}
function durationFromArticle(html) {
  const m = html.match(/"duration"\s*:\s*"([^"]+)"/);   // JSON-LD AudioObject
  return m ? isoToSec(m[1]) : 0;
}

function frDate(iso) {
  const M = ["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
  const d = new Date(iso);
  return isNaN(d) ? "" : `${M[d.getMonth()]} ${d.getFullYear()}`;
}

const normAlnum = (s) => stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
const COUNTRIES_BY_LEN = [...COUNTRIES].sort((a, b) => normAlnum(b).length - normAlnum(a).length);
function detectCountry(...parts) {
  const hay = normAlnum(parts.join(" "));                 // strips accents/spaces/hyphens/apostrophes
  for (const c of COUNTRIES_BY_LEN) if (hay.includes(normAlnum(c))) return c; // longest first (Nigeria before Niger)
  return "";
}

function cleanTitle(ogTitle, showLabel) {
  let t = decodeEntities(ogTitle || "").replace(/\s*[-–|]\s*RFI\s*$/i, "").trim();
  // strip a leading "Show name - " prefix RFI prepends
  const pre = new RegExp("^" + showLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[-–:]\\s*", "i");
  t = t.replace(pre, "").trim();
  return t;
}

// Collect every article link across all author pages.
async function collectLinks() {
  const links = new Map(); // url -> {url, showSlug, showKey, showLabel, sort, id}
  for (let n = 1; n <= MAX_PAGES; n++) {
    const pageUrl = n === 1 ? `${AUTHOR_BASE}/` : `${AUTHOR_BASE}/${n}/`;
    let html;
    try { html = await getText(pageUrl); }
    catch (e) { console.warn(`  page ${n}: ${e.message}`); break; }
    const re = /\/fr\/podcasts\/([^\/"]+)\/(\d{8}-[^"?#]+)/g;
    let m, added = 0;
    while ((m = re.exec(html))) {
      const [, showSlug, epSlug] = m;
      const url = `https://www.rfi.fr/fr/podcasts/${showSlug}/${epSlug}`;
      if (links.has(url)) continue;
      const slugKey = decode(showSlug).toLowerCase();
      const show = SHOWS[slugKey] || {
        label: decode(showSlug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        key: slugKey.replace(/[^a-z0-9]+/g, "-"),
      };
      const sort = epSlug.slice(0, 8);
      links.set(url, {
        url, showSlug: slugKey, showKey: show.key, showLabel: show.label, sort,
        id: `${sort}-${stripAccents(decode(epSlug)).replace(/[^a-z0-9]+/g, "-").slice(9, 60).replace(/^-|-$/g, "")}`,
      });
      added++;
    }
    console.log(`  page ${n}: +${added} new (total ${links.size})`);
    if (added === 0 && n > 1) break;   // reached the end
    await sleep(DELAY_MS);
  }
  return [...links.values()];
}

function classify(item, curation) {
  let flagship = REPORTAGE_URL_RE.test(item.url) || FEATURED_SHOW_KEYS.has(item.showKey);
  if (COMPANION_SHOW_KEYS.has(item.showKey)) flagship = false;          // short studio Q&As never feature
  if (curation.exclude && curation.exclude[item.url]) flagship = false;
  if (curation.include && curation.include[item.url]) flagship = true;  // override always wins
  item.flagship = flagship;
  item.format = item.durationSec >= LONGFORM_MIN ? "long" : (item.durationSec > 0 ? "short" : "unknown");
}

async function main() {
  // previous data (preserve hand-written blurbs/places; skip re-fetching known urls)
  const prev = {};
  for (const f of [OUT_ALL, OUT_FEATURED]) {
    if (!existsSync(f)) continue;
    try { for (const e of JSON.parse(await readFile(f, "utf8")).episodes || []) prev[e.url] = { ...prev[e.url], ...e }; }
    catch {}
  }
  let curation = { include: {}, exclude: {} };
  if (existsSync(CURATION)) { try { curation = { ...curation, ...JSON.parse(await readFile(CURATION, "utf8")) }; } catch {} }

  console.log("Crawling author pages…");
  let links;
  try { links = await collectLinks(); }
  catch (e) { console.error("Author crawl failed:", e.message); return; }  // keep existing files
  if (!links.length) { console.warn("No links found — leaving files untouched."); return; }
  console.log(`Found ${links.length} items. Fetching NEW article pages…`);

  const items = [];
  let fetched = 0;
  for (const l of links) {
    const old = prev[l.url];
    let title = old?.title, image = old?.image, durationSec = old?.durationSec, date = old?.date,
        blurb = old?.blurb, place = old?.place;

    // Fetch the article only if we don't already have its duration (i.e. it's new).
    if (durationSec === undefined) {
      try {
        const html = await getText(l.url);
        durationSec = durationFromArticle(html);
        const og = cleanTitle(meta(html, "og:title"), l.showLabel);
        title = title || og || l.id;
        image = image || meta(html, "og:image").split("?")[0];
        date  = date  || frDate(meta(html, "article:published_time"));
        blurb = blurb || "";
        fetched++;
        await sleep(DELAY_MS);
      } catch (e) {
        console.warn("  ✗", l.url, e.message);
        durationSec = durationSec ?? 0;
      }
    }
    title = decodeEntities(title || l.id);
    const country = detectCountry(place || "", title, decode(l.url));
    const item = {
      id: l.id, title, show: l.showLabel, showKey: l.showKey,
      place: place || country || "", country,
      date: date || "", sort: l.sort, url: l.url, image: image || "",
      blurb: blurb || "", durationSec: durationSec || 0,
    };
    classify(item, curation);
    items.push(item);
  }
  console.log(`Fetched ${fetched} new article pages.`);

  items.sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0)); // newest first

  // Collapse re-broadcasts: same show + same normalised title = the same piece re-aired on a new date.
  const seenTitle = new Set(); const deduped = [];
  for (const it of items) {
    const key = it.showKey + "|" + normTitle(it.title);
    if (seenTitle.has(key)) continue;
    seenTitle.add(key); deduped.push(it);
  }
  const removed = items.length - deduped.length;
  items.length = 0; items.push(...deduped);
  if (removed) console.log(`Collapsed ${removed} re-broadcast duplicate(s).`);

  // Attach short companions (same-date shorts) to a flagship of the same day.
  const flagshipByDate = {};
  items.forEach((it) => { if (it.flagship) (flagshipByDate[it.sort] ||= []).push(it); });
  items.forEach((it) => {
    if (it.flagship) return;
    const host = (flagshipByDate[it.sort] || [])[0];
    if (host) (host.companions ||= []).push({ title: it.title, url: it.url, durationSec: it.durationSec, show: it.show });
  });

  const featured = items.filter((it) => it.flagship);
  const stamp = new Date().toISOString().slice(0, 10);
  await writeFile(OUT_ALL,      JSON.stringify({ updated: stamp, source: AUTHOR_BASE + "/", count: items.length, episodes: items }, null, 2) + "\n");
  await writeFile(OUT_FEATURED, JSON.stringify({ updated: stamp, source: AUTHOR_BASE + "/", episodes: featured }, null, 2) + "\n");

  const shorts = items.length - featured.length;
  console.log(`\nWrote ${OUT_FEATURED}: ${featured.length} flagship reportages.`);
  console.log(`Wrote ${OUT_ALL}: ${items.length} total (${shorts} shorts/companions).`);

  // Sanity: every previously-featured url must still be flagship.
  const missing = Object.keys(curation.include || {}).filter((u) => !featured.some((e) => e.url === u));
  if (missing.length) console.warn(`⚠ ${missing.length} curated url(s) not featured (check the url):\n  ` + missing.join("\n  "));
  else console.log("✓ All curated flagship urls present.");
}

export { isoToSec, detectCountry, cleanTitle, classify, COMPANION_TITLE_RE };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exitCode = 0; });
}

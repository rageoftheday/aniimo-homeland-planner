#!/usr/bin/env node
'use strict';

/**
 * Official Aniimo Wiki Homeland scraper.
 *
 * Source: https://wiki.aniimo.com/
 * Uses only Node 18+ built-ins. No browser automation or third-party packages.
 *
 * Output:
 *   data/official-wiki-homeland.json
 *   data/official-wiki-homeland.js
 *
 * The raw wiki ability id is always preserved. Friendly names are a convenience
 * mapping only, so a new/unknown wiki id cannot silently corrupt ranking data.
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'https://wiki.aniimo.com/';
const OUT_JSON = path.resolve(__dirname, '../data/official-wiki-homeland.json');
const OUT_JS = path.resolve(__dirname, '../data/official-wiki-homeland.js');
const REQUEST_DELAY_MS = Number(process.env.ANIIMO_WIKI_DELAY_MS || 140);
const USER_AGENT = 'Aniimo-Homeland-Planner-Reference-Builder/1.0 (+https://github.com/rageoftheday/aniimo-homeland-planner)';

const ABILITY_NAMES = Object.freeze({
  1000: 'Fire',
  1001: 'Grass',
  1002: 'Water',
  1003: 'Earth',
  1004: 'Lightning',
  1005: 'Ice',
  1006: 'Wind',
  1007: 'Dark',
  1008: 'Light',
  1100: 'Hauling',
  1101: 'Artisanship',
  1102: 'Leisure',
  1103: 'Perfumery'
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => decodeEntities(String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const norm = s => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const humanizeSlug = slug => String(slug || '').split('-').filter(Boolean).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
const uniq = arr => [...new Set(arr.filter(Boolean))];

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml'
    },
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.text();
}

function absoluteHref(href) {
  try { return new URL(decodeEntities(href), ROOT).href; }
  catch { return ''; }
}

function itemLinks(html) {
  const out = [];
  const re = /<a\b[^>]*href=["']([^"']*\/item\/([0-9]+)\/([^"'?#]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    out.push({
      url: absoluteHref(m[1]),
      dex: m[2],
      slug: m[3].replace(/\/$/, ''),
      label: clean(m[4])
    });
  }
  return out;
}

function speciesName(html) {
  const h2 = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2) return clean(h2[1]);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? clean(title[1]).replace(/\s*\|\s*Aniimo Wiki.*$/i, '') : '';
}

function sectionChunk(html, heading, nextHeadings = []) {
  const lower = html.toLowerCase();
  const at = lower.indexOf(heading.toLowerCase());
  if (at < 0) return '';
  let end = html.length;
  for (const next of nextHeadings) {
    const p = lower.indexOf(next.toLowerCase(), at + heading.length);
    if (p >= 0 && p < end) end = p;
  }
  return html.slice(at, end);
}

function parseAbilities(html) {
  // Limit to the Homeland Ability section so combat/pathfinding icons cannot leak in.
  const chunk = sectionChunk(html, 'Homeland Ability', [
    'Pathfinding', 'Mobility', 'Trait', 'Skill Details', 'Combat Innate', 'Resonance Training'
  ]);
  if (!chunk) return [];

  // Wiki capsules are nested spans. Match the icon class and the level text that
  // follows inside the same capsule rather than trying to parse balanced HTML.
  const out = [];
  const re = /icon-home-(\d+)[\s\S]{0,1200}?class=["'][^"']*\bflex-1\b[^"']*["'][^>]*>\s*(\d+)\s*<\/span>/gi;
  let m;
  while ((m = re.exec(chunk))) {
    const abilityId = Number(m[1]);
    out.push({
      abilityId,
      type: ABILITY_NAMES[abilityId] || `Home ${abilityId}`,
      level: Number(m[2])
    });
  }

  const seen = new Set();
  return out.filter(a => {
    const k = `${a.abilityId}|${a.level}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseHabitats(html) {
  const chunk = sectionChunk(html, 'Habitats', [
    'Homeland Ability', 'Pathfinding', 'Mobility', 'Trait', 'Skill Details'
  ]);
  if (!chunk) return [];

  const items = [];
  const capsuleRe = /<span\b[^>]*class=["'][^"']*capsule-item[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = capsuleRe.exec(chunk))) {
    const t = clean(m[1]);
    if (t && !/^\d+$/.test(t)) items.push(t);
  }
  if (items.length) return uniq(items);

  const text = clean(chunk)
    .replace(/^Habitats\s*/i, '')
    .replace(/\s*Homeland Ability.*$/i, '');
  return text ? [text] : [];
}

function formLabelFromPage(html, dex, slug) {
  const links = itemLinks(html).filter(x => String(Number(x.dex)) === String(Number(dex)));
  const current = links.find(x => x.slug === slug && /form/i.test(x.label));
  return current?.label || humanizeSlug(slug);
}

function bestAbilities(forms) {
  const best = new Map();
  for (const form of forms) {
    for (const a of form.homelandAbilities || []) {
      if (!Number.isFinite(a.level)) continue;
      const key = String(a.abilityId);
      const prev = best.get(key);
      if (!prev || a.level > prev.level) {
        best.set(key, {
          abilityId: a.abilityId,
          type: a.type,
          level: a.level,
          forms: [{ slug: form.slug, label: form.label, url: form.url }]
        });
      } else if (a.level === prev.level) {
        prev.forms.push({ slug: form.slug, label: form.label, url: form.url });
      }
    }
  }
  return [...best.values()].sort((a, b) => b.level - a.level || a.type.localeCompare(b.type));
}

async function main() {
  console.log('Aniimo Wiki Homeland scraper');
  console.log('Source:', ROOT);

  const indexHtml = await fetchText(ROOT);
  const indexLinks = itemLinks(indexHtml);
  const speciesSeeds = new Map();

  for (const link of indexLinks) {
    if (!speciesSeeds.has(link.dex)) speciesSeeds.set(link.dex, link);
  }

  if (speciesSeeds.size < 70) {
    throw new Error(`Index discovery only found ${speciesSeeds.size} species; refusing to publish a likely incomplete scrape.`);
  }

  console.log(`Discovered ${speciesSeeds.size} species from index.`);

  const species = [];
  const warnings = [];
  let requestCount = 1;

  for (const [dex, seed] of speciesSeeds) {
    await sleep(REQUEST_DELAY_MS);
    const basicHtml = await fetchText(seed.url);
    requestCount++;

    const name = speciesName(basicHtml) || seed.label.replace(/^NO\.\s*\d+\s*/i, '') || `NO.${dex}`;
    const discovered = itemLinks(basicHtml)
      .filter(x => String(Number(x.dex)) === String(Number(dex)))
      .filter(x => /form$/i.test(x.slug) || /form/i.test(x.label));

    const formsByUrl = new Map();
    for (const f of discovered) formsByUrl.set(f.url, f);
    if (!formsByUrl.size) formsByUrl.set(seed.url, seed);

    const forms = [];
    for (const formSeed of formsByUrl.values()) {
      let html = basicHtml;
      if (formSeed.url !== seed.url) {
        await sleep(REQUEST_DELAY_MS);
        html = await fetchText(formSeed.url);
        requestCount++;
      }

      const homelandAbilities = parseAbilities(html);
      const habitats = parseHabitats(html);
      const label = formLabelFromPage(html, dex, formSeed.slug);
      const unknown = homelandAbilities.filter(a => !ABILITY_NAMES[a.abilityId]);
      if (unknown.length) {
        warnings.push(`${name} / ${label}: unknown ability ids ${unknown.map(x => x.abilityId).join(', ')}`);
      }
      if (!homelandAbilities.length) {
        warnings.push(`${name} / ${label}: no Homeland Ability capsules parsed`);
      }
      if (homelandAbilities.some(a => !Number.isInteger(a.level) || a.level < 1 || a.level > 4)) {
        warnings.push(`${name} / ${label}: invalid Homeland ability level(s)`);
      }

      forms.push({
        slug: formSeed.slug,
        label,
        url: formSeed.url,
        habitats,
        homelandAbilities
      });
    }

    species.push({
      dex: String(dex).padStart(3, '0'),
      name,
      indexUrl: seed.url,
      forms,
      bestAbilities: bestAbilities(forms)
    });

    console.log(`[${species.length}/${speciesSeeds.size}] ${name}: ${forms.length} form(s)`);
  }

  species.sort((a, b) => Number(a.dex) - Number(b.dex) || a.name.localeCompare(b.name));

  const output = {
    format: 'aniimo-official-wiki-homeland-v1',
    source: ROOT,
    scrapedAt: new Date().toISOString(),
    scraper: {
      requestCount,
      requestDelayMs: REQUEST_DELAY_MS,
      abilityIdMap: ABILITY_NAMES
    },
    counts: {
      species: species.length,
      forms: species.reduce((n, s) => n + s.forms.length, 0),
      formsWithAbilities: species.reduce((n, s) => n + s.forms.filter(f => f.homelandAbilities.length).length, 0),
      unknownAbilityIds: uniq(species.flatMap(s => s.forms.flatMap(f => f.homelandAbilities.filter(a => !ABILITY_NAMES[a.abilityId]).map(a => a.abilityId)))).length,
      abilitiesMissingLevel: species.reduce((n, s) => n + s.forms.reduce((m, f) => m + f.homelandAbilities.filter(a => !Number.isInteger(a.level)).length, 0), 0)
    },
    warnings,
    species
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2) + '\n');
  fs.writeFileSync(OUT_JS, 'window.ANIIMO_OFFICIAL_WIKI_HOMELAND=' + JSON.stringify(output) + ';\n');

  console.log('\nSaved:');
  console.log(' ', OUT_JSON);
  console.log(' ', OUT_JS);
  console.log('\nCounts:', output.counts);
  if (warnings.length) {
    console.log(`Warnings: ${warnings.length} (kept in output for review)`);
  }
}

main().catch(err => {
  console.error('\nScrape failed:', err && err.stack || err);
  process.exitCode = 1;
});

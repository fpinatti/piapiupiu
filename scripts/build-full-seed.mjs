#!/usr/bin/env node
/**
 * scripts/build-full-seed.mjs
 *
 * Canonical 5-Expansion Seed Builder for PiaPiuPiu (Wingspan Companion):
 * 1. Fetches official Wingspan card data from navarog/wingsearch:
 *    - master.json (557 standard birds across Base, European, Oceania, Asia, Americas)
 *    - hummingbirds.json (40 hummingbirds from Americas expansion)
 *    Total: 597 official bird cards.
 * 2. Preserves existing verified Brazilian Portuguese names from src/data/birds-seed.json
 *    and src/data/pt-names-cache.json.
 * 3. Resolves missing Portuguese common names via batched Wikidata SPARQL (P1843 / rdfs:label)
 *    and iNaturalist (locale=pt-BR) + ornithological Portuguese translation fallback.
 * 4. Writes src/data/pt-names-cache.json and src/data/birds-seed.json.
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SEED_PATH = path.resolve(ROOT_DIR, 'src', 'data', 'birds-seed.json');
const PT_CACHE_PATH = path.resolve(ROOT_DIR, 'src', 'data', 'pt-names-cache.json');

const MASTER_URL =
  'https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/data/master.json';
const HUMMINGBIRDS_URL =
  'https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/data/hummingbirds.json';

const SET_TO_EXPANSION = {
  core: 'base',
  european: 'europe',
  oceania: 'oceania',
  asia: 'asia',
  americas: 'americas',
};

const CURATED_PT_OVERRIDES = {
  'Anhinga anhinga': 'Biguatinga',
  'Taeniopygia castanotis': 'Mandarim-australiano',
  'Oriolus chinensis': 'Papa-figos-de-nuca-preta',
  'Buteo buteo': 'Águia-de-asa-redonda',
  'Sylvia subalpina': 'Toutinegra-de-moltoni',
};

/**
 * Convert an English common name to a safe snake_case identifier ([a-z0-9_]).
 */
export function toSnakeCaseId(nameEn) {
  return String(nameEn)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Extract habitats array from wingsearch card row.
 */
function extractHabitats(row) {
  const habitats = [];
  if (row.Forest === 'X') habitats.push('forest');
  if (row.Grassland === 'X') habitats.push('grassland');
  if (row.Wetland === 'X') habitats.push('wetland');
  return habitats.length > 0 ? habitats : ['forest'];
}

/**
 * Check if a candidate Portuguese name is actually just the Latin scientific name.
 */
function isSameAsScientific(candidate, scientific) {
  if (!candidate) return true;
  const normCand = candidate.trim().toLowerCase();
  const normSci = scientific.trim().toLowerCase();
  return normCand === normSci;
}

/**
 * Capitalize first letter of a Portuguese bird name.
 */
function capitalizePtName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Query Wikidata SPARQL in batches for Portuguese vernacular names (P1843 or rdfs:label).
 */
async function queryWikidataPtNames(scientificNames) {
  const results = new Map();
  const batchSize = 60;

  for (let i = 0; i < scientificNames.length; i += batchSize) {
    const batch = scientificNames.slice(i, i + batchSize);
    const valuesList = batch.map((s) => `"${s.replace(/"/g, '')}"`).join(' ');

    const sparql = `
      SELECT ?sci ?commonPtBr ?commonPt ?labelPtBr ?labelPt WHERE {
        VALUES ?sci { ${valuesList} }
        ?item wdt:P225 ?sci .
        OPTIONAL { ?item wdt:P1843 ?commonPtBr FILTER(LANG(?commonPtBr) = "pt-br" || LANG(?commonPtBr) = "pt-BR") }
        OPTIONAL { ?item wdt:P1843 ?commonPt FILTER(LANG(?commonPt) = "pt") }
        OPTIONAL { ?item rdfs:label ?labelPtBr FILTER(LANG(?labelPtBr) = "pt-br") }
        OPTIONAL { ?item rdfs:label ?labelPt FILTER(LANG(?labelPt) = "pt") }
      }
    `;

    try {
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PiaPiuPiu-Wingsong/1.0 (https://github.com/fpinatti/piapiupiu)',
          Accept: 'application/sparql-results+json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      for (const b of data?.results?.bindings || []) {
        const sci = b?.sci?.value;
        if (!sci || results.has(sci)) continue;

        const candidates = [
          b?.commonPtBr?.value,
          b?.commonPt?.value,
          b?.labelPtBr?.value,
          b?.labelPt?.value,
        ];

        for (const cand of candidates) {
          if (cand && !isSameAsScientific(cand, sci)) {
            results.set(sci, capitalizePtName(cand));
            break;
          }
        }
      }
    } catch {
      // Continue on transient SPARQL timeout
    }
  }

  return results;
}

/**
 * Query iNaturalist API (locale=pt-BR) with bounded concurrency for remaining birds.
 */
async function queryINaturalistPtNames(scientificNames, concurrency = 8) {
  const results = new Map();
  let index = 0;

  async function worker() {
    while (index < scientificNames.length) {
      const currentIdx = index++;
      const sci = scientificNames[currentIdx];
      try {
        const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sci)}&locale=pt-BR&per_page=3`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'PiaPiuPiu-Wingsong/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const match = (data?.results || []).find(
          (r) => String(r?.name || '').toLowerCase() === sci.toLowerCase()
        ) || data?.results?.[0];

        const pref = match?.preferred_common_name;
        if (pref && !isSameAsScientific(pref, sci)) {
          results.set(sci, capitalizePtName(pref));
        }
      } catch {
        // Ignore single lookup error
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, scientificNames.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

async function run() {
  const forceRefresh = process.argv.includes('--refresh-pt');

  // 1. Load existing PT cache and existing birds-seed.json
  let ptCache = {};
  if (existsSync(PT_CACHE_PATH) && !forceRefresh) {
    try {
      ptCache = JSON.parse(await fs.readFile(PT_CACHE_PATH, 'utf-8'));
    } catch {
      ptCache = {};
    }
  }

  if (existsSync(SEED_PATH)) {
    try {
      const existingSeed = JSON.parse(await fs.readFile(SEED_PATH, 'utf-8'));
      for (const bird of existingSeed) {
        if (bird.scientific && bird.name_pt && !isSameAsScientific(bird.name_pt, bird.scientific)) {
          ptCache[bird.scientific] = capitalizePtName(bird.name_pt);
        }
      }
    } catch {
      // Ignore if seed is malformed
    }
  }

  for (const [sci, pt] of Object.entries(CURATED_PT_OVERRIDES)) {
    ptCache[sci] = pt;
  }

  // 2. Fetch canonical master.json + hummingbirds.json from wingsearch
  console.log('Fetching canonical Wingspan master.json and hummingbirds.json...');
  const [masterRes, hummingRes] = await Promise.all([
    fetch(MASTER_URL, { signal: AbortSignal.timeout(20000) }),
    fetch(HUMMINGBIRDS_URL, { signal: AbortSignal.timeout(20000) }),
  ]);

  if (!masterRes.ok || !hummingRes.ok) {
    throw new Error(
      `Failed to fetch wingsearch dataset: master=${masterRes.status}, hummingbirds=${hummingRes.status}`
    );
  }

  const masterRows = await masterRes.json();
  const hummingbirdRows = await hummingRes.json();

  const rawCards = [...masterRows, ...hummingbirdRows].filter((row) =>
    Object.prototype.hasOwnProperty.call(SET_TO_EXPANSION, row.Set)
  );

  console.log(`Loaded ${rawCards.length} canonical cards across 5 expansions.`);

  // 3. Identify scientific names missing a cached Portuguese name
  const missingSci = [];
  for (const row of rawCards) {
    const sci = String(row['Scientific name'] || '').trim();
    if (sci && !ptCache[sci]) {
      missingSci.push(sci);
    }
  }

  const uniqueMissingSci = [...new Set(missingSci)];
  if (uniqueMissingSci.length > 0) {
    console.log(`Resolving ${uniqueMissingSci.length} Portuguese names via Wikidata SPARQL...`);
    const wikidataMap = await queryWikidataPtNames(uniqueMissingSci);
    for (const [sci, ptName] of wikidataMap.entries()) {
      ptCache[sci] = ptName;
    }

    const stillMissing = uniqueMissingSci.filter((sci) => !ptCache[sci]);
    if (stillMissing.length > 0) {
      console.log(
        `Resolved ${wikidataMap.size} via Wikidata. Querying iNaturalist (pt-BR) for remaining ${stillMissing.length} species...`
      );
      const inatMap = await queryINaturalistPtNames(stillMissing, 10);
      for (const [sci, ptName] of inatMap.entries()) {
        ptCache[sci] = ptName;
      }
      console.log(`Resolved ${inatMap.size} additional Portuguese names via iNaturalist.`);
    }
  }

  // 4. Build final deduplicated 597-bird seed list
  const usedIds = new Set();
  const finalSeed = [];
  const countsByExpansion = {
    base: 0,
    europe: 0,
    oceania: 0,
    asia: 0,
    americas: 0,
  };

  for (const row of rawCards) {
    const nameEn = String(row['Common name'] || '').trim();
    const scientific = String(row['Scientific name'] || '').trim();
    const expansion = SET_TO_EXPANSION[row.Set];
    const habitats = extractHabitats(row);

    let id = toSnakeCaseId(nameEn);
    if (usedIds.has(id)) {
      id = `${id}_${expansion}`;
    }
    usedIds.add(id);

    const namePt = ptCache[scientific] ? capitalizePtName(ptCache[scientific]) : nameEn;
    if (ptCache[scientific]) {
      ptCache[scientific] = namePt;
    }

    countsByExpansion[expansion] = (countsByExpansion[expansion] || 0) + 1;

    finalSeed.push({
      id,
      name_pt: namePt,
      name_en: nameEn,
      scientific,
      expansion,
      habitats,
    });
  }

  await fs.writeFile(PT_CACHE_PATH, JSON.stringify(ptCache, null, 2) + '\n', 'utf-8');
  await fs.writeFile(SEED_PATH, JSON.stringify(finalSeed, null, 2) + '\n', 'utf-8');

  console.log(`Saved ${Object.keys(ptCache).length} cached PT-BR names to src/data/pt-names-cache.json`);
  console.log(`Saved ${finalSeed.length} birds to src/data/birds-seed.json:`);
  console.log(countsByExpansion);
}

run().catch((err) => {
  console.error('build-full-seed failed:', err.message);
  process.exit(1);
});

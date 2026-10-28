#!/usr/bin/env node
/**
 * scripts/sync-birds.mjs
 *
 * Automated Data & Audio Pipeline for PiaPiuPiu (Wingsong Clone):
 * 1. Reads the Wingspan bird catalog from src/data/birds-seed.json (all 5 expansions)
 * 2. Queries Xeno-Canto REST API / iNaturalist by scientific name (unless --fast-synth is set)
 * 3. Downloads and transcodes audio via ffmpeg (mono, 24kbps, max 4s, 0.8s fade-out)
 *    - Falls back to generating a unique melodic bird-chirp audio file via ffmpeg lavfi
 *      so 100% offline bundling always succeeds within the <20 MB budget.
 * 4. Writes src/data/birds.json and src/data/audioMap.ts for offline React Native bundling.
 */

import fs from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SEED_PATH = path.resolve(ROOT_DIR, 'src', 'data', 'birds-seed.json');
const DB_OUTPUT_PATH = path.resolve(ROOT_DIR, 'src', 'data', 'birds.json');
const AUDIO_MAP_PATH = path.resolve(ROOT_DIR, 'src', 'data', 'audioMap.ts');
const AUDIO_OUTPUT_DIR = path.resolve(ROOT_DIR, 'assets', 'audio');

const ALLOWED_FORMATS = new Set(['mp3', 'opus']);
const ALLOWED_EXPANSIONS = new Set(['all', 'base', 'europe', 'oceania', 'asia', 'americas']);
const SAFE_ID_REGEX = /^[a-z0-9_]+$/;
const FFMPEG_BIN = '/usr/bin/ffmpeg';

/**
 * Resolve a filename safely inside a sandboxed directory, preventing path traversal.
 */
function resolveSafeAudioPath(filename) {
  const safeBase = path.basename(String(filename));
  const resolved = path.resolve(AUDIO_OUTPUT_DIR, safeBase);
  if (!resolved.startsWith(AUDIO_OUTPUT_DIR + path.sep)) {
    throw new Error(`Security violation: path escapes audio directory: ${filename}`);
  }
  return resolved;
}

function parseCliArgs(argv) {
  const options = {
    format: 'mp3',
    expansion: 'all',
    limit: Infinity,
    concurrency: 8,
    force: false,
    fastSynth: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i].toLowerCase();
      if (!ALLOWED_FORMATS.has(fmt)) {
        throw new Error(`Invalid --format "${fmt}". Allowed: mp3, opus`);
      }
      options.format = fmt;
    } else if (arg === '--expansion' && argv[i + 1]) {
      const exp = argv[++i].toLowerCase();
      if (!ALLOWED_EXPANSIONS.has(exp)) {
        throw new Error(
          `Invalid --expansion "${exp}". Allowed: all, base, europe, oceania, asia, americas`
        );
      }
      options.expansion = exp;
    } else if (arg === '--limit' && argv[i + 1]) {
      const lim = Number.parseInt(argv[++i], 10);
      if (Number.isNaN(lim) || lim <= 0) {
        throw new Error('Invalid --limit value; must be a positive integer.');
      }
      options.limit = lim;
    } else if (arg === '--concurrency' && argv[i + 1]) {
      const conc = Number.parseInt(argv[++i], 10);
      if (Number.isNaN(conc) || conc < 1 || conc > 16) {
        throw new Error('Invalid --concurrency value; must be an integer between 1 and 16.');
      }
      options.concurrency = conc;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--fast-synth') {
      options.fastSynth = true;
    }
  }

  return options;
}

/**
 * Query Xeno-Canto API for the best recording by scientific name.
 */
async function fetchXenoCantoAudioUrl(scientificName) {
  const apiKey = process.env.XENO_CANTO_API_KEY || '';
  if (!apiKey) {
    // Xeno-Canto API v2 requires an API key in many regions; skip if unconfigured to avoid slow timeouts
    return null;
  }
  const keyParam = `&key=${encodeURIComponent(apiKey)}`;

  const queries = [
    `"${scientificName}" q:A len:3-15`,
    `${scientificName} q:A`,
    `${scientificName}`,
  ];

  for (const rawQuery of queries) {
    try {
      const query = encodeURIComponent(rawQuery);
      const url = `https://xeno-canto.org/api/2/recordings?query=${query}${keyParam}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PiaPiuPiu-Wingsong/1.0 (https://github.com/fpinatti/piapiupiu)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const fileUrl = data?.recordings?.[0]?.file;
      if (typeof fileUrl === 'string' && fileUrl.startsWith('https://')) {
        return { url: fileUrl, source: `xeno-canto:${data.recordings[0].id || 'xc'}` };
      }
    } catch {
      // Fall through to next query or fallback source
    }
  }

  return null;
}

/**
 * Fallback open-source ornithological audio lookup via iNaturalist public observations API.
 */
async function fetchINaturalistAudioUrl(scientificName) {
  try {
    const query = encodeURIComponent(scientificName);
    const url = `https://api.inaturalist.org/v1/observations?taxon_name=${query}&sounds=true&per_page=2&quality_grade=research`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PiaPiuPiu-Wingsong/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    for (const obs of data?.results || []) {
      const soundUrl = obs?.sounds?.[0]?.file_url;
      if (typeof soundUrl === 'string' && soundUrl.startsWith('https://')) {
        return { url: soundUrl, source: `inaturalist:${obs.id}` };
      }
    }
  } catch {
    // Ignore network errors and allow local synthesis fallback
  }
  return null;
}

/**
 * Deterministically derive melodic chirp frequencies from a bird's scientific name
 * and synthesize a clean 3.2-second 24kbps bird song clip via ffmpeg lavfi (~9.5 KB per bird).
 */
function synthesizeBirdChirpWithFfmpeg(birdId, scientificName, outputPath, format) {
  let hash = 0;
  for (let i = 0; i < scientificName.length; i++) {
    hash = (hash * 31 + scientificName.charCodeAt(i)) >>> 0;
  }
  const baseFreq = 1350 + (hash % 1550); // 1350 Hz - 2900 Hz avian vocal range
  const modFreq = 4 + (hash % 10);       // warble speed
  const pulsePeriod = (0.45 + ((hash >>> 8) % 35) / 100).toFixed(2);

  const filterExpr = `aevalsrc='0.35*sin(2*PI*(${baseFreq}+220*sin(2*PI*${modFreq}*t))*t)*exp(-1.3*mod(t,${pulsePeriod}))':s=22050:d=3.2,afade=t=in:st=0:d=0.08,afade=t=out:st=2.5:d=0.7`;

  const codecArgs =
    format === 'opus'
      ? ['-c:a', 'libopus', '-b:a', '24k']
      : ['-c:a', 'libmp3lame', '-b:a', '24k'];

  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      filterExpr,
      '-ac',
      '1',
      ...codecArgs,
      outputPath,
    ],
    { stdio: 'ignore' }
  );
}

/**
 * Transcode a downloaded raw audio file to Mono 24kbps (max 4.5s with 0.8s fade-out).
 */
function transcodeAudioWithFfmpeg(rawInputPath, finalOutputPath, format) {
  const codecArgs =
    format === 'opus'
      ? ['-c:a', 'libopus', '-b:a', '24k']
      : ['-c:a', 'libmp3lame', '-b:a', '24k'];

  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-i',
      rawInputPath,
      '-t',
      '4.5',
      '-ac',
      '1',
      '-ar',
      '22050',
      ...codecArgs,
      '-af',
      'afade=t=out:st=3.7:d=0.8',
      finalOutputPath,
    ],
    { stdio: 'ignore' }
  );
}

async function processBird(bird, options, stats) {
  if (!SAFE_ID_REGEX.test(bird.id)) {
    throw new Error(`Invalid bird id "${bird.id}". Only [a-z0-9_] allowed.`);
  }

  const finalFilename = `${bird.id}.${options.format}`;
  const finalOutputPath = resolveSafeAudioPath(finalFilename);
  const rawTempPath = resolveSafeAudioPath(`${bird.id}_raw.tmp`);

  if (!options.force && existsSync(finalOutputPath)) {
    stats.cached++;
    return {
      ...bird,
      audio: finalFilename,
      source: bird.source || 'cached',
    };
  }

  if (!options.fastSynth) {
    let remoteSource = await fetchXenoCantoAudioUrl(bird.scientific);
    if (!remoteSource) {
      remoteSource = await fetchINaturalistAudioUrl(bird.scientific);
    }

    if (remoteSource) {
      try {
        const response = await fetch(remoteSource.url, {
          headers: { 'User-Agent': 'PiaPiuPiu-Wingsong/1.0' },
          signal: AbortSignal.timeout(12000),
        });

        if (response.ok && response.body) {
          await pipeline(response.body, createWriteStream(rawTempPath));
          transcodeAudioWithFfmpeg(rawTempPath, finalOutputPath, options.format);
          await fs.unlink(rawTempPath).catch(() => {});
          stats.downloaded++;
          return {
            ...bird,
            audio: finalFilename,
            source: remoteSource.source,
          };
        }
      } catch {
        await fs.unlink(rawTempPath).catch(() => {});
      }
    }
  }

  // Fallback: synthesize compressed avian chirp via ffmpeg so offline bundle is complete
  synthesizeBirdChirpWithFfmpeg(bird.id, bird.scientific, finalOutputPath, options.format);
  stats.synthesized++;
  return {
    ...bird,
    audio: finalFilename,
    source: 'synthesized-offline',
  };
}

async function generateAudioMapFile(birds) {
  const lines = [
    '/**',
    ' * AUTO-GENERATED BY scripts/sync-birds.mjs',
    ' * Maps each bird ID to its bundled offline audio asset.',
    ' */',
    '',
    'export const BIRD_AUDIO_ASSETS: Record<string, number> = {',
  ];

  for (const bird of birds) {
    if (!SAFE_ID_REGEX.test(bird.id)) continue;
    const safeFile = path.basename(bird.audio);
    const fullAssetPath = resolveSafeAudioPath(safeFile);
    if (existsSync(fullAssetPath)) {
      lines.push(`  ${bird.id}: require('../../assets/audio/${safeFile}'),`);
    }
  }

  lines.push('};', '');
  await fs.writeFile(AUDIO_MAP_PATH, lines.join('\n'), 'utf-8');
}

async function run() {
  const options = parseCliArgs(process.argv);
  await fs.mkdir(AUDIO_OUTPUT_DIR, { recursive: true });

  const rawSeed = await fs.readFile(SEED_PATH, 'utf-8');
  const seedBirds = JSON.parse(rawSeed);

  const filteredSeed = seedBirds
    .filter((b) => options.expansion === 'all' || b.expansion === options.expansion)
    .slice(0, options.limit);

  console.log(
    `Processing ${filteredSeed.length} birds (expansion=${options.expansion}, format=${options.format}, concurrency=${options.concurrency}, fastSynth=${options.fastSynth})...`
  );

  const stats = {
    downloaded: 0,
    synthesized: 0,
    cached: 0,
  };

  const processedById = new Map();
  let cursor = 0;

  async function worker() {
    while (cursor < filteredSeed.length) {
      const idx = cursor++;
      const bird = filteredSeed[idx];
      const entry = await processBird(bird, options, stats);
      if (entry) {
        processedById.set(entry.id, entry);
      }
      if ((idx + 1) % 50 === 0 || idx + 1 === filteredSeed.length) {
        console.log(
          `Progress: ${idx + 1}/${filteredSeed.length} (cached=${stats.cached}, downloaded=${stats.downloaded}, synthesized=${stats.synthesized})`
        );
      }
    }
  }

  const workerCount = Math.min(options.concurrency, Math.max(1, filteredSeed.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  // Merge with full seed list so src/data/birds.json always contains all catalog birds
  const finalCatalog = seedBirds.map((bird) => {
    if (processedById.has(bird.id)) {
      return processedById.get(bird.id);
    }
    const defaultAudio = `${bird.id}.${options.format}`;
    return {
      ...bird,
      audio: defaultAudio,
      source: existsSync(resolveSafeAudioPath(defaultAudio)) ? bird.source || 'bundled' : 'pending',
    };
  });

  await fs.writeFile(DB_OUTPUT_PATH, JSON.stringify(finalCatalog, null, 2) + '\n', 'utf-8');
  await generateAudioMapFile(finalCatalog);

  console.log(
    `\nCompleted! Summary: total=${finalCatalog.length}, processed=${filteredSeed.length}, cached=${stats.cached}, downloaded=${stats.downloaded}, synthesized=${stats.synthesized}`
  );
}

run().catch((err) => {
  console.error('Pipeline failed:', err.message);
  process.exit(1);
});

# Phase 1 Interface Contracts: CLI & Catalog Schema

**Feature**: `001-complete-bird-catalog`
**Date**: 2026-10-28

---

## 1. Seed Generation CLI Contract (`scripts/build-full-seed.mjs`)

Builds `src/data/birds-seed.json` containing all 597 official *Wingspan* birds across `base`, `europe`, `oceania`, `asia`, and `americas`.

### Invocation
```bash
npm run build:seed
# or directly:
node scripts/build-full-seed.mjs
```

### Behavior & Guarantees
1. Fetches `master.json` and `hummingbirds.json` from `navarog/wingsearch` (filtering `Set` to `core`, `european`, `oceania`, `asia`, `americas`).
2. Preserves all existing manual Portuguese translations from `src/data/birds-seed.json`.
3. Resolves missing Portuguese common names (`name_pt`) via batched Wikidata SPARQL (`wdt:P225`) and iNaturalist Taxa API (`locale=pt-BR`), caching translations in `src/data/pt-names-cache.json` for deterministic offline re-runs.
4. Outputs a sorted, deduplicated array of `BirdCard` seed objects to `src/data/birds-seed.json`.

---

## 2. Audio Synchronization CLI Contract (`scripts/sync-birds.mjs`)

Downloads/synthesizes and compresses offline audio clips for all birds in `src/data/birds-seed.json`, writing `src/data/birds.json` and `src/data/audioMap.ts`.

### Invocation
```bash
npm run sync:birds -- [options]
```

### Supported Flags
| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--expansion <id>` | `all \| base \| europe \| oceania \| asia \| americas` | `all` | Restrict audio sync to a specific expansion set |
| `--format <fmt>` | `mp3 \| opus` | `mp3` | Target compressed audio container |
| `--limit <N>` | Positive integer | `Infinity` | Maximum number of birds to process in this run |
| `--concurrency <N>` | `1..12` | `6` | Number of parallel worker tasks |
| `--fast-synth` | Boolean flag | `false` | Immediately synthesize missing clips via `ffmpeg` without network queries (for rapid offline builds/CI) |
| `--force` | Boolean flag | `false` | Overwrite existing audio files in `assets/audio/` |

---

## 3. UI & Matcher Contract (`BirdMatcher` & `FilterBar`)

- `ALL_EXPANSIONS`: `['base', 'europe', 'oceania', 'asia', 'americas']`
- `EXPANSION_THEME.americas`:
  - `id`: `'americas'`
  - `label`: `'Américas'`
  - `bg`: `'#14332B'`
  - `border`: `'#2EC4B6'`
  - `text`: `'#A8F5EC'`
- `BirdMatcher.matchLine(rawText)` and `BirdMatcher.searchCatalog(query)` evaluate all active expansions in `<100ms` across the 597-bird dataset.


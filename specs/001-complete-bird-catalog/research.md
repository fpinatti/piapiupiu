# Phase 0 Research: Complete Wingspan Bird Catalog & All Expansions

**Feature**: `001-complete-bird-catalog`
**Date**: 2026-10-28

---

## 1. Canonical Source for All 5 Official *Wingspan* Sets

- **Decision**: Ingest the open-source `navarog/wingsearch` canonical datasets (`src/assets/data/master.json` for standard bird cards and `src/assets/data/hummingbirds.json` for Americas expansion hummingbird cards) via a dedicated seed-builder script (`scripts/build-full-seed.mjs`).
- **Rationale**:
  - `master.json` contains all official standard bird cards with exact English common names (`Common name`), binomial scientific names (`Scientific name`), habitat flags (`Forest`, `Grassland`, `Wetland`), and expansion set (`Set`), covering:
    - `core`: **180 birds** (170 Base Game + 10 Swift-Start tutorial cards) → mapped to `expansion: "base"`
    - `european`: **81 birds** → mapped to `expansion: "europe"`
    - `oceania`: **95 birds** → mapped to `expansion: "oceania"`
    - `asia`: **90 birds** → mapped to `expansion: "asia"`
    - `americas`: **111 standard birds** → mapped to `expansion: "americas"`
  - `hummingbirds.json` contains the **40 hummingbird cards** from the Americas expansion (`Set: "americas"`) → mapped to `expansion: "americas"` with habitats `["forest", "grassland", "wetland"]` (since hummingbirds in *Wingspan: Americas* interact with the shared Hummingbird Garden across habitats).
  - Total across the 5 official sets: **597 bird cards** (`180 + 81 + 95 + 90 + 151`).
- **Alternatives considered**:
  - *Manual spreadsheet entry*: Impractical and error-prone for ~600 species.
  - *Including regional promo packs (`promoUS`, `promoCA`, etc.) by default*: Excluded from the 5 canonical expansion counts unless mapped or requested, keeping the 5 official boxes (`base`, `europe`, `oceania`, `asia`, `americas`) exact and true to physical tabletop sets.

---

## 2. Brazilian Portuguese (`name_pt`) Vernacular Resolution Pipeline

- **Decision**: Use a 3-tier resolution strategy in `scripts/build-full-seed.mjs` keyed by binomial `scientific` name:
  1. **Tier 1 (Curated Tabletop Overrides)**: Preserve existing verified Brazilian Portuguese card names in `src/data/birds-seed.json` (and official Grok Games PT-BR card titles).
  2. **Tier 2 (Wikidata Taxon Batch SPARQL — `wdt:P225`)**: Query `https://query.wikidata.org/sparql` in chunks of 150 scientific names for `LANG(?label) = "pt-br"` and `LANG(?label) = "pt"` labels, formatting vernacular names with standard capitalized hyphenation (e.g., `"Tucano-toco"`, `"Condor-dos-andes"`, `"Gavião-real"`).
  3. **Tier 3 (iNaturalist Taxa API `locale=pt-BR` + Vernacular Fallback)**: For any species whose scientific name is a taxonomic synonym or lacks a Portuguese label on Wikidata, query `https://api.inaturalist.org/v1/taxa?q=<scientific>&locale=pt-BR` for `preferred_common_name`, falling back to the official English card name only if no Portuguese vernacular name exists in ornithological databases.
- **Rationale**: Combines fast bulk resolution (~3 HTTP requests to Wikidata for ~600 birds) with high accuracy for Brazilian ornithological taxonomy (CBRO/WikiAves conventions).
- **Alternatives considered**:
  - *Machine translation of English bird names*: Rejected because literal translation of bird names produces non-existent species names in Portuguese (e.g., translating "Blue Jay" as "Jaime Azul" instead of "Gaio-azul"). Taxon-keyed lookup via `scientific` name guarantees authentic ornithological PT-BR names.

---

## 3. High-Throughput Audio Synchronization & Offline Bundle Size (`scripts/sync-birds.mjs`)

- **Decision**: Enhance `scripts/sync-birds.mjs` with bounded concurrency (`--concurrency 6`, default `4`) and fast offline synthesis fallback so all ~597 birds are guaranteed to have valid mono 32kbps `.mp3` files (`~15–24 KB` per bird, `~10–14 MB` total for all 597 birds).
- **Rationale**:
  - Sequential processing of 597 birds with network lookups would take 15+ minutes; bounded concurrency (e.g., 4–6 workers) reduces sync time by 4–5x while respecting API rate limits.
  - At ~20 KB per compressed clip, 597 audio files total **~12 MB**, well within the `<20 MB` target defined in `SC-002`.
- **Alternatives considered**:
  - *Remote streaming only*: Rejected because `PRODUCT.md` and `FR-002`/`FR-006` mandate 100% offline tabletop operation.

---

## 4. UI & Search Performance at ~600 Birds (`Fuse.js` + `FlatList`)

- **Decision**:
  - Extend `ExpansionId` union type to `'base' | 'europe' | 'oceania' | 'asia' | 'americas'` and add `EXPANSION_THEME.americas` in `src/theme/tokens.ts` (warm tropical emerald/amber-rose theme distinct from Base, Europe, Oceania, and Asia).
  - Pre-compute normalized strings (`norm_pt`, `norm_en`, `norm_scientific`) once at `BirdMatcher` construction and configure `FlatList` in `CatalogScreen.tsx` with `initialNumToRender={16}`, `maxToRenderPerBatch={16}`, and `windowSize={7}` for 60fps scrolling over 597 items.
- **Rationale**: Pre-normalized `Fuse.js` search over 600 items takes `<5ms` on mobile JS engines (well under the `100ms` requirement in `SC-003`), and virtualized `FlatList` batching prevents mount-time frame drops.


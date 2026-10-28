# Implementation Plan: Complete Wingspan Bird Catalog & All Expansions

**Branch**: `001-complete-bird-catalog` | **Date**: 2026-10-28 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/001-complete-bird-catalog/spec.md)

**Input**: Feature specification from `/specs/001-complete-bird-catalog/spec.md`

## Summary

Expand the PiaPiuPiu bird catalog from 40 sample birds to the complete official *Wingspan* roster (**597 unique bird cards**) covering all five official sets: **Base Game + Swift-Start (`base` — 180)**, **European Expansion (`europe` — 81)**, **Oceania Expansion (`oceania` — 95)**, **Asia Expansion (`asia` — 90)**, and **Americas Expansion (`americas` — 151: 111 standard + 40 hummingbirds)**.

The technical approach introduces:
1. An automated dataset builder (`scripts/build-full-seed.mjs`) that ingests the canonical `wingsearch` card databases (`master.json` + `hummingbirds.json`) and resolves official/vernacular Brazilian Portuguese names (`name_pt`) via a 3-tier taxonomic lookup (curated overrides → batched Wikidata `wdt:P225` SPARQL → iNaturalist `locale=pt-BR`).
2. Concurrent offline audio synchronization in `scripts/sync-birds.mjs` (supporting `americas` and bounded worker concurrency) to produce 597 mono 32kbps `.mp3` clips (~12 MB total) and update `src/data/birds.json` and `src/data/audioMap.ts`.
3. Full type, theme, matcher, and UI support for the `'americas'` (`Américas`) expansion across `src/types/bird.ts`, `src/theme/tokens.ts`, `src/components/FilterBar.tsx`, `src/services/birdMatcher.ts`, `src/screens/CatalogScreen.tsx`, `src/screens/ScannerScreen.tsx`, and `App.tsx`.

## Technical Context

**Language/Version**: TypeScript 5.3 / Node.js 24 (ESM scripts)

**Primary Dependencies**: Expo (~52.0.0), React Native (0.76.6), `fuse.js` (^7.0.0), `expo-av` (~15.0.0), `react-native-vision-camera` (^4.6.3), `tesseract.js`, `ffmpeg` (CLI audio transcoder)

**Storage**: Static bundled JSON (`src/data/birds-seed.json`, `src/data/birds.json`, `src/data/pt-names-cache.json`) and compressed local audio assets (`assets/audio/*.mp3` + `src/data/audioMap.ts`)

**Testing**: Jest + `ts-jest` (`npm test`) and TypeScript compiler (`npm run typecheck`)

**Target Platform**: Adaptive mobile (Android & iOS via Expo Prebuild) + Web (`react-native-web`)

**Project Type**: Mobile & Web companion application + Node.js data/audio build pipeline

**Performance Goals**: `<100ms` fuzzy search and OCR line matching across 597 birds; `60fps` virtualized list scrolling in `CatalogScreen`

**Constraints**: 100% offline runtime execution; total bundled audio directory `<20 MB` (~12–14 MB for 597 mono 32kbps clips); strict path and command-execution sanitization (`execFileSync` with array arguments, no shell interpolation)

**Scale/Scope**: 597 bird cards across 5 expansions (`base`, `europe`, `oceania`, `asia`, `americas`), 2 main screens (`ScannerScreen`, `CatalogScreen`), 2 CLI pipeline scripts (`build-full-seed.mjs`, `sync-birds.mjs`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Product & Security Alignment**:
  - **Offline Reliability (`PRODUCT.md` Principle #2)**: All 597 bird metadata entries and audio clips are bundled locally; runtime requires zero internet access. (PASS)
  - **Taxonomic Grounding (`PRODUCT.md` Principle #4)**: Binomial scientific names (`scientific`) serve as the primary taxonomic key for both Portuguese vernacular name lookup and ornithological audio retrieval. (PASS)
  - **Secure Command & Path Handling**: `scripts/build-full-seed.mjs` and `scripts/sync-birds.mjs` strictly validate IDs against `/^[a-z0-9_]+$/`, enforce directory containment via `path.resolve` prefix checks, and invoke `/usr/bin/ffmpeg` via `execFileSync` without shell interpolation. (PASS)
  - **Testability**: Unit tests verify catalog count (`>= 530`), presence of all 5 expansions (`base`, `europe`, `oceania`, `asia`, `americas`), fuzzy matching accuracy, and search latency (`<100ms`). (PASS)

## Project Structure

### Documentation (this feature)

```text
specs/001-complete-bird-catalog/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── catalog-and-cli.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
scripts/
├── build-full-seed.mjs  # [NEW] Ingests 597 cards from wingsearch + resolves PT-BR names
└── sync-birds.mjs       # [MODIFY] Adds 'americas' expansion, concurrency, and fast-synth support

src/
├── data/
│   ├── birds-seed.json      # [MODIFY] Expanded from 40 to 597 official Wingspan birds
│   ├── pt-names-cache.json  # [NEW] Cached scientific -> PT-BR common name mappings
│   ├── birds.json           # [MODIFY] Generated 597-bird runtime catalog with audio filenames
│   └── audioMap.ts          # [MODIFY] Generated static require() map for 597 audio files
├── types/
│   └── bird.ts              # [MODIFY] Add 'americas' to ExpansionId union
├── theme/
│   └── tokens.ts            # [MODIFY] Add EXPANSION_THEME.americas badge styling
├── components/
│   └── FilterBar.tsx        # [MODIFY] Include EXPANSION_THEME.americas in EXPANSION_META
├── services/
│   └── birdMatcher.ts       # [MODIFY] Include 'americas' in default active expansions
├── screens/
│   ├── CatalogScreen.tsx    # [MODIFY] Add FlatList virtualization tuning for 597 items
│   └── ScannerScreen.tsx    # [MODIFY] Add sample Americas card to test chips
└── __tests__/
    └── birdMatcher.test.ts  # [MODIFY] Add tests for 597-bird catalog, Americas filter, and <100ms perf

App.tsx                  # [MODIFY] Include 'americas' in ALL_EXPANSIONS
```

**Structure Decision**: Single mobile/web application repository with `scripts/` for offline dataset/audio generation and `src/` for the TypeScript React Native application.

## Complexity Tracking

No constitution violations.

# Tasks: Catálogo Completo de Pássaros e Expansões do Wingspan

**Input**: Design documents from `/specs/001-complete-bird-catalog/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/catalog-and-cli.md`, `quickstart.md`

**Tests**: Unit tests in `src/__tests__/birdMatcher.test.ts` are included to verify the expanded 597-bird dataset, `americas` expansion filtering, and `<100ms` fuzzy matching performance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `scripts/`, `assets/audio/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scripts and directory initialization for the 5-expansion catalog build pipeline

- [X] T001 Add `"build:seed": "node scripts/build-full-seed.mjs"` script to `package.json`
- [X] T002 [P] Initialize empty Portuguese vernacular lookup cache `{}` in `src/data/pt-names-cache.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, theme tokens, and dataset/audio CLI tooling that MUST be complete before user stories can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Add `'americas'` to the `ExpansionId` union type (`'base' | 'europe' | 'oceania' | 'asia' | 'americas'`) in `src/types/bird.ts`
- [X] T004 [P] Add `americas` expansion badge palette (`bg`, `border`, `text`, `label: 'Américas'`, `short: 'AM'`) to `EXPANSION_THEME` in `src/theme/tokens.ts`
- [X] T005 Implement canonical 597-bird seed generator (`wingsearch` `master.json` + `hummingbirds.json` + Wikidata SPARQL/iNaturalist PT-BR name resolver) in `scripts/build-full-seed.mjs`
- [X] T006 Update `ALLOWED_EXPANSIONS` to include `'americas'` and add `--concurrency <n>` and `--fast-synth` flags with hardened `execFileSync('/usr/bin/ffmpeg', ...)` in `scripts/sync-birds.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Scan & Identify Any Bird Across Base Game and All 4 Expansions (Priority: P1) 🎯 MVP

**Goal**: Expand the offline catalog from 40 to all 597 official *Wingspan* bird cards (`base`: 180, `europe`: 81, `oceania`: 95, `asia`: 90, `americas`: 151) with Portuguese, English, and scientific names plus bundled offline `.mp3` audio so that any physical card scanned or simulated in the Scanner is recognized and plays its bird call.

**Independent Test**: Run `jest` on `src/__tests__/birdMatcher.test.ts` to verify that all 597 birds across all 5 expansions are indexed, searchable in `<50ms` per query, and mapped to valid offline `.mp3` assets in `src/data/audioMap.ts`.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Add unit tests in `src/__tests__/birdMatcher.test.ts` asserting catalog length >= 530 (exact 597), presence of all 5 expansions (`base`, `europe`, `oceania`, `asia`, `americas`), and OCR fuzzy matching for representative birds from each expansion (including an `americas` hummingbird)

### Implementation for User Story 1

- [X] T008 [US1] Execute `npm run build:seed` to populate `src/data/pt-names-cache.json` and all 597 bird entries in `src/data/birds-seed.json`
- [X] T009 [US1] Execute `node scripts/sync-birds.mjs` to generate all 597 compressed `.mp3` files in `assets/audio/`, full catalog in `src/data/birds.json`, and static `require()` map in `src/data/audioMap.ts`
- [X] T010 [US1] Update default `activeExpansions` fallback array in `BirdMatcher` to `['base', 'europe', 'oceania', 'asia', 'americas']` in `src/services/birdMatcher.ts`
- [X] T011 [P] [US1] Add a sample `americas` bird card (`Beija-flor-rubi` / `Ruby-throated Hummingbird` / `Archilochus colubris`) to `SAMPLE_OCR_CARDS` in `src/screens/ScannerScreen.tsx`

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently — the Scanner and `BirdMatcher` recognize all 597 official birds and play their offline audio.

---

## Phase 4: User Story 2 - Filter & Browse the Complete Catalog Including the Americas Expansion (Priority: P2)

**Goal**: Expose the **Américas** (`americas`) expansion filter chip in both the Scanner and Catalog screens, enable all 5 expansions by default, and optimize `CatalogScreen` `FlatList` virtualization so browsing and searching all 597 birds remains smooth at 60 fps (`<100ms` search filter response).

**Independent Test**: Toggle expansion chips (`Base`, `Europa`, `Oceania`, `Ásia`, `Américas`) in the UI and run unit tests in `src/__tests__/birdMatcher.test.ts` verifying that `filterCatalog` accurately subsets the 597 birds by active expansions and text query in `<100ms`.

### Tests for User Story 2 ⚠️

- [X] T012 [P] [US2] Add unit tests in `src/__tests__/birdMatcher.test.ts` verifying `filterCatalog` with `['americas']` returns all 151 Americas birds, excludes disabled expansions, and completes full-catalog text filtering in `<100ms`

### Implementation for User Story 2

- [X] T013 [P] [US2] Add `americas: EXPANSION_THEME.americas` to `EXPANSION_META` in `src/components/FilterBar.tsx` so the `Américas` filter chip renders in Scanner and Catalog filter bars
- [X] T014 [P] [US2] Update `ALL_EXPANSIONS` default state to `['base', 'europe', 'oceania', 'asia', 'americas']` in `App.tsx`
- [X] T015 [US2] Tune `FlatList` virtualization props (`initialNumToRender={12}`, `maxToRenderPerBatch={12}`, `windowSize={7}`, `removeClippedSubviews`) for 597 items in `src/screens/CatalogScreen.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently — users can filter by `Américas` and browse/search all 597 birds smoothly.

---

## Phase 5: User Story 3 - Automated Synchronization of Complete Bird Dataset & Offline Audio Pack (Priority: P3)

**Goal**: Ensure developers and maintainers can incrementally re-run or filter the dataset and audio pipeline (`--expansion americas`, `--limit`, `--force`, `--fast-synth`) without re-downloading existing `.mp3` files and with complete documentation.

**Independent Test**: Run `node scripts/sync-birds.mjs --expansion americas --limit 5` on an already populated `assets/audio/` directory and verify it completes in `<3s` with 0 network downloads when cached files exist.

### Implementation for User Story 3

- [X] T016 [US3] Validate incremental cache-skip summary logging (`downloaded`, `synthesized`, `cached`, `total`) and CLI flag handling (`--expansion`, `--limit`, `--force`, `--concurrency`, `--fast-synth`) in `scripts/sync-birds.mjs`
- [X] T017 [P] [US3] Document `npm run build:seed` and `npm run sync:birds` 5-expansion CLI flags (`americas`, `--concurrency`, `--fast-synth`) in `README.md`

**Checkpoint**: All user stories are now independently functional and documented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories, bundle size budget verification, and type safety

- [X] T018 Verify total `assets/audio/` directory size is `<20 MB` (`du -sh assets/audio/`) and all 597 bird IDs in `src/data/birds.json` match keys in `src/data/audioMap.ts`
- [X] T019 Run `npm test` and `npm run typecheck` to confirm all unit tests pass and TypeScript compiles with 0 errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) generates the 597-bird dataset and audio assets (`T008`, `T009`)
  - User Story 2 (P2) wires the `americas` filter chip and `CatalogScreen` virtualization (can run in parallel with US1 after Phase 2, except `T012` which tests against the full 597-bird dataset from `T009`)
  - User Story 3 (P3) validates incremental CLI execution and updates `README.md`
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts immediately after Phase 2 (`T003`-`T006`)
- **User Story 2 (P2)**: UI tasks (`T013`, `T014`, `T015`) can start immediately after Phase 2 (`T003`, `T004`); test `T012` depends on `T009`
- **User Story 3 (P3)**: Starts after Phase 2 (`T005`, `T006`) and US1 dataset generation (`T009`)

### Parallel Opportunities

- `T001` and `T002` in Phase 1 can run in parallel
- `T003` (`src/types/bird.ts`) and `T004` (`src/theme/tokens.ts`) in Phase 2 can run in parallel
- `T010` (`src/services/birdMatcher.ts`), `T011` (`src/screens/ScannerScreen.tsx`), `T013` (`src/components/FilterBar.tsx`), `T014` (`App.tsx`), and `T015` (`src/screens/CatalogScreen.tsx`) touch separate files and can be implemented in parallel once Phase 2 completes

---

## Parallel Example: Foundational & UI Wiring

```bash
# Run Foundational type and theme updates in parallel:
Task: "T003 [P] Add 'americas' to ExpansionId in src/types/bird.ts"
Task: "T004 [P] Add americas badge palette to EXPANSION_THEME in src/theme/tokens.ts"

# Run UI and Matcher updates in parallel across separate files:
Task: "T011 [P] [US1] Add sample americas bird card to SAMPLE_OCR_CARDS in src/screens/ScannerScreen.tsx"
Task: "T013 [P] [US2] Add americas: EXPANSION_THEME.americas to EXPANSION_META in src/components/FilterBar.tsx"
Task: "T014 [P] [US2] Update ALL_EXPANSIONS in App.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`–`T002`)
2. Complete Phase 2: Foundational (`T003`–`T006`)
3. Complete Phase 3: User Story 1 (`T007`–`T011`)
4. **STOP and VALIDATE**: Verify all 597 birds and offline `.mp3` files are generated and `BirdMatcher` identifies cards from all 5 expansions.

### Incremental Delivery

1. Setup + Foundational → Core types, theme tokens, and seed/sync CLI ready
2. Add User Story 1 → Full 597-bird dataset + offline audio + Scanner recognition (MVP!)
3. Add User Story 2 → `Américas` filter chip in UI + virtualized 597-bird catalog browsing
4. Add User Story 3 → Resumable CLI verification + documentation
5. Polish → Bundle size (`<20 MB`) + `npm test` + `npm run typecheck`


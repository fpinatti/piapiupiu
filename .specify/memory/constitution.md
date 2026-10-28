<!--
Sync Impact Report:
- Version change: N/A (template v0.0.0) → 1.0.0 (Initial ratification & comprehensive project base knowledge)
- Modified principles:
  - [PRINCIPLE_1_NAME] → I. Table-Side Speed & Deliberate OCR Precision
  - [PRINCIPLE_2_NAME] → II. Taxonomic Grounding & Complete 597-Bird Bilingual Catalog
  - [PRINCIPLE_3_NAME] → III. Authentic Ornithological Media & Strict Single-Player Audio
  - [PRINCIPLE_4_NAME] → IV. Lightweight Bundle & On-Demand Streaming Architecture
  - [PRINCIPLE_5_NAME] → V. Security, Privacy & Zero Hardcoded Secrets
- Added sections:
  - Base Project Knowledge & Architecture (Conhecimento Base do Projeto)
  - Development Workflow, Testing & Quality Gates
- Removed sections: None
- Templates & Docs updated:
  - ✅ .specify/memory/constitution.md
  - ✅ .specify/templates/plan-template.md
  - ✅ PRODUCT.md
  - ✅ README.md
- Deferred items:
  - Application source code rebranding ("PiaPiuPiu" → "Piupiu U" in App.tsx, app.json, app.config.js) deferred per Scope Guard to Next Actions.
-->

# Piupiu U Constitution

## Core Principles

### I. Table-Side Speed & Deliberate OCR Precision

**Piupiu U** MUST deliver low-friction card recognition designed for one-handed operation at a physical *Wingspan* board game table under dim lighting and reflective plastic card sleeves:
- **Deliberate Still-Photo OCR**: Rather than running continuous blurred video-frame OCR, the scanner (`LiveCameraScanner.native.tsx` / `LiveCameraScanner.web.tsx`) MUST use user-triggered still-photo capture (`Fotografar e Ler Carta`) with EXIF orientation normalization (`skipProcessing: false`) and optical zoom presets (`1x`, `1.5x Ideal`, `2x`, `Macro`) so the phone can focus sharply at 15–20 cm from the card.
- **Header-Scoped Text Filtering**: OCR candidate lines MUST be filtered to the top title zone (`DEFAULT_TARGET_BOX`), stripping card power phrases (`QUANDO ATIVAR`, `WHEN PLAYED`, `ONCE BETWEEN TURNS`, etc.) and normalizing OCR character glitches (`GA1O-AZUL` → `gaio azul`) via `normalizeText.ts` and `boundingBoxFilter.ts`.
- **Sub-100ms Fuzzy Matching**: `BirdMatcher` (`Fuse.js`) MUST resolve any card title across all 597 birds in under `100ms`.

### II. Taxonomic Grounding & Complete 597-Bird Bilingual Catalog

Binomial scientific names (`scientific`) MUST serve as the universal, immutable taxonomic key connecting board game editions to real-world ornithological audio and photography:
- **Complete 5-Expansion Roster (597 Birds)**: The catalog (`src/data/birds-seed.json` and `src/data/birds.json`) MUST maintain all **597 official *Wingspan* bird cards** across all 5 official sets:
  - **Base Game + Swift-Start (`base`)**: 180 birds
  - **European Expansion (`europe`)**: 81 birds
  - **Oceania Expansion (`oceania`)**: 95 birds
  - **Asia Expansion (`asia`)**: 90 birds
  - **Americas Expansion (`americas`)**: 151 birds (111 standard + 40 hummingbirds)
- **Trilingual Indexing**: Every bird record MUST contain `id` (`snake_case`), `name_pt` (Brazilian Portuguese vernacular/Grok Games title), `name_en` (official English Stonemaier Games title), `scientific` (binomial Latin name), `expansion`, and `habitats` (`forest`, `grassland`, `wetland`).

### III. Authentic Ornithological Media & Strict Single-Player Audio

All bird vocalizations and photographs presented to players MUST be authentic biological recordings and photographs sourced from open-science repositories keyed by `bird.scientific` (with `bird.name_en` fallback):
- **Real Field Recordings Only**: `audioService.ts` MUST stream authentic field recordings (`.mp3` / `.m4a`) from **iNaturalist Research-Grade Sounds API** (`https://api.inaturalist.org/v1/observations?taxon_name=...&sounds=true`) and/or **Xeno-Canto API v3** (`https://xeno-canto.org/api/3/recordings`). Synthetic sine-wave tones MUST NOT be used for runtime playback.
- **Strict Single-Player Exclusivity**: `audioService.ts` MUST guarantee that **multiple bird sounds never play simultaneously**. Starting a new bird call or toggling playback MUST immediately increment `playRequestId`, cancel any in-flight resolution, and pause/remove the active `AudioPlayer` instance (`expo-audio` on native, `HTMLAudioElement` on web) before starting the next sound.
- **Real Open-Source Bird Photography**: `birdImageService.ts` and `<BirdPhoto>` MUST resolve real species photographs from **iNaturalist Taxa API v1** (`default_photo.medium_url` / `large_url`) as primary source and **Wikipedia REST API v1 (`page/summary`)** (Wikimedia Commons) as fallback, without requiring private API keys.
- **Non-Blocking Parallel Media**: Loading or failing to load a bird photograph MUST NEVER block, delay, or interrupt audio playback.

### IV. Lightweight Bundle & On-Demand Streaming Architecture

The runtime application bundle MUST remain lightweight (`<5 MB`) so OTA updates via **EAS Update** and **Expo Go** download in seconds:
- **Zero Bundled Media Bloat**: Static `require()` maps for the 597 `.mp3` files or 597 bird images MUST NOT be imported into the runtime JavaScript bundle (`src/data/audioMap.ts` exports an empty runtime map `{}`). Local `.mp3` files in `assets/audio/` may be kept in the repository strictly as offline reference/archive assets.
- **Session Caching & Request Deduplication**: Both `audioService.ts` and `birdImageService.ts` MUST cache resolved media URLs in memory (`Map`) for the duration of the session and deduplicate concurrent in-flight lookups so repeated views render in `<100ms` without redundant network traffic.
- **Expo SDK 58 Compatibility**: The project targets **Expo SDK 58** (`expo@~58.0.20`, `react@19.3.0`, `react-native@0.88.0`) with `runtimeVersion: { "policy": "sdkVersion" }` (`exposdk:58.0.0`) so standard **Expo Go** clients can run the app without requiring custom native builds.

### V. Security, Privacy & Zero Hardcoded Secrets

All code, configuration, and build scripts MUST adhere to strict security hygiene:
- **Environment Variable Isolation**: Sensitive or account-specific identifiers (`EXPO_PUBLIC_EAS_PROJECT_ID`, `EXPO_PUBLIC_EXPO_OWNER`, `EXPO_PUBLIC_XENO_CANTO_API_KEY`) MUST be stored exclusively in `.env` (gitignored) and loaded dynamically via `app.config.js` (with `.env.example` committed as template). Hardcoded secrets or account IDs MUST NOT be committed to `app.json` or source files.
- **Strict Remote URL Allow-Listing**: All remote image and audio URLs retrieved from external APIs MUST be validated as `https:` against an explicit domain allow-list (`static.inaturalist.org`, `inaturalist-open-data.s3.amazonaws.com`, `upload.wikimedia.org`, `xeno-canto.org`) before rendering or playback.
- **Safe CLI & Path Handling**: Node.js pipeline scripts (`scripts/build-full-seed.mjs`, `scripts/sync-birds.mjs`) MUST validate bird IDs against `/^[a-z0-9_]+$/`, verify path boundaries using `path.resolve`, and invoke binaries (`ffmpeg`) via `execFileSync` with array arguments (never shell interpolation).

## Base Project Knowledge & Architecture

### Brand & Identity
- **Application Name**: **Piupiu U** (formerly *PiaPiuPiu*).
- **Tagline**: Guia Sonoro e Visual para *Wingspan* (*Wingsong Companion*).
- **Primary Language**: Interface in Brazilian Portuguese (PT-BR); simultaneous card search and OCR recognition in PT-BR, English (EN), and Latin (`scientific`).

### Technical Stack & Platform Resolution
- **Runtime Stack**: TypeScript 5.9, Expo SDK 58 (`expo@~58.0.20`), React 19.3.0, React Native 0.88.0, `expo-audio@~58.0.10`, `expo-camera@~58.0.13`, `react-native-webview@14.0.1`, `react-native-safe-area-context@~5.7.0`, `fuse.js@^7.0.0`, `tesseract.js@^5.1.0`.
- **Metro Platform File Resolution Rule**:
  - `src/components/LiveCameraScanner.types.ts`: Shared TypeScript props interface.
  - `src/components/LiveCameraScanner.tsx`: Default/TypeScript entrypoint re-exporting `./LiveCameraScanner.native`.
  - `src/components/LiveCameraScanner.native.tsx`: Android/iOS implementation using `expo-camera` (`CameraView`) + hidden `react-native-webview` running Tesseract.js on captured still photos.
  - `src/components/LiveCameraScanner.web.tsx`: Browser implementation using WebRTC `<video>` + `tesseract.js`.
  - **CRITICAL RULE**: Never create a bare `LiveCameraScanner.ts` file (extension `.ts` takes precedence over `.native.tsx` in Metro's `sourceExts` order and causes web DOM tags like `<input>` to crash Android/iOS).
- **Babel Configuration (`babel.config.js`)**: Uses `babel-preset-expo` only (do not add legacy `react-native-worklets-core/plugin`).

### Key Repository Layout
- `App.tsx`: Top-level navigation (`Scanner de Cartas` vs. `Catálogo (597)`), expansion/language filter state, and persistent bottom Mini-Player with `<BirdPhoto variant="mini" />`.
- `src/screens/ScannerScreen.tsx`: Camera scanner screen, quick simulation chips across all 5 expansions, `<BirdPlayingCard />` hero overlay, and recent scan history.
- `src/screens/CatalogScreen.tsx`: Virtualized `FlatList` (`windowSize={7}`, `initialNumToRender={12}`) over all 597 birds with `<BirdPhoto variant="thumbnail" enableZoom />`.
- `src/components/BirdPlayingCard.tsx`: Highlighted card overlay showing expansion/habitat badges, `<BirdPhoto variant="hero" enableZoom />`, trilingual names, and play/stop audio button.
- `src/components/BirdPhoto.tsx`: Reusable bird avatar & full-screen zoom modal component.
- `src/services/audioService.ts`: Single-instance ornithological audio streamer (iNaturalist Sounds API + Xeno-Canto v3).
- `src/services/birdImageService.ts`: Open-source bird photo resolver (iNaturalist Taxa API + Wikipedia REST API) with session cache and HTTPS allow-list.
- `src/services/birdMatcher.ts`: `Fuse.js` fuzzy search and OCR line matcher.
- `scripts/build-full-seed.mjs` & `scripts/sync-birds.mjs`: Offline catalog seed builder and reference audio synchronizer.

## Development Workflow, Testing & Quality Gates

- **Type Safety Gate**: Every change MUST pass `npm run typecheck` (`tsc --noEmit`) with zero errors. Note that in React Native 0.88+, `StyleSheet.absoluteFill` MUST be used instead of deprecated `StyleSheet.absoluteFillObject`, and `SafeAreaView` MUST be imported from `react-native-safe-area-context`.
- **Automated Test Gate**: Every change MUST pass `npm test` (Jest unit test suites in `src/__tests__/`: `birdMatcher.test.ts`, `birdImageService.test.ts`, `boundingBoxFilter.test.ts`, `normalizeText.test.ts`).
- **OTA Preview Deployment**: Updates to Expo Go preview branch are published via `npm run update:preview` (or `npm run update:preview -- "Mensagem customizada"`). Before committing, verify `git status` and `git diff` to ensure `eas-cli` did not inject hardcoded `projectId` or `owner` fields back into `app.json`.

## Governance

- **Authority**: This Constitution is the supreme architectural and product reference for **Piupiu U**. All Spec Kit artifacts (`spec.md`, `plan.md`, `tasks.md`) and code changes MUST comply with its principles.
- **Amendment Procedure**: Amendments to this Constitution MUST be made via `/speckit-constitution` (or documented pull request updating `.specify/memory/constitution.md`), accompanied by a Sync Impact Report and propagation to `PRODUCT.md`, `README.md`, and `.specify/templates/`.
- **Versioning Policy**: Semantic Versioning (`MAJOR.MINOR.PATCH`):
  - `MAJOR`: Incompatible removal or redefinition of a Core Principle.
  - `MINOR`: Addition of a new Core Principle, architectural constraint, or expansion scope.
  - `PATCH`: Wording clarifications, brand updates, or non-normative refinements.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28

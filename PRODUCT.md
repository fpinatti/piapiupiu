# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary users are tabletop board game players playing **Wingspan** (base game and expansions: European, Oceania, Asia) around a physical table. They hold a bird card in one hand and their phone in the other, often in warm or dim living-room lighting, with cards inside reflective plastic sleeves, and in locations (such as cabins or game nights) where internet connectivity may be weak or absent.

## Product Purpose

**PiaPiuPiu** is a recreation of the discontinued *Wingsong* companion app for *Wingspan*. It lets players point their phone camera at a *Wingspan* bird card—or search the catalog manually—to immediately hear the authentic vocalization of that bird species and view its ornithological card context. Success means sub-second recognition without false positives, instant offline audio playback, and zero friction during a turn at the gaming table.

## Positioning

Rather than using fragile visual neural-network image classification on 400+ small, similarly framed bird illustrations, PiaPiuPiu performs real-time on-device Optical Character Recognition (OCR) constrained to a virtual bounding box over the top card title, paired with diacritic- and glare-tolerant fuzzy matching (`Fuse.js`) across official Brazilian Portuguese (Grok Games), English (Stonemaier Games), and universal binomial scientific names, triggering pre-compressed offline audio assets.

## Operating Context

- **At the gaming table**: One-handed phone operation during a *Wingspan* match; frequent glare from card sleeves and angled table lighting; players frequently pass the phone or scan cards in quick succession.
- **Bilingual table environment**: Tables in Brazil play with either the Brazilian Portuguese (Grok) edition, imported English expansions, or mixed decks, requiring simultaneous PT-BR, EN, and scientific-name matching and filtering.
- **100% Offline execution**: All bird metadata and compressed audio clips are bundled locally so the app works without network access.

## Capabilities and Constraints

- **Real-time OCR Scanner (`ScannerScreen`)**: Uses `react-native-vision-camera` v4 Frame Processors + Google ML Kit Text Recognition (`react-native-vision-camera-text-recognition`) on native Android/iOS, filtering text lines to the top targeting box (`DEFAULT_TARGET_BOX`), stripping ability/power text (`QUANDO ATIVAR`, `WHEN PLAYED`, etc.), normalizing OCR glitches (`GA1O-AZUL` -> `gaio azul`), and enforcing a 6-second per-bird anti-spam debounce cooldown.
- **Interactive Web & Simulator Mode (`LiveCameraScanner.web.tsx`)**: Provides WebRTC browser webcam preview and an interactive OCR simulator bar for testing card recognition and sleeve-glare tolerance in the browser or emulator.
- **Searchable Bilingual Catalog & Collection Mode (`CatalogScreen`)**: Instant fuzzy search and filtering by expansion (`base`, `europe`, `oceania`, `asia`) and language (`all`, `pt`, `en`), with planned expansion from the initial 40-bird seed dataset (`src/data/birds-seed.json`) to the full ~450+ *Wingspan* bird catalog and richer ornithological card details (habitats, wingspan, lore/curiosities).
- **Automated Audio Pipeline (`scripts/sync-birds.mjs`)**: Node.js + `ffmpeg` script that fetches ornithological recordings by scientific name (Xeno-Canto / iNaturalist), transcodes them to mono 32kbps (max 6s with 1s fade-out, ~12–24 KB per bird), and generates `src/data/birds.json` and `src/data/audioMap.ts`.

## Brand Commitments

- **Name**: PiaPiuPiu (Wingsong Companion).
- **Voice & Copy**: Primary UI copy in Brazilian Portuguese (PT-BR), with bilingual PT-BR and English support for all bird names and Latin scientific taxonomy.

## Evidence on Hand

- `src/data/birds-seed.json` & `src/data/birds.json`: 40 curated *Wingspan* birds across Base, Europe, Oceania, and Asia expansions with official PT-BR names, English names, scientific names, and habitat tags.
- `assets/audio/*.mp3` & `src/data/audioMap.ts`: 40 real ornithological vocalization clips downloaded and transcoded via `ffmpeg` (944 KB total).
- `src/__tests__/`: 17 unit tests verifying text normalization, bounding-box coordinate filtering, `Fuse.js` fuzzy matching, and 6-second debounce logic.
- Full ~450+ card dataset and extended ornithological curiosity fields (wingspan cm, flavor text, geographic range) are not yet populated in `src/data/birds-seed.json` and must be sourced from real card data rather than fabricated.

## Product Principles

1. **Table-Side Speed & Zero Ceremony**: Scanning a card or tapping a bird in the catalog must play its song immediately without modal clutter or multi-step confirmation.
2. **Offline Reliability First**: Core scanning, fuzzy search, and bird vocalizations must function 100% offline with deterministic local assets.
3. **Glare & Language Tolerance**: Treat sleeve reflections, dim lighting, and mixed PT-BR/EN decks as the norm—normalize aggressively and scope OCR strictly to the card header.
4. **Authentic Ornithological Grounding**: Use binomial scientific names (`latin name`) as the universal key linking board game editions to real-world ornithological data and recordings.


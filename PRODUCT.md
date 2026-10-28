# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary users are tabletop board game players playing **Wingspan** (Base game and all expansions: European, Oceania, Asia, Americas) around a physical table. They hold a bird card in one hand and their phone in the other, often in warm or dim living-room lighting, with cards inside reflective plastic sleeves.

## Product Purpose

**Piupiu U** (formerly *PiaPiuPiu*) is a modern recreation of the discontinued *Wingsong* companion app for *Wingspan*. It lets players photograph a *Wingspan* bird card—or search the complete 597-bird catalog manually—to immediately hear the authentic field vocalization of that bird species and view its real-life photograph and ornithological card context. Success means accurate card recognition without hand-shake blur, authentic bird songs with single-player audio exclusivity, real species photographs, and a lightweight app bundle that updates in seconds.

## Positioning

Rather than using fragile visual neural-network image classification on 597 small, similarly framed bird illustrations, **Piupiu U** uses deliberate still-photo Optical Character Recognition (OCR) with optical zoom presets (`1x`, `1.5x Ideal`, `2x`, `Macro`) constrained to the top card header, paired with diacritic- and glare-tolerant fuzzy matching (`Fuse.js`) across official Brazilian Portuguese (Grok Games), English (Stonemaier Games), and universal binomial scientific names, streaming real ornithological recordings and photographs on demand.

## Operating Context

- **At the gaming table**: One-handed phone operation during a *Wingspan* match; frequent glare from card sleeves and angled table lighting; players frequently pass the phone or scan cards in quick succession.
- **Trilingual table environment**: Tables in Brazil play with either the Brazilian Portuguese (Grok) edition, imported English expansions, or mixed decks, requiring simultaneous PT-BR, EN, and scientific-name matching and filtering across all **597 birds** (`base`: 180, `europe`: 81, `oceania`: 95, `asia`: 90, `americas`: 151).
- **Lightweight On-Demand Media**: Metadata for all 597 birds is bundled locally for instant `<100ms` search, while authentic audio recordings (iNaturalist Research-Grade Sounds / Xeno-Canto v3) and species photographs (iNaturalist Taxa API / Wikimedia Commons) are streamed on demand and cached in memory so the app bundle remains tiny (`~2.2 MB`).

## Capabilities and Constraints

- **Deliberate Still-Photo OCR Scanner (`ScannerScreen` + `LiveCameraScanner`)**: Uses `expo-camera` (`CameraView`) with zoom controls (`1x`, `1.5x Ideal`, `2x`, `Macro`) and a WebView Tesseract.js OCR worker on mobile (and WebRTC + Tesseract.js on Web), normalizing EXIF rotation (`skipProcessing: false`), stripping power text (`QUANDO ATIVAR`, `WHEN PLAYED`, etc.), and matching card titles via `Fuse.js`.
- **Authentic Audio Streaming (`audioService.ts`)**: Streams real research-grade bird vocalizations by scientific name from iNaturalist Sounds API and Xeno-Canto API v3 via `expo-audio`, enforcing strict single-player disposal so two sounds never overlap.
- **Real Bird Photography (`birdImageService.ts` + `BirdPhoto.tsx`)**: Displays curated species photographs from iNaturalist Taxa API v1 and Wikipedia REST API v1 in `BirdPlayingCard`, `CatalogScreen`, and the Mini-Player, including tap-to-zoom full-screen modal view.
- **Searchable 597-Bird Catalog (`CatalogScreen`)**: Instant fuzzy search and filtering by expansion (`base`, `europe`, `oceania`, `asia`, `americas`) and language (`all`, `pt`, `en`).

## Brand Commitments

- **Name**: **Piupiu U** (Wingsong Companion).
- **Voice & Copy**: Primary UI copy in Brazilian Portuguese (PT-BR), with full PT-BR, English, and Latin scientific taxonomy support.

## Product Principles

1. **Table-Side Speed & Deliberate OCR Precision**: Capturing a card or tapping a bird in the catalog must recognize the species accurately and play its song without modal clutter.
2. **Taxonomic Grounding**: Use binomial scientific names (`scientific`) as the universal key linking all 597 board game cards to real-world ornithological audio and photographs.
3. **Authentic Media & Single-Player Exclusivity**: Play only real ornithological recordings (never synthetic sine waves), never allow overlapping audio playback, and load photos in parallel without blocking sound.
4. **Lightweight Bundle & Secure Config**: Keep the app bundle lightweight (`<5 MB`) for fast Expo Go / EAS updates and isolate all project/API credentials in `.env` variables via `app.config.js`.

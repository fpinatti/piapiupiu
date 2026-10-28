# Quickstart & Validation Guide: Complete Wingspan Bird Catalog

**Feature**: `001-complete-bird-catalog`
**Date**: 2026-10-28

---

## Prerequisites

- **Node.js**: v20+ (`node -v`)
- **ffmpeg**: Installed at `/usr/bin/ffmpeg` (`which ffmpeg`)
- **Dependencies**: Installed via `npm install --legacy-peer-deps`

---

## Step 1: Build the Complete 5-Expansion Seed Dataset (`birds-seed.json`)

Run the seed builder to ingest all official cards across **Base** (180), **Europe** (81), **Oceania** (95), **Asia** (90), and **Americas** (151 = 111 standard + 40 hummingbirds) and resolve Portuguese common names:

```bash
npm run build:seed
```

**Expected Outcome**:
- `src/data/birds-seed.json` is written with **597** unique bird entries.
- Every entry has `id`, `name_pt`, `name_en`, `scientific`, `expansion` (`base | europe | oceania | asia | americas`), and `habitats`.

---

## Step 2: Synchronize & Compress Offline Audio Pack (`birds.json` + `audioMap.ts`)

Run the audio synchronization pipeline:

```bash
npm run sync:birds
```

**Expected Outcome**:
- `assets/audio/` contains 597 `.mp3` files (`<20 MB` total directory size).
- `src/data/birds.json` and `src/data/audioMap.ts` are updated with all 597 birds.

---

## Step 3: Run Automated Verification Suite

Execute unit tests and TypeScript typechecking:

```bash
npm test && npm run typecheck
```

**Expected Outcome**:
- Unit tests verify:
  - Catalog completeness (>530 birds across all 5 expansions: `base`, `europe`, `oceania`, `asia`, `americas`)
  - Fuzzy matching on birds from each expansion (including `americas` species like *Ramphastos toco* / `TUCANO-TOCO` and hummingbirds)
  - Expansion filtering for `americas`
  - Search latency `<100ms` across the full catalog.

---

## Step 4: Verify in Web or Mobile App

Start the application:

```bash
npm run web
# or on Android device:
npx expo run:android
```

1. Open the **Catálogo** tab and confirm the total count displays all ~597 birds.
2. Tap the **Américas** expansion chip in the filter bar and verify that Americas birds (such as *Tucano-toco / Toco Toucan*, *Condor-dos-andes / Andean Condor*, *Gavião-real / Harpy Eagle*, and hummingbirds) are listed and play their audio when tapped.
3. Switch to **Scanner de Cartas** and scan or test an Americas card title to confirm instant recognition and audio playback.


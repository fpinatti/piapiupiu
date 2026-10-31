# Implementation Plan: Living 2D Bird Artwork with React Native Skia (006-skia-bird-motion)

**Branch**: `006-skia-bird-motion` | **Date**: 2026-10-31 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/006-skia-bird-motion/spec.md)

**Input**: Feature specification from `/specs/006-skia-bird-motion/spec.md`

## Summary

Bring static 2D Wingspan bird card artwork to life using Google's Skia 2D graphics engine via `@shopify/react-native-skia` directly on the device GPU. Implement:
1. A **2.5D Optical Parallax Depth** system responsive to mobile device tilt (gyroscope) with touch-drag and autonomous idle sway fallbacks.
2. A subtle **Organic Breathing & Wing Wave Living Mesh** (SkSL runtime shader oscillation at ~0.28 Hz) giving life to the bird figure without manual vector rigging.
3. An **Atmospheric Particle System** tailored to each habitat (falling leaves for Forest, floating pollen for Grassland, mist droplets for Wetland) and melodic watercolor notes emanating during bird song playback.
4. Performance and accessibility guardrails (60 FPS rendering, immediate suspension when card is dismissed, and full OS reduced-motion compliance).

---

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3.0, React Native 0.88.0

**Primary Dependencies**:
- `@shopify/react-native-skia`: 2D GPU rendering engine via JSI
- `expo-sensors`: First-party Expo SDK 58 orientation/gyroscope sensor tracking
- `@expo/vector-icons`, `react-native-safe-area-context`

**Storage**: In-memory state only (active tilt angles, particle array); zero persistence or database required.

**Testing**: Jest (Node environment) for physics, layer translation offsets, breathing oscillation, and particle lifecycles (`src/__tests__/livingCardPhysics.test.ts`), plus TypeScript compiler (`npm run typecheck`).

**Target Platform**: Mobile (Android & iOS on Expo SDK 58) with graceful touch-drag and CSS/Image fallback on Web.

**Project Type**: Mobile companion app (Expo React Native).

**Performance Goals**:
- Stable 60 FPS GPU rendering during active parallax motion and particle emissions.
- Zero audio glitching or frame drops during concurrent bird vocalization streaming.
- 0% GPU utilization when no bird card is open (loop automatically paused).

**Constraints**:
- Render loop strictly scoped to the active single-card inspection view (`BirdPlayingCard.tsx` / `BirdPhoto` zoom modal); NEVER run in the 597-item catalog FlatList.
- Must honor OS `AccessibilityInfo.isReduceMotionEnabled()`.
- Lightweight bundle impact (<500 KB total Skia runtime overhead, well within Constitution Principle IV <5MB limit).
- Strictly adhere to the Wingspan Naturalist Field Guide visual identity (`DESIGN.md`).

**Scale/Scope**:
- 1 new utility module: `src/utils/livingCardPhysics.ts` (pure math for parallax, breathing, and particles)
- 1 new hook: `src/hooks/useBirdMotion.ts` (gyroscope sensor + touch drag + idle harmonic sway)
- 1 new graphics component: `src/components/LivingBirdArtwork.tsx` (Skia canvas with parallax, SkSL breathing shader, and particles)
- Integration into `src/components/BirdPlayingCard.tsx`
- 1 new test suite: `src/__tests__/livingCardPhysics.test.ts`

---

## Constitution Check

*GATE: Re-evaluated post Phase 1 design.*

- **I. Table-Side Speed & Deliberate OCR Precision**: **PASS**. Living card rendering is isolated strictly to the hero inspection view and operates asynchronously on the GPU. Table-side scanning, fuzzy matching (<100ms), and camera operation remain completely unaffected.
- **II. Taxonomic Grounding & Complete 597-Bird Bilingual Catalog**: **PASS**. Applies automatically to any of the 597 bird records without requiring species-specific vector authoring. Habitat particle themes map directly to official Wingspan habitats (`forest`, `grassland`, `wetland`).
- **III. Authentic Ornithological Media & Strict Single-Player Audio**: **PASS**. Living motion wraps authentic open-source photography. Musical note particles strictly listen to `audioService` state without interfering with audio streaming or violating single-player audio exclusivity.
- **IV. Lightweight Bundle & On-Demand Streaming Architecture**: **PASS**. Avoids storing heavy 3D assets or pre-rendered video clips. Skia uses pure shader mathematics and procedural particle draws. Total added JS footprint is <40 KB.
- **V. Security, Privacy & Zero Hardcoded Secrets**: **PASS**. Operates 100% locally on device GPU with zero remote network endpoints, credentials, or telemetry.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-skia-bird-motion/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Domain & technical research
├── data-model.md        # Entities, physics parameters, and state lifecycle
├── quickstart.md        # Quickstart validation and test guide
├── contracts/
│   └── living-card-contract.ts # Interface contracts & simulation types
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── LivingBirdArtwork.tsx       # Skia 2.5D parallax, breathing shader & particle canvas
│   ├── BirdPlayingCard.tsx         # Integrated hero bird card with LivingBirdArtwork
│   ├── BirdPhoto.tsx               # (Existing) Photo resolver & zoom modal
│   └── WatercolorIcon.tsx          # (Existing) Botanical watercolor badges
├── hooks/
│   └── useBirdMotion.ts            # Tilt sensor (gyroscope), touch pan & idle harmonic motion
├── utils/
│   └── livingCardPhysics.ts        # Pure physics (parallax offset, breathing math, particles)
└── __tests__/
    └── livingCardPhysics.test.ts   # Unit test suite for simulation physics & edge cases
```

**Structure Decision**: Standard Expo React Native component and hook hierarchy within existing `src/` modules.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Procedural 2D GPU shaders avoid the massive complexity of manual vector re-authoring for 597 birds |

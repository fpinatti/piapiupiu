# Implementation Plan: Wingspan Score Pad Calculator (005-score-pad-calculator)

**Branch**: `005-score-pad-calculator` | **Date**: 2026-10-28 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/005-score-pad-calculator/spec.md)

**Input**: Feature specification from `/specs/005-score-pad-calculator/spec.md`

## Summary

Implement an interactive Wingspan end-game scoring sheet ("Bloco de Pontuação") simulating physical scorepads for 2 players. Supports standard base game rules alongside official expansions (Oceania with Nectar, Americas with Hummingbirds). As values are entered into category rows, total points for each player recalculate in real-time with instant winner detection. The screen adheres to the Naturalist Field Guide visual system (`DESIGN.md`, warm linen surfaces, watercolor badges, organic blob buttons) and maintains session state across bottom tab navigation.

---

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3.0, React Native 0.88.0

**Primary Dependencies**: Expo SDK 58 (`expo@~58.0.20`), `react-native-safe-area-context@~5.7.0`, `@expo/vector-icons`

**Storage**: In-memory React state (`useState` / session state) lifted or preserved in `App.tsx` during application lifecycle; zero local storage or database required.

**Testing**: Jest (Node environment) for pure arithmetic and input sanitization (`src/__tests__/scoreCalculator.test.ts`), TypeScript compiler (`npm run typecheck`).

**Target Platform**: Mobile (Android & iOS via Expo Go SDK 58) and Web (`LiveCameraScanner.web.tsx` / Metro web).

**Project Type**: Mobile companion app (Expo React Native).

**Performance Goals**: Instantaneous score recalculation (<16ms, under single animation frame) on keypress; smooth 60fps scrolling.

**Constraints**:
- 100% offline functionality with zero network requests.
- Lightweight bundle impact (<50 KB TypeScript code; zero static binary assets).
- Strict adherence to `DESIGN.md` natural linen palette (`#F5F0E6`, `#FCFAF7`), watercolor badges (`WatercolorIcon`), and two-level organic blob buttons (`WatercolorBlobButton`).
- Accessible touch targets (≥44px input touch zones).

**Scale/Scope**:
- 1 new utility module: `src/utils/scoreCalculator.ts`
- 1 new screen component: `src/screens/ScorepadScreen.tsx`
- 1 new test suite: `src/__tests__/scoreCalculator.test.ts`
- Navigation integration in `App.tsx` (adding 3rd tab "Pontuação" to bottom bar).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Table-Side Speed & Deliberate OCR Precision**: **PASS**. Scorepad calculations execute synchronously in `<1ms`, preserving rapid table-side end-game tallying. Scanner and camera OCR remain untouched.
- **II. Taxonomic Grounding & Complete 597-Bird Bilingual Catalog**: **PASS**. Scoring categories align with official Stonemaier & Grok Games terminology across Base, Americas, and Oceania expansions. Catalog and bird datasets remain fully intact.
- **III. Authentic Ornithological Media & Strict Single-Player Audio**: **PASS**. The scorepad is a quiet table tool; it emits no synthetic audio and does not disrupt background audio streaming.
- **IV. Lightweight Bundle & On-Demand Streaming Architecture**: **PASS**. Adds only TypeScript logic and layout components. Zero bundled audio or raster media; total added bundle weight is <50 KB, well within the `<5 MB` budget.
- **V. Security, Privacy & Zero Hardcoded Secrets**: **PASS**. Operates 100% client-side in memory with zero API requests, external scripts, or hardcoded secrets.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-score-pad-calculator/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Domain & technical research
├── data-model.md        # Entities, types, and validation rules
├── quickstart.md        # Quickstart validation and testing guide
├── contracts/
│   └── scorepad-contract.ts  # Interface contracts & category seed data
└── checklists/
    └── requirements.md  # Quality and completeness checklist
```

### Source Code (repository root)

```text
src/
├── types/
│   └── scorepad.ts             # Shared types (ScoreCategoryDefinition, ScorepadState, etc.)
├── utils/
│   └── scoreCalculator.ts      # Pure calculation, sanitization, and evaluation logic
├── screens/
│   ├── ScorepadScreen.tsx      # Main 2-player scorepad calculator screen
│   ├── ScannerScreen.tsx       # (Existing) Camera OCR scanner screen
│   └── CatalogScreen.tsx       # (Existing) 597-bird catalog screen
├── components/
│   ├── WatercolorBlobButton.tsx# (Existing) Two-level organic blob button
│   └── WatercolorIcon.tsx      # (Existing) Organic watercolor icon badge
└── __tests__/
    └── scoreCalculator.test.ts # Unit tests for calculation & sanitization

App.tsx                         # Bottom bar tab navigation & persistent session state
```

**Structure Decision**: Standard Expo React Native single project structure matching existing components and screens.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Feature adheres strictly to lightweight, zero-dependency in-memory React architecture |

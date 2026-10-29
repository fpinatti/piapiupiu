# Implementation Plan: Wingspan Score Pad Calculator (005-score-pad-calculator)

**Branch**: `005-score-pad-calculator` | **Date**: 2026-10-29 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/005-score-pad-calculator/spec.md)

**Input**: Feature specification from `/specs/005-score-pad-calculator/spec.md` (Updated to single unified table with expansion annotations)

## Summary

Refine the Wingspan scorepad ("Bloco de Pontuação") to eliminate the version/expansion selector pills in favor of a single, unified all-in-one table. All 8 official scoring categories are always accessible in one place: the 6 core base game categories plus Beija-flores (annotated with `[Américas]`) and Néctar (annotated with `[Oceania]`). Unused expansion fields left blank safely evaluate as 0, allowing players to tally standard, single-expansion, or combined-expansion games without modal configuration. Real-time summation, winner calculation, custom player names, "Novo Jogo" reset, and tab session persistence are fully preserved within the Naturalist Field Guide visual system.

---

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3.0, React Native 0.88.0

**Primary Dependencies**: Expo SDK 58 (`expo@~58.0.20`), `react-native-safe-area-context@~5.7.0`, `@expo/vector-icons`

**Storage**: In-memory React state preserved in `App.tsx` during application lifecycle; zero local storage or database required.

**Testing**: Jest (Node environment) for pure arithmetic and input sanitization (`src/__tests__/scoreCalculator.test.ts`), TypeScript compiler (`npm run typecheck`).

**Target Platform**: Mobile (Android & iOS via Expo Go SDK 58) and Web (`LiveCameraScanner.web.tsx` / Metro web).

**Project Type**: Mobile companion app (Expo React Native).

**Performance Goals**: Instantaneous score recalculation (<16ms, single frame) on keypress; smooth 60fps scrolling.

**Constraints**:
- 100% offline functionality with zero network requests.
- Lightweight bundle impact (<50 KB TypeScript code; zero static binary assets).
- Strict adherence to `DESIGN.md` natural linen palette (`#F5F0E6`, `#FCFAF7`), watercolor badges (`WatercolorIcon`), and two-level organic blob buttons (`WatercolorBlobButton`).
- Accessible touch targets ($\ge 42$px input touch zones).

**Scale/Scope**:
- Update `src/types/scorepad.ts`
- Update `src/utils/scoreCalculator.ts`
- Update `src/screens/ScorepadScreen.tsx`
- Update `src/__tests__/scoreCalculator.test.ts`
- Navigation integration in `App.tsx`

---

## Constitution Check

*GATE: Re-evaluated post Phase 1 design.*

- **I. Table-Side Speed & Deliberate OCR Precision**: **PASS**. Removing version selector pills further simplifies the UI and reduces cognitive load table-side. Calculations execute in `<1ms`.
- **II. Taxonomic Grounding & Complete 597-Bird Bilingual Catalog**: **PASS**. Standard categories and official expansion categories align with Grok Games & Stonemaier rulebooks.
- **III. Authentic Ornithological Media & Strict Single-Player Audio**: **PASS**. Quiet table tool with zero audio playback or interference.
- **IV. Lightweight Bundle & On-Demand Streaming Architecture**: **PASS**. Eliminating version selection state reduces UI code; bundle impact remains minimal (<50 KB total).
- **V. Security, Privacy & Zero Hardcoded Secrets**: **PASS**. Operates 100% client-side in memory with zero secrets, zero telemetry, and zero remote requests.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-score-pad-calculator/
├── spec.md              # Feature specification (updated to unified table)
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
│   ├── ScorepadScreen.tsx      # Unified 2-player scorepad screen (no version pills)
│   ├── ScannerScreen.tsx       # (Existing) Camera OCR scanner screen
│   └── CatalogScreen.tsx       # (Existing) 597-bird catalog screen
├── components/
│   ├── WatercolorBlobButton.tsx# (Existing) Two-level organic blob button
│   └── WatercolorIcon.tsx      # (Existing) Organic watercolor icon badge
└── __tests__/
    └── scoreCalculator.test.ts # Unit tests for calculation & sanitization

App.tsx                         # Bottom bar tab navigation & persistent session state
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Removing version filter actually simplifies architecture and code |

# Implementation Plan: Bird Card Name Speech Announcement (TTS)

**Branch**: `007-bird-name-tts` | **Date**: 2026-10-31 | **Spec**: [specs/007-bird-name-tts/spec.md](spec.md)

**Input**: Feature specification from `specs/007-bird-name-tts/spec.md`

## Summary

When a player opens a bird card (either via camera recognition in `BirdPlayingCard` or full-screen photo inspection in `BirdPhoto`), the application vocalizes the bird's common and binomial scientific names preceded by a comedic `"Piu piu"` prefix using on-device text-to-speech synthesis (`expo-speech` on native iOS/Android and Web Speech API on browsers). The system guarantees strict single-player audio coordination (stopping real bird songs when speech begins and vice versa), provides tactile replay/stop controls, and operates 100% offline with zero bundle bloat.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3.0, React Native 0.88.0, Expo SDK 58 (`expo@~58.0.20`).

**Primary Dependencies**: `expo-speech` (`~58.0.3` for native iOS/Android) with fallback to `window.speechSynthesis` (Web Speech API) for web browsers; `react-native` (native UI and state).

**Storage**: Local in-memory session preferences (`SpeechSettings`) with optional persistence via lightweight storage.

**Testing**: Jest unit tests (`ts-jest`) in `src/__tests__/birdSpeechService.test.ts`.

**Target Platform**: Android (Galaxy S24 Ultra & modern Android 9+), iOS 15+, and modern desktop/mobile web browsers.

**Project Type**: Mobile application (Expo Go & standalone native build) + Web.

**Performance Goals**: TTS speech onset `<300ms` from card open; zero UI thread hitching (60 FPS maintained); instantaneous `<50ms` cancellation on card close or audio toggle.

**Constraints**: Strict compliance with Piupiu U Constitution: bundle size delta `<20KB` (zero bundled audio files), zero remote network latency for speech, strict single-sound exclusivity (Constitution Principle III).

**Scale/Scope**: All 597 birds across 5 expansions in Brazilian Portuguese (`pt-BR`) and Latin (`scientific`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Table-Side Speed & Deliberate OCR Precision**: PASS. Speech synthesis executes asynchronously in the background and does not block camera capture, OCR processing, or fuzzy matching.
- **II. Taxonomic Grounding & 597-Bird Bilingual Catalog**: PASS. Every announcement strictly vocalizes `bird.name_pt` and `bird.scientific` as defined in `src/data/birds.json`.
- **III. Authentic Ornithological Media & Single-Player Audio**: PASS. `birdSpeechService` coordinates directly with `audioService.ts`. Starting speech stops active biological audio; starting biological audio stops active speech. They never overlap.
- **IV. Lightweight Bundle & On-Demand Streaming**: PASS. Zero audio assets are added to the bundle. Synthesis utilizes the host device's pre-installed speech synthesizer voices.
- **V. Security, Privacy & Zero Hardcoded Secrets**: PASS. 100% on-device speech processing with zero third-party cloud API keys or telemetry.

## Project Structure

### Documentation (this feature)

```text
specs/007-bird-name-tts/
├── plan.md              # This file
├── research.md          # Phase 0: TTS architecture, phonetics, audio coordination
├── data-model.md        # Phase 1: SpeechPayload, SpeechSettings, state transitions
├── quickstart.md        # Phase 1: Validation and test verification guide
└── contracts/
    └── speech-service.contract.ts # Phase 1: Public interface definitions
```

### Source Code Layout

```text
src/
├── services/
│   ├── birdSpeechService.ts      # Core speech synthesis manager (expo-speech + web fallback)
│   └── audioService.ts           # Ornithological audio coordinator integration
├── components/
│   ├── BirdPlayingCard.tsx       # Adds speech button & auto-announce trigger on card mount
│   └── BirdPhoto.tsx             # Adds speech trigger & controls in full-screen zoom modal
├── types/
│   └── speech.ts                 # TypeScript types for speech payload and settings
└── __tests__/
    └── birdSpeechService.test.ts # Comprehensive unit tests for phrase generation & cancellation
```

## Complexity Tracking

*No constitutional violations. All architecture gates pass cleanly.*

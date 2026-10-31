# Tasks: Bird Card Name Speech Announcement (TTS)

**Input**: Design documents from `specs/007-bird-name-tts/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/speech-service.contract.ts`, `quickstart.md`

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-specific phases
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Dependencies & Type Infrastructure)

**Purpose**: Dependency installation and baseline type contracts

- [x] T001 Install `expo-speech` dependency via `npx expo install expo-speech` in `package.json`
- [x] T002 [P] Create speech types and interfaces in `src/types/speech.ts`

---

## Phase 2: Foundational (Core Speech Service)

**Purpose**: Central speech engine that all user stories depend on

**⚠️ CRITICAL**: Foundational service must be complete before UI integrations begin

- [x] T003 Implement `birdSpeechService` with `expo-speech` and Web Speech API fallback in `src/services/birdSpeechService.ts`
- [x] T004 [P] Implement unit tests for speech phrase formatting and state lifecycle in `src/__tests__/birdSpeechService.test.ts`

**Checkpoint**: Core speech service and phrase formatting verified by tests. User story integrations can now begin.

---

## Phase 3: User Story 1 - Comedic Vocal Announcement on Opening Bird Card (Priority: P1) 🎯 MVP

**Goal**: Automatically announce `"Piu piu! [Nome Popular]... [Nome Científico]"` when a bird card is opened.

**Independent Test**: Open any bird card in Scanner (`BirdPlayingCard`) or Catalog zoom modal (`BirdPhoto`), and hear the audio announcement with natural comedic pauses.

### Tests for User Story 1
- [x] T005 [P] [US1] Add unit test cases for auto-announcement trigger on card open in `src/__tests__/birdSpeechService.test.ts`

### Implementation for User Story 1
- [x] T006 [US1] Integrate automatic speech trigger on card mount in `src/components/BirdPlayingCard.tsx`
- [x] T007 [US1] Integrate automatic speech trigger on modal mount in `src/components/BirdPhoto.tsx`

**Checkpoint**: User Story 1 is functional as an MVP. Opening any bird card triggers the comedic vocal announcement.

---

## Phase 4: User Story 2 - User Replay and Speech Controls (Priority: P2)

**Goal**: Provide tactile buttons to replay the announcement or stop it on demand; immediately halt speech when card is closed.

**Independent Test**: Tap the speech button on `BirdPlayingCard` or the photo zoom modal to replay speech; close the card while speaking to verify speech immediately silences.

### Implementation for User Story 2
- [x] T008 [P] [US2] Add speech replay/stop button with active state indicator to `src/components/BirdPlayingCard.tsx`
- [x] T009 [P] [US2] Add speech replay/stop button to modal header in `src/components/BirdPhoto.tsx`
- [x] T010 [US2] Add component unmount cleanup calling `birdSpeechService.stop()` in `src/components/BirdPlayingCard.tsx` and `src/components/BirdPhoto.tsx`

**Checkpoint**: User Stories 1 and 2 work independently. Users can replay or silence speech with instant feedback.

---

## Phase 5: User Story 3 - Harmony with Biological Bird Vocalizations (Priority: P3)

**Goal**: Guarantee strict single-player exclusivity between synthesized speech and authentic biological bird calls.

**Independent Test**: Start speech and immediately play a bird call (or vice-versa), verifying the previous audio source stops with zero audio overlap.

### Implementation for User Story 3
- [x] T011 [US3] Update `birdSpeechService.speakBird` in `src/services/birdSpeechService.ts` to call `audioService.stop()`
- [x] T012 [US3] Update `audioService.playBirdSound` in `src/services/audioService.ts` to call `birdSpeechService.stop()`
- [x] T013 [P] [US3] Add unit test in `src/__tests__/birdSpeechService.test.ts` verifying mutual audio exclusivity between speech and birdsong

**Checkpoint**: All three user stories are complete and fully coordinated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, quality gates, and end-to-end validation

- [x] T014 [P] Run TypeScript type verification (`npm run typecheck`) and Jest test suites (`npm test`)
- [x] T015 Execute end-to-end quickstart validation scenarios from `specs/007-bird-name-tts/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all User Stories.
- **Phase 3 (User Story 1 - MVP)**: Depends on Phase 2.
- **Phase 4 (User Story 2)**: Depends on Phase 3.
- **Phase 5 (User Story 3)**: Depends on Phase 3 & 4.
- **Phase 6 (Polish)**: Depends on all user stories.

### User Story Dependencies
- **US1 (P1)**: Independent after Foundational (T003, T004).
- **US2 (P2)**: Extends US1 with replay/stop controls.
- **US3 (P3)**: Integrates US1/US2 with `audioService.ts`.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete T001 to T004 (Setup + Foundational service).
2. Complete T005 to T007 (User Story 1).
3. Validate: Open any bird card and verify `"Piu piu! [Nome Popular]... [Nome Científico]"` is spoken.

### Incremental Delivery
1. Foundation ready (T001–T004).
2. MVP delivered (T005–T007) $\rightarrow$ Comedic auto-announcement works.
3. Interactive controls added (T008–T010) $\rightarrow$ Replay & cancel buttons.
4. Audio harmony enforced (T011–T013) $\rightarrow$ No clash with real bird songs.
5. Final polish & validation (T014–T015).


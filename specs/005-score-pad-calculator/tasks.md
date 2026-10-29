# Tasks: Wingspan Score Pad Calculator (005-score-pad-calculator)

**Input**: Design documents from `/specs/005-score-pad-calculator/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/scorepad-contract.ts`, `quickstart.md`)

**Prerequisites**: `plan.md` (complete), `spec.md` (complete), `data-model.md` (complete), `contracts/` (complete)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes explicit file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared types, models, and constant seeds for the scorepad domain.

- [X] T001 Create shared TypeScript definitions for scorepad categories, player state, and evaluation in src/types/scorepad.ts
- [X] T002 [P] Create scorepad constant seeds and category metadata definitions in src/types/scorepad.ts

---

## Phase 2: Foundational (Calculation Engine & Tests)

**Purpose**: Core calculation, validation, sanitization, and evaluation logic with automated tests.

- [X] T003 [P] Implement input sanitization and string-to-number parser functions in src/utils/scoreCalculator.ts
- [X] T004 [P] Implement unit tests for sanitization and number parsing in src/__tests__/scoreCalculator.test.ts
- [X] T005 Update player sum calculation engine and evaluation logic for unified table in src/utils/scoreCalculator.ts
- [X] T006 Update unit tests for unified all-in-one score calculation in src/__tests__/scoreCalculator.test.ts

**Checkpoint**: Core domain engine verified for unified scorepad summation.

---

## Phase 3: User Story 1 - Two-Player Interactive Scoring Calculator (Priority: P1) 🎯 MVP

**Goal**: Deliver a functional 2-player scorepad tallying board game categories in real time with immediate winner detection.

**Independent Test**: Enter numbers in Player 1 and Player 2 columns; verify that column totals and winner highlights update instantaneously without perceptual lag.

### Implementation for User Story 1

- [X] T007 [US1] Create base two-player scorepad screen layout and state in src/screens/ScorepadScreen.tsx
- [X] T008 [US1] Implement real-time numeric inputs with number-pad keyboard in src/screens/ScorepadScreen.tsx
- [X] T009 [US1] Implement real-time total score header and winner banner with tie indicators in src/screens/ScorepadScreen.tsx
- [X] T010 [US1] Apply Naturalist Field Guide theme styling (linen paper, borders, watercolor badges) in src/screens/ScorepadScreen.tsx

**Checkpoint**: User Story 1 provides a fully functional, self-contained 2-player scoring calculator.

---

## Phase 4: User Story 2 - Unified All-in-One Scorepad Table with Expansion Annotations (Priority: P2)

**Goal**: Present a single, unified scoring table containing all 8 official categories without version selector pills, with subtle tags for expansion rows (`[Américas]` and `[Oceania]`).

**Independent Test**: Verify there are no version selector pills, all 8 categories are rendered in the single table, and entering points into expansion rows sums directly without needing mode selection.

### Implementation for User Story 2

- [X] T011 [US2] Remove expansion version selector pills from header in src/screens/ScorepadScreen.tsx
- [X] T012 [US2] Render all 8 scoring categories in a single unified table with subtle expansion tags in src/screens/ScorepadScreen.tsx
- [X] T013 [US2] Verify empty or unplayed expansion fields safely evaluate to 0 in src/screens/ScorepadScreen.tsx

**Checkpoint**: Unified all-in-one scorepad active without version toggles.

---

## Phase 5: User Story 3 - Custom Player Names, Clear Action & Tab Session Persistence (Priority: P3)

**Goal**: Allow players to personalize column headers with custom names, quickly reset scores for a new game, and maintain score sheet state when navigating between app tabs.

**Independent Test**: Change player names to custom text, switch to the Catalog tab and back to Scorepad to confirm state retention, and tap "Novo Jogo" to verify reset confirmation.

### Implementation for User Story 3

- [X] T014 [US3] Implement inline editable player name text inputs with 24-character limit and defaults in src/screens/ScorepadScreen.tsx
- [X] T015 [US3] Implement "Novo Jogo" reset action with confirmation dialog clearing all inputs in src/screens/ScorepadScreen.tsx
- [X] T016 [US3] Maintain persistent scorepad state across bottom bar tab navigation in App.tsx

**Checkpoint**: Full end-to-end integration complete across all 3 user stories.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance, type safety verification, and execution of test scenarios.

- [X] T017 [P] Verify end-to-end scenarios per updated quickstart guide in specs/005-score-pad-calculator/quickstart.md
- [X] T018 [P] Run TypeScript compiler checks and ensure zero type errors across the codebase using npm run typecheck
- [X] T019 Run complete Jest test suites and verify all tests pass using npm test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Complete.
- **Foundational (Phase 2)**: Update pure summation for unified table (T005, T006).
- **User Story 1 (Phase 3 - P1)**: Complete.
- **User Story 2 (Phase 4 - P2)**: Remove version pills and show all 8 categories in unified table (T011, T012, T013).
- **User Story 3 (Phase 5 - P3)**: Complete.
- **Polish (Final Phase)**: Typecheck, test suites, and quickstart verification (T017, T018, T019).

---

## Implementation Strategy

1. Update `src/utils/scoreCalculator.ts` to sum all categories unconditionally (T005).
2. Update unit tests in `src/__tests__/scoreCalculator.test.ts` (T006).
3. Remove version pills in `src/screens/ScorepadScreen.tsx` and render all 8 categories (T011, T012, T013).
4. Run `npm run typecheck` and `npm test` (T018, T019).
5. Verify quickstart scenarios (T017).

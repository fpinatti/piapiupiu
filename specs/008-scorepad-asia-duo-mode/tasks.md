# Tasks: Wingspan Scorepad Asia Duo Mode Track Scoring

**Input**: Design documents from `specs/008-scorepad-asia-duo-mode/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/scorepad-categories.contract.ts`, `quickstart.md`

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-specific phases
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Type Definitions & Seeds)

**Purpose**: Baseline type contracts and category seeds

- [x] T001 Extend `ScoreCategoryIconType`, `ScoreCategoryDefinition`, and `ScorepadVersionId` in `src/types/scorepad.ts` to include `'duo'` icon and `'asia'` expansion
- [x] T002 Add `duo` category definition with label `"Modo Duo"` to `DEFAULT_SCORE_CATEGORIES` in `src/types/scorepad.ts`

---

## Phase 2: Foundational (Calculation & Automated Test Scaffolding)

**Purpose**: Core calculation expectations and test coverage for the 9-category unified table

**⚠️ CRITICAL**: Foundational tasks must be completed before UI and theming tasks

- [x] T003 [P] Update existing unit tests in `src/__tests__/scoreCalculator.test.ts` to expect 9 categories in `getActiveCategories()`
- [x] T004 [P] Add unit test cases in `src/__tests__/scoreCalculator.test.ts` verifying that entering `duo` points updates totals and leaving `duo` blank evaluates to 0

**Checkpoint**: Core calculation contracts and category seed tests prepared. User story integrations can now proceed.

---

## Phase 3: User Story 1 - Asia Duo Mode Track Scoring in Unified Table (Priority: P1) 🎯 MVP

**Goal**: Allow players in a Wingspan match using the Asia Expansion Duo Mode to enter their Duo track points in the "Modo Duo" row, with both player totals recalculating in real time (<50ms).

**Independent Test**: Enter values in the "Modo Duo" row for Player 1 and Player 2; verify both player totals immediately increase by the entered amounts.

### Implementation for User Story 1
- [x] T005 [US1] Verify and ensure `calculatePlayerTotal` and `evaluateScorepad` in `src/utils/scoreCalculator.ts` process the `duo` category seamlessly
- [x] T006 [US1] Update `src/screens/ScorepadScreen.tsx` table rendering to support numeric input, real-time recalculation, and state persistence for the `duo` category

**Checkpoint**: User Story 1 is functional as an MVP. Players can enter and tally Asia Duo track points in the scorepad.

---

## Phase 4: User Story 2 - Frictionless Omission for Games Without Asia Duo Mode (Priority: P2)

**Goal**: Guarantee that games played without the Asia Duo board calculate accurately with zero friction or penalties when the "Modo Duo" row is left blank or 0.

**Independent Test**: Fill base game rows while leaving "Modo Duo" blank; verify that the total calculates accurately with no `NaN` or unexpected offsets.

### Implementation for User Story 2
- [x] T007 [US2] Ensure `createInitialScorepadState` and reset handlers in `src/screens/ScorepadScreen.tsx` and `src/utils/scoreCalculator.ts` clear the `duo` category on "Novo Jogo / Limpar"
- [x] T008 [P] [US2] Add unit test in `src/__tests__/scoreCalculator.test.ts` verifying backward compatibility when evaluating state objects lacking the `duo` key

**Checkpoint**: User Stories 1 and 2 work independently. Games with or without the Asia expansion score cleanly.

---

## Phase 5: User Story 3 - Visual Distinction & Naturalist Field Guide Theming (Priority: P3)

**Goal**: Render an authentic watercolor yin-yang icon and a distinct `"Ásia"` badge for the "Modo Duo" row matching the Wingspan Naturalist Field Guide design system.

**Independent Test**: View the "Modo Duo" row on screen; verify the yin-yang icon renders with soft cherry rose wash (`#FAEBEC` / `#E2A5A7` / `#7A2024`) and the `"Ásia"` expansion badge displays beside the label.

### Implementation for User Story 3
- [x] T009 [P] [US3] Add `'duo'` watercolor palette wash and `yin-yang` icon glyph rendering to `src/components/WatercolorIcon.tsx`
- [x] T010 [US3] Update expansion tag renderer in `src/screens/ScorepadScreen.tsx` to display `"Ásia"` badge for `category.expansion === 'asia'` using `EXPANSION_THEME.asia`

**Checkpoint**: All three user stories are complete, visually polished, and fully integrated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, quality gates, and end-to-end validation

- [x] T011 [P] Run TypeScript type verification (`npm run typecheck`) and Jest test suites (`npm test`)
- [x] T012 Execute end-to-end quickstart validation scenarios from `specs/008-scorepad-asia-duo-mode/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks User Stories.
- **Phase 3 (User Story 1 - MVP)**: Depends on Phase 2.
- **Phase 4 (User Story 2)**: Depends on Phase 3.
- **Phase 5 (User Story 3)**: Can run in parallel with or after Phase 3 & 4.
- **Phase 6 (Polish)**: Depends on all implementation tasks.

### User Story Dependencies
- **US1 (P1)**: Independent after Foundational (T001–T004).
- **US2 (P2)**: Extends US1 with clean reset and backward-compatibility validation.
- **US3 (P3)**: Enhances US1 visual rendering with authentic watercolor assets.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete T001 to T004 (Setup & Foundational calculation tests).
2. Complete T005 and T006 (User Story 1).
3. Validate: Open scorepad and verify entering numbers into "Modo Duo" adds directly to total.

### Incremental Delivery
1. Foundation ready (T001–T004).
2. MVP delivered (T005–T006) $\rightarrow$ Duo mode scoring functional.
3. Edge case & reset handling verified (T007–T008) $\rightarrow$ Non-Asia games unaffected.
4. Naturalist Field Guide theming applied (T009–T010) $\rightarrow$ Yin-yang watercolor icon & "Ásia" badge rendered.
5. Final quality gates passed (T011–T012).


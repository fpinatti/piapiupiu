# Feature Specification: Wingspan Scorepad Asia Duo Mode Track Scoring (Pontuação do Modo Duo - Expansão Ásia)

**Feature Branch**: `008-scorepad-asia-duo-mode`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "na pagina de pontuacao, ficou faltando uma linha para pontuar a trilha do modo duo da expansao asia, adicione-a"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Asia Duo Mode Track Scoring in Unified Table (Priority: P1)

When two players conclude a Wingspan match using the Asia Expansion in Duo Mode, they need to count and record the victory points earned on the Duo Board (specifically, 1 point per token in their largest connected group of duo tokens on the map). Players can type their points into a dedicated "Modo Duo" row tagged with an `Ásia` badge, and their total score updates instantaneously in real time.

**Why this priority**: Essential completion of official Wingspan expansion scoring categories. The Asia expansion is specifically designed for 2-player matches (which matches the exact 2-column layout of the scorepad), making the Duo board category a primary scoring need.

**Independent Test**: Open the "Pontuação" tab, locate the "Modo Duo" row with the `Ásia` tag, enter values (e.g., 9 points for Player 1, 11 points for Player 2), and verify that both player column totals immediately incorporate these values.

**Acceptance Scenarios**:

1. **Given** an active scorepad session, **When** the user views the categories table, **Then** a row labeled "Modo Duo" (or "Trilha Duo") is displayed with a subtle `Ásia` expansion badge and a thematic watercolor icon.
2. **Given** Player 1 enters `10` points in the "Modo Duo" row, **When** the input is committed, **Then** Player 1's total score increases by `10` in real time with zero calculation latency.
3. **Given** both players enter values into the "Modo Duo" row, **When** scores are updated, **Then** the difference and lead indicator update accordingly.

---

### User Story 2 - Frictionless Omission for Games Without Asia Duo Mode (Priority: P2)

Players who are playing only the base game or other expansions (Europe, Oceania, Americas) want the "Modo Duo" row to exist harmoniously in the unified table without requiring any toggling or configuration. Leaving the field blank or `0` must evaluate to 0 points with no warnings or disruption to the calculation.

**Why this priority**: Preserves the single unified table principle established in `005-score-pad-calculator`. Players should never need to configure a version filter or modal before scoring their game.

**Independent Test**: Fill only base game rows while leaving the "Modo Duo" field blank; verify that the total calculates accurately with no `NaN` or unexpected offsets.

**Acceptance Scenarios**:

1. **Given** a match played without the Asia Duo board, **When** players leave the "Modo Duo" field completely empty, **Then** the calculator evaluates the category as `0` points and computes the correct base score.
2. **Given** a player enters `0` in the "Modo Duo" field, **When** the score is calculated, **Then** the total score remains unchanged.

---

### User Story 3 - Visual Distinction & Naturalist Field Guide Theming (Priority: P3)

Players want the new Asia Duo category to seamlessly match the visual language of the existing scorepad, using a distinct watercolor icon, harmonious color palette, and clear typography consistent with the Wingspan Naturalist Field Guide design system.

**Why this priority**: Maintains visual polish, aesthetic integrity, and rapid legibility at a physical gaming table.

**Independent Test**: Inspect the "Modo Duo" row on various screen sizes to verify font alignment, watercolor badge borders, and icon rendering.

**Acceptance Scenarios**:

1. **Given** the scorepad screen, **Then** the "Modo Duo" row displays a dedicated watercolor icon matching the organic droplet style of the other categories.
2. **Given** the expansion tag for the row, **Then** it renders `"Ásia"` styled consistently with the `"Américas"` and `"Oceania"` badges.

---

### Edge Cases

- **Non-numeric inputs**: Non-digit characters, negative signs, and decimals must be filtered out, accepting only non-negative integers (`0..999`).
- **Empty input handling**: Deleting all digits back to an empty string must immediately evaluate as `0` without crashing or displaying `NaN`.
- **Upper bound cap**: Inputs greater than `999` must be capped or restricted to 3 digits to avoid layout overflow.
- **Session persistence**: Switching away to "Scanner" or "Catálogo" and returning to "Pontuação" must retain all entered Duo track scores.
- **Game reset action**: Tapping "Novo Jogo / Limpar" must reset the "Modo Duo" fields to empty/0 along with all other categories.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST include a dedicated scoring category for the Asia expansion Duo mode track/board within the unified scorepad table (`DEFAULT_SCORE_CATEGORIES`).
- **FR-002**: System MUST set the category identifier to `duo` with label `"Modo Duo"` and description describing points from the largest connected group of duo tokens on the Asia duo board.
- **FR-003**: System MUST assign `expansion: 'asia'` to the category definition.
- **FR-004**: System MUST render an expansion badge reading `"Ásia"` beside the category title, harmonized with existing `"Américas"` and `"Oceania"` badges.
- **FR-005**: System MUST provide a dedicated watercolor icon type (`'duo'`) with authentic naturalist wash coloring and an evocative iconography (e.g., dual tokens / connected map nodes).
- **FR-006**: System MUST incorporate values entered in the `duo` category into each player's real-time total score calculation.
- **FR-007**: System MUST treat blank or unentered values in the `duo` category as `0` points.
- **FR-008**: System MUST sanitize `duo` inputs to integers between `0` and `999`.
- **FR-009**: System MUST clear the `duo` category fields when the "Novo Jogo / Limpar" reset action is executed.
- **FR-010**: System MUST persist the `duo` scores in the active session state during tab navigation.
- **FR-011**: System MUST maintain backward compatibility with any saved or serialized scorepad state lacking the `duo` key by defaulting to `""` / `0`.

### Key Entities

- **ScoreCategoryDefinition**: Extended to support `expansion: 'base' | 'americas' | 'oceania' | 'asia'` and `iconType: ... | 'duo'`.
- **PlayerScoreState**: Stores key `'duo'` mapping to the player's string input value (e.g., `scores: { birds: "42", duo: "12", ... }`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can input Duo mode points and see their total score update in under 50ms with zero manual submission steps.
- **SC-002**: 100% of matches played without the Asia expansion can be scored normally with zero penalty or configuration friction by ignoring the row.
- **SC-003**: The unified scoring table renders all 9 categories (6 base + 3 expansions: Beija-flores [Américas], Néctar [Oceania], Modo Duo [Ásia]) cleanly without layout clipping or text overlap.
- **SC-004**: All existing unit test suites and new scorepad test cases pass with 100% success rate (`npm test`).
- **SC-005**: TypeScript typecheck passes with 0 errors (`npm run typecheck`).

---

## Assumptions

- In official Wingspan Asia rules, the Duo board track scores victory points based on each player's largest contiguous cluster of duo tokens placed on the Duo Map during the game.
- Duo Mode end-of-round goals are already tracked under the "Metas de Rodada" category; this new row specifically addresses the Duo Board map cluster points.
- The 2-player format of the scorepad perfectly suits the 2-player nature of the Asia Duo Mode.
- No changes to bottom navigation or external cloud services are required; calculation remains 100% local and instantaneous.


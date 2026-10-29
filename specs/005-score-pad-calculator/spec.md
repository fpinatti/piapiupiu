# Feature Specification: Wingspan Score Pad Calculator (Bloco de Pontuação Wingspan)

**Feature Branch**: `005-score-pad-calculator`

**Created**: 2026-10-28

**Updated**: 2026-10-29

**Status**: Draft (Updated)

**Input**: User description: "na aba pontuacao, remova o filtro de expansoes, e faca ter apenas uma tabela, com os campos de expansao marcados com uma pequena anotacao como estao atualmente. dessa forma se o jogador quiser preencher, esta ok, caso contrario é so deixar branco"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Two-Player Interactive Scoring Calculator (Priority: P1)

At the end of a Wingspan match, two players want to tally their end-game scores across official board game categories (Birds, Bonus Cards, End-of-Round Goals, Eggs, Food on Cards, Tucked Cards). As either player types numbers into the category fields, the total score for each player recalculates automatically in real time without requiring a "calculate" button or page reload.

**Why this priority**: Real-time two-player summation across core board game categories provides immediate, independent value for any Wingspan game session, eliminating mental math errors and paper scorepad waste.

**Independent Test**: Enter values into player 1 and player 2 score rows for base game categories; verify that each player's column sum updates instantaneously and displays the correct total.

**Acceptance Scenarios**:

1. **Given** an empty scorepad with Player 1 and Player 2 columns, **When** Player 1 enters `35` points for Birds and `8` points for Eggs, **Then** Player 1's total updates instantaneously to `43`, while Player 2's total remains `0`.
2. **Given** filled score categories, **When** a player deletes or edits a number, **Then** the player's total recalculates immediately to reflect the updated or emptied value (empty fields treated as `0`).
3. **Given** active totals for both players, **Then** the interface clearly indicates which player currently has the higher score, or indicates a tie if totals are equal.

---

### User Story 2 - Unified All-in-One Scorepad Table with Expansion Annotations (Priority: P2)

Players want a single, clean scoring table that displays all categories (base game plus official expansions: Beija-flores for Américas and Néctar for Oceania) without needing to configure or toggle an expansion mode before scoring. Each expansion-specific row carries a subtle visual annotation (e.g. `[Américas]`, `[Oceania]`). If an expansion was not used in that match, players simply leave the field blank or `0`, and it adds 0 points to their total without any penalty or setup friction.

**Why this priority**: Eliminates mode-switching friction, prevents accidental loss of rows, and lets players seamlessly combine expansions (e.g. Base + Oceania + Americas simultaneously) without requiring modal configuration.

**Independent Test**: View the scorepad sheet; verify there is no expansion selector pill bar, that all categories (including "Beija-flores" with `Américas` tag and "Néctar" with `Oceania` tag) are present in the same table, and entering points into any expansion row sums directly into the player's total score.

**Acceptance Scenarios**:

1. **Given** the scorepad screen, **Then** no version selector or expansion filter pills are rendered, presenting one unified table directly.
2. **Given** the unified score table, **Then** the "Beija-flores" category row displays a subtle `Américas` badge, and the "Néctar" category row displays a subtle `Oceania` badge.
3. **Given** a game played only with the base game, **When** players leave "Beija-flores" and "Néctar" empty, **Then** both fields evaluate as `0` points and do not alter the base game total.
4. **Given** a game played with both Américas and Oceania, **When** Player 1 enters `14` in "Beija-flores" and `10` in "Néctar", **Then** both values sum directly into Player 1's total in real time.

---

### User Story 3 - Custom Player Names, Clear Action & Game Reset (Priority: P3)

Players want to personalize their column headers with their real names (e.g., "Fernanda" and "Lucas") instead of generic labels, and want a simple action to clear the sheet for the next game.

**Why this priority**: Enhances table-side convenience, social connection, and repeatable usage across back-to-back board game matches.

**Independent Test**: Edit player column headers, observe custom names rendered across the summary and winner banner, and tap the reset action to confirm all inputs clear back to zero.

**Acceptance Scenarios**:

1. **Given** the default player names "Jogador 1" and "Jogador 2", **When** the user taps either name, **Then** they can type custom player names that persist throughout the scoring session.
2. **Given** a finished game with scores entered, **When** the user triggers the "Novo Jogo / Limpar" action, **Then** all numeric inputs are cleared to blank/zero after an optional confirmation, allowing a new match to begin.

---

### Edge Cases

- **Non-numeric or negative input**: The calculator must only accept non-negative whole numbers (`0..999`), discarding negative signs, decimals, or non-digit characters.
- **Empty input fields**: Any input left blank or backspaced completely must be evaluated as `0` in the sum without crashing or showing `NaN`.
- **Extremely large numbers**: The calculator should cap individual category inputs at 3 digits (`999`) to prevent layout overflow or unrealistic board game scores.
- **Tied scores**: When both players achieve the exact same total score, the UI must display a "Empate!" (Tie) status.
- **Tab switching during calculation**: If a player switches to the "Scanner" or "Catálogo" tab and returns to "Pontuação", all entered scores and player names must remain preserved in memory.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated "Pontuação" (Scorepad) tab in the main bottom navigation bar alongside "Scanner" and "Catálogo".
- **FR-002**: System MUST render two side-by-side columns corresponding to two independent players.
- **FR-003**: System MUST calculate and display the sum of all category fields for each player in real time as values are typed (zero lag, no manual submit button).
- **FR-004**: System MUST present a single, unified scoring table containing all 8 official Wingspan scoring categories without expansion toggle or filter buttons:
  - Pássaros (Bird card victory points)
  - Cartas Bônus (End-game bonus cards)
  - Metas de Fim de Rodada (Round goals board)
  - Ovos (Eggs on bird cards, 1 pt each)
  - Comida Estocada (Food tokens cached on cards, 1 pt each)
  - Cartas Sobpostas / Bandos (Cards tucked under birds, 1 pt each)
  - Beija-flores (Hummingbirds points, with a subtle `Américas` tag)
  - Néctar (Nectar points, with a subtle `Oceania` tag)
- **FR-005**: System MUST treat any blank or unfilled expansion or base field as `0` points, allowing players to score matches with or without expansions without extra configuration.
- **FR-006**: System MUST automatically evaluate and display a prominent winner indicator highlighting the player with the higher total score, or a tie indicator when scores are identical.
- **FR-007**: System MUST allow users to tap and edit the names of both players.
- **FR-008**: System MUST provide a "Novo Jogo / Limpar" button that resets all score fields to blank.
- **FR-009**: System MUST preserve all active scores and player names when switching between app tabs during a session.
- **FR-010**: System MUST validate and restrict inputs to positive numeric integers `0..999`.
- **FR-011**: System MUST align visually with the established Wingspan Naturalist Field Guide design system (`DESIGN.md`), utilizing linen surfaces (`#F5F0E6`, `#FCFAF7`), watercolor badges, and organic blob buttons.

### Key Entities

- **ScoreCategory**: Represents a scoring row item (`id`, localized label, optional expansion badge, icon).
- **PlayerScore**: Represents a single player's score state (`name`, map of category IDs to numeric values, calculated total score).
- **ScorepadState**: Represents the active game sheet containing `player1` (`PlayerScore`), `player2` (`PlayerScore`), and session status.
- **ScorepadEvaluation**: Represents the calculated outcome (`player1Total`, `player2Total`, `diff`, `leader`, `isTie`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Score recalculation occurs instantaneously on keypress (<16ms, zero perceptual latency).
- **SC-002**: Players can tally and review a complete 2-player end-game scorepad in under 60 seconds with zero modal setup or configuration.
- **SC-003**: 100% of mathematical sums across all standard and expansion categories match official board game scoring rules.
- **SC-004**: Seamless navigation between Scanner, Catalog, and Scorepad tabs without losing entered score sheet data.

---

## Assumptions

- Standard tabletop sessions using the companion app are played with 2 players sharing the device for end-game tallying; additional players can be tallied in successive rounds or future multi-player expansions.
- Leaving expansion fields blank simply treats them as zero, eliminating the need for mode selection or version toggles.
- In the Americas expansion, hummingbirds have dedicated scoring contributions (food/tokens/nectar interactions), summarized cleanly as a dedicated category row in the scorepad.

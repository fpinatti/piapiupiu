# Research: Wingspan Score Pad Calculator (005-score-pad-calculator)

## 1. Domain Analysis: Official Wingspan Scoring Rules & Scorepads

### 1.1 Base Game Scoring Sheet (Stonemaier / Grok Games)
The official physical Wingspan score sheet consists of 6 core categories summed at the end of round 4:
1. **Pássaros / Birds (`birds`)**: Sum of victory points printed directly on all bird cards in the player's 3 habitats (0 to 9 points per bird).
2. **Cartas Bônus / Bonus Cards (`bonus`)**: Sum of points earned from secret end-game bonus objective cards (e.g. *Oologist*, *Cartographer*, *Forester*).
3. **Metas de Fim de Rodada / End-of-Round Goals (`goals`)**: Total points scored from the 4 end-of-round goal tiles (using either green majority or blue count side).
4. **Ovos / Eggs (`eggs`)**: 1 point per egg token laid on played bird cards.
5. **Comida Estocada / Food on Cards (`food`)**: 1 point per food token cached on bird cards (via predator, hoarder, or forage powers).
6. **Cartas Sobpostas / Tucked Cards (`tucked`)**: 1 point per card tucked beneath bird cards (via flocking, hunting, or breeding powers).

### 1.2 Official Expansion Categories
- **Américas Expansion — Beija-flores / Hummingbirds (`hummingbirds`)**: Dedicated points from hummingbird powers, nectar tokens, and feeder contributions.
- **Oceania Expansion — Néctar / Nectar (`nectar`)**: Total points earned from nectar spent across habitats at game end.

### 1.3 Architectural & UX Decision: Unified All-in-One Table vs. Version Selector
- **Problem with Version Selector / Mode Pills**:
  - Selecting an expansion mode previously hid or filtered categories.
  - Players frequently combine multiple expansions (e.g., Base + Oceania + Americas together). A strict dropdown/pill selector forced an artificial either-or choice or required complex multi-select UI.
  - Toggling versions risked confusing players or hiding numbers previously entered.
- **Chosen Solution: Single Unified Scoring Table**:
  - Display all 8 official categories in one fixed, elegant table.
  - Mark expansion-specific categories with subtle, non-intrusive badge annotations (`[Américas]` for Beija-flores, `[Oceania]` for Néctar).
  - Treat blank/empty fields as `0` points.
  - If players did not play with an expansion, they simply leave that row empty, which has zero effect on the sum.
  - If players played with one or both expansions, they simply type their points in the corresponding row.
  - Eliminates all version selector pills, header clutter, and configuration friction.

---

## 2. Technical Architecture & State Management

### 2.1 State Structure
```typescript
export interface ScoreCategoryDefinition {
  id: string;
  label: string;
  description: string;
  expansion?: 'base' | 'americas' | 'oceania';
  iconType: 'feather' | 'bonus' | 'goal' | 'egg' | 'food' | 'tucked' | 'hummingbird' | 'nectar';
}

export interface PlayerScoreState {
  id: 'player1' | 'player2';
  name: string;
  scores: Record<string, string>; // raw string input to handle empty state and cursor position gracefully
}

export interface ScorepadState {
  player1: PlayerScoreState;
  player2: PlayerScoreState;
}
```

### 2.2 Numerical Summation & Real-Time Calculation Logic
- Values are stored as strings (`"35"`, `""`) in the `scores` map.
- Sanitization ensures only positive digits `0..999` are kept.
- Summation iterates over all categories in `DEFAULT_SCORE_CATEGORIES` (or present in scores):
  ```typescript
  export function calculatePlayerTotal(
    scores: Record<string, string>,
    categories: readonly ScoreCategoryDefinition[] = DEFAULT_SCORE_CATEGORIES
  ): number {
    return categories.reduce((sum, cat) => {
      const val = parseInt(scores[cat.id] || '', 10);
      return sum + (isNaN(val) || val < 0 ? 0 : val);
    }, 0);
  }
  ```
- Sub-millisecond calculation speed (<1ms), completely synchronous and instantaneous on keypress.

---

## 3. UI/UX Design & Layout Strategy

### 3.1 Two-Player Side-by-Side Comparison
- Single vertical scrollable sheet:
  - Header: Title "Bloco de Pontuação", subtitle, and winner summary card.
  - Unified Table:
    - Left column: Category Label + Watercolor Icon + subtle expansion tag (`[Américas]`, `[Oceania]`).
    - Middle column: Player 1 numeric input (`keyboardType="number-pad"`).
    - Right column: Player 2 numeric input (`keyboardType="number-pad"`).
    - Bottom row: TOTAL points for each player with leader highlight.
  - Footer Action: "Novo Jogo / Limpar" blob button with confirmation alert.

### 3.2 Mobile-First Touch & Aesthetic Alignment
- Touch targets $\ge 42$px for numeric text inputs.
- Naturalist theme styling matching `DESIGN.md` (warm paper `#FCFAF7`, borders `#DCD3C1`, sumi ink `#202B24`, secondary organic blob buttons).

---

## 4. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Confusion over unused expansion rows | Clear subtle annotation tags (`[Américas]`, `[Oceania]`) and `0` placeholders indicate they can be left blank safely |
| Non-numeric input on web | Strict regex filter `text.replace(/[^0-9]/g, '').slice(0, 3)` |
| Accidental reset | Platform-safe confirmation dialog before clearing scores |

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

### 1.2 Oceania Expansion Scoring
In addition to the 6 core categories, the Oceania expansion introduces **Néctar / Nectar**:
- Players spend nectar during the game into separate habitat discard spaces (Forest, Grassland, Wetland).
- At game end:
  - 1st place in each habitat receives 5 points.
  - 2nd place in each habitat receives 2 points.
  - (Ties split points per rulebook).
- On the physical scorepad, players can enter either their total nectar score directly or broken down by habitat.
- **Decision**: Provide direct total nectar point input for each player in Oceania mode (`nectar`), with optional sub-fields if desired.

### 1.3 Americas Expansion Scoring
The Americas expansion introduces **Beija-flores / Hummingbirds (`hummingbirds`)**:
- Hummingbirds feature dedicated high-frequency nectar feeding and interaction scoring.
- On the Americas scoring sheet, a dedicated category row captures points earned through hummingbird cards and feeding interactions.
- **Decision**: In Americas mode, add the dedicated `hummingbirds` ("Beija-flores") row directly below Bonus Cards / Goals, fully integrated into the real-time sum.

---

## 2. Technical Architecture & State Management

### 2.1 State Structure
```typescript
export type ScorepadVersionId = 'base' | 'americas' | 'oceania';

export interface ScoreCategoryDefinition {
  id: string;
  label: string;
  description: string;
  iconType?: 'forest' | 'grassland' | 'wetland' | 'egg' | 'wingspan' | 'feather';
  expansion?: 'base' | 'americas' | 'oceania';
}

export interface PlayerScoreState {
  name: string;
  scores: Record<string, string>; // raw string input to handle empty state and cursor position gracefully
}

export interface ScorepadState {
  version: ScorepadVersionId;
  player1: PlayerScoreState;
  player2: PlayerScoreState;
}
```

### 2.2 Numerical Summation & Real-Time Calculation Logic
- In mobile text inputs, storing numeric values as raw strings (`"35"`, `""`) prevents jarring cursor jumps or unwanted `"0"` prefixes while typing.
- Pure calculation function:
  ```typescript
  export function calculateCategoryPoints(raw: string): number {
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  export function calculatePlayerTotal(
    scores: Record<string, string>,
    activeCategoryIds: string[]
  ): number {
    return activeCategoryIds.reduce((sum, catId) => {
      return sum + calculateCategoryPoints(scores[catId] || '');
    }, 0);
  }
  ```
- Instant re-rendering (<5ms) using standard React state hooks (`useState` / `useReducer`).

### 2.3 Session Persistence
- The scorepad state should be lifted or held in memory during the app lifecycle so players can switch to the "Scanner" or "Catálogo" tab without losing their entered game scores.
- A prominent "Novo Jogo" (Reset) button allows starting a new game with zeroed scores.

---

## 3. UI/UX Design & Layout Strategy

### 3.1 Two-Player Side-by-Side Comparison
- Column layout:
  - Left column: Category Label + Watercolor Icon / Badge.
  - Middle column: Player 1 numeric input.
  - Right column: Player 2 numeric input.
- Large fixed Header / Banner:
  - Real-time Total Score for Player 1 and Player 2.
  - Dynamic Winner Trophy or Tie indicator.
  - Score differential ("+8 pts").

### 3.2 Mobile-First Touch & Input Considerations
- Number pad keyboard (`keyboardType="number-pad"`).
- Large touch targets (≥44px height for inputs).
- Naturalist theme styling matching `DESIGN.md` (warm paper surfaces `#FCFAF7`, borders `#DCD3C1`, sumi ink text `#202B24`, organic blob buttons for actions).

---

## 4. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Non-numeric input typed on web or external keyboards | Strict regex filter `text.replace(/[^0-9]/g, '').slice(0, 3)` ensures only valid 0-999 integers are accepted |
| Accidental reset while tallying scores | Confirmation alert ("Limpar pontuação atual?") before wiping all inputs |
| Screen overflow on smaller mobile viewports | Vertical `ScrollView` with sticky total score banner at top or bottom |


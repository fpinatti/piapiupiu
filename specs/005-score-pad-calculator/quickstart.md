# Quickstart Validation Guide: Wingspan Score Pad Calculator (Unified Table)

This guide provides end-to-end validation scenarios for verifying the updated **Unified Score Pad Calculator** (`005-score-pad-calculator`) feature in Piupiu U.

---

## 1. Prerequisites & Environment Setup

Ensure all dependencies are installed and test suites pass:

```bash
# Verify working tree
git status

# Typecheck the project
npm run typecheck

# Run automated tests
npm test
```

---

## 2. Automated Test Verification

A dedicated unit test suite validates calculation logic, input sanitization, unified summation, and winner determination:

```bash
# Run Jest focused on the score calculator tests
npm test -- src/__tests__/scoreCalculator.test.ts
```

### Expected Test Assertions:
1. **Sanitization**: Strips letters, symbols, negative signs, and truncates to 3 digits (`"abc42!"` → `"42"`).
2. **Calculation**: Empty strings evaluate to `0`; valid numbers sum accurately (`"35"` + `"8"` = `43`).
3. **Unified All-in-One Summation**:
   - Sums all 8 categories (6 base + Beija-flores + Néctar).
   - Unfilled expansion rows safely evaluate to 0 without affecting base game scoring.
   - Points entered in Beija-flores and/or Néctar add directly to total score.
4. **Winner & Ties**:
   - `player1: 85`, `player2: 80` → `leader: 'player1'`, `diff: 5`, `isTie: false`.
   - `player1: 72`, `player2: 72` → `leader: 'tie'`, `diff: 0`, `isTie: true`.
   - All zero scores → `leader: 'none'`, `diff: 0`, `isTie: false`.

---

## 3. Manual Interactive Scenarios (Tabletop Validation)

Start the Expo dev server or web preview:

```bash
npx expo start
```

### Scenario A: Unified Table View (No Version Pills)
1. Open the app and tap the **"Pontuação"** tab in the bottom bar.
2. Verify that there are **no version selector pills** (no "Jogo Base", "Américas", "Oceania" buttons).
3. Verify that all 8 categories are rendered in a single, clean table:
   - *Pássaros*
   - *Cartas Bônus*
   - *Metas de Rodada*
   - *Ovos*
   - *Comida Estocada*
   - *Cartas Sobpostas*
   - *Beija-flores* (with `[Américas]` subtle badge)
   - *Néctar* (with `[Oceania]` subtle badge)

---

### Scenario B: Base Game Scoring (Leaving Expansion Rows Blank)
1. In **Jogador 1** column:
   - Tap *Pássaros* and type `45`.
   - Tap *Ovos* and type `12`.
   - Tap *Metas de Rodada* and type `18`.
   - Leave *Beija-flores* and *Néctar* blank.
2. Verify that **Jogador 1** total banner displays **`75` pts** instantaneously.
3. In **Jogador 2** column:
   - Tap *Pássaros* and type `52`.
   - Tap *Cartas Bônus* and type `14`.
   - Tap *Cartas Sobpostas* and type `6`.
   - Leave *Beija-flores* and *Néctar* blank.
4. Verify that **Jogador 2** total banner displays **`72` pts**.
5. Observe the winner highlight crown points to **Jogador 1** with `+3 pts dif.`.

---

### Scenario C: Mixed / Multi-Expansion Scoring
1. In **Jogador 1** column, tap *Beija-flores* (`Américas`) and enter `15`.
2. Verify Jogador 1's total updates from `75` to `90` immediately.
3. In **Jogador 2** column, tap *Néctar* (`Oceania`) and enter `10`.
4. Verify Jogador 2's total updates from `72` to `82` immediately.
5. In **Jogador 1** column, also enter `5` in *Néctar* (simulating a game with both Oceania & Americas).
6. Verify Jogador 1's total updates from `90` to `95`.

---

### Scenario D: Custom Names, Tab Persistence & Reset
1. Edit player names to `"Fernanda"` and `"Lucas"`.
2. Switch to **"Catálogo"** tab, scroll birds, then switch back to **"Pontuação"**.
3. Verify all entered scores and custom names remain intact.
4. Tap **"Novo Jogo / Limpar"** and confirm.
5. Verify all category fields clear to empty inputs and totals reset to `0`.

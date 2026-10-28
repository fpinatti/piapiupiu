# Quickstart Validation Guide: Wingspan Score Pad Calculator

This guide provides end-to-end validation scenarios for verifying the **Score Pad Calculator** (`005-score-pad-calculator`) feature in Piupiu U.

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

A dedicated unit test suite validates calculation logic, input sanitization, version category filtering, and winner determination:

```bash
# Run Jest focused on the score calculator tests
npm test -- src/__tests__/scoreCalculator.test.ts
```

### Expected Test Assertions:
1. **Sanitization**: Strips letters, symbols, negative signs, and truncates to 3 digits (`"abc42!"` → `"42"`).
2. **Calculation**: Empty strings evaluate to `0`; valid numbers sum accurately (`"35"` + `"8"` = `43`).
3. **Expansion Filtering**:
   - `base` version excludes `hummingbirds` and `nectar` from totals.
   - `americas` version includes `hummingbirds`.
   - `oceania` version includes `nectar`.
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

### Scenario A: Core 2-Player Tallying (Base Game)
1. Open the app and tap the **"Pontuação"** tab in the bottom bar.
2. Verify the 6 standard categories are displayed in natural linen card styling:
   - *Pássaros*, *Cartas Bônus*, *Metas de Rodada*, *Ovos*, *Comida Estocada*, *Cartas Sobpostas*.
3. In **Jogador 1** column:
   - Tap *Pássaros* and type `45`.
   - Tap *Ovos* and type `12`.
   - Tap *Metas de Rodada* and type `18`.
4. Observe that **Jogador 1** total banner displays **`75` pts** instantaneously.
5. In **Jogador 2** column:
   - Tap *Pássaros* and type `52`.
   - Tap *Cartas Bônus* and type `14`.
   - Tap *Cartas Sobpostas* and type `6`.
6. Observe that **Jogador 2** total banner displays **`72` pts**.
7. Observe the winner highlight crown/trophy points to **Jogador 1** with a `+3` lead.

---

### Scenario B: Expansion Mode (Américas & Oceania)
1. In the scorepad header, tap the **"Américas"** pill button.
2. Verify the dedicated **"Beija-flores"** row appears with its watercolor badge.
3. Add `15` points to Jogador 1 under *Beija-flores*.
4. Verify Jogador 1's total updates from `75` to `90` immediately.
5. Tap the **"Oceania"** pill button.
6. Verify *Beija-flores* disappears and **"Néctar"** appears.
7. Add `10` points to Jogador 2 under *Néctar*.
8. Verify Jogador 2's total updates to `82` immediately.
9. Return to **"Américas"**: verify previously entered `15` points for *Beija-flores* are still preserved.

---

### Scenario C: Custom Names & Session Persistence
1. Tap the header label `"Jogador 1"` and edit it to `"Fernanda"`.
2. Tap `"Jogador 2"` and edit it to `"Lucas"`.
3. Verify the winner banner and column headers reflect `"Fernanda"` and `"Lucas"`.
4. Tap the bottom navigation tab **"Catálogo"** and scroll through birds.
5. Tap the **"Pontuação"** tab again:
   - Verify all scores, custom names, and selected expansion remain intact.

---

### Scenario D: Reset / New Game
1. Tap the **"Novo Jogo"** blob button at the bottom.
2. Confirm the reset dialog.
3. Verify all category fields clear to empty inputs and totals reset to `0`.


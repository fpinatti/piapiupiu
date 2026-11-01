# Quickstart & Validation Guide: Wingspan Scorepad Asia Duo Mode Track Scoring

**Feature**: `008-scorepad-asia-duo-mode`
**Date**: 2026-11-01

This guide provides end-to-end scenarios to validate the Asia Duo mode score line in the Wingspan scorepad.

---

## 1. Automated Validation Gates

Run the automated test suite and type check:

```bash
# 1. Typecheck (must report 0 errors)
npm run typecheck

# 2. Run Jest unit test suites (all tests including scoreCalculator must pass)
npm test
```

---

## 2. Interactive Validation Scenarios

### Scenario 1: Row Presence & Visual Theming
1. Open the application and navigate to the **Pontuação** tab in the bottom bar.
2. Scroll to the bottom of the score table card.
3. **Verify**:
   - The ninth category row is visible with label **"Modo Duo"**.
   - An organic watercolor droplet icon displays the **yin-yang** glyph with rose/crimson wash (`EXPANSION_THEME.asia`).
   - A subtle badge reading **"Ásia"** is rendered alongside the label.

### Scenario 2: Real-Time Score Calculation
1. In the **Modo Duo** row:
   - For Player 1, enter `12`.
   - For Player 2, enter `8`.
2. **Verify**:
   - Player 1's total score increases by `12` instantaneously.
   - Player 2's total score increases by `8` instantaneously.
   - The difference banner updates in real time to reflect the 4-point lead for Player 1.

### Scenario 3: Non-Asia Game (Empty / Blank Fallback)
1. Leave the **Modo Duo** row completely blank.
2. Enter values only in base game rows (e.g., Pássaros: `40`, Ovos: `10`).
3. **Verify**:
   - Total score correctly shows `50`.
   - No `NaN`, calculation errors, or warning popups appear.

### Scenario 4: Input Sanitization & Upper Bound
1. In the **Modo Duo** row, attempt to enter negative signs (`-10`), letters (`abc`), or more than 3 digits (`1234`).
2. **Verify**:
   - Negative signs and letters are completely ignored.
   - The field caps at 3 digits (`123`).

### Scenario 5: Clear / Reset Action
1. Tap **"Novo Jogo / Limpar"** at the top right of the scorepad.
2. Confirm the action when prompted.
3. **Verify**:
   - All fields including **Modo Duo** are reset to empty.
   - Both player totals reset to `0`.

### Scenario 6: Tab Navigation Persistence
1. Enter `14` points into **Modo Duo** for Player 1.
2. Switch to the **Catálogo** or **Scanner** tab.
3. Switch back to the **Pontuação** tab.
4. **Verify**:
   - The `14` points in **Modo Duo** and Player 1's total score remain preserved in memory.


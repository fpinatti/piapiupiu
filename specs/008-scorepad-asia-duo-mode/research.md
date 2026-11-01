# Research: Wingspan Scorepad Asia Duo Mode Track Scoring

**Feature**: `008-scorepad-asia-duo-mode`
**Date**: 2026-11-01
**Status**: Completed

## 1. Official Wingspan Asia Duo Mode Rules and Scoring Mechanics

### Context & Need
In the *Wingspan: Asia* expansion (designed by Elizabeth Hargrave for 1-2 players standalone or 6-7 players with Flock Mode), the 2-player "Duo Mode" replaces the competitive end-of-round goal mat with the **Duo Board** (Tabuleiro de Duo). Whenever a player plays a bird card, they place a dual-colored (yin-yang) duo token in their player color onto the Duo Map matching the habitat and bird characteristic.

At match conclusion, the official Asia scorepad provides a specific scoring row:
- **Scoring Rule**: Each player scores **1 point per token in their single largest contiguous cluster of duo tokens** on the Duo Board map.
- **Round Goals Note**: End-of-round goals in Duo mode are already tallied under the standard "Metas de Rodada" ("Round Goals") category, so this new line specifically isolates the connected cluster points on the Duo map.
- **Typical Point Range**: Usually between `0` and `15` points in tabletop play, but the calculator accepts `0..999`.

### Decision
- **Category ID**: `duo`
- **Label**: `"Modo Duo"`
- **Description**: `"Pontos do maior grupo de fichas conectadas no tabuleiro de Duo (Ásia)"`
- **Expansion Key**: `'asia'`
- **Position**: Placed alongside other official expansions (`hummingbirds` [Américas] and `nectar` [Oceania]), bringing the total categories in the unified table from 8 to 9.

### Alternatives Considered
- *Labeling as "Trilha Duo" or "Tabuleiro Duo"*: Rejected in favor of `"Modo Duo"`, which directly matches the official Stonemaier Games / Grok Games Portuguese scorepad heading ("Modo Duo") and clearly differentiates from the "Metas de Rodada".
- *Adding an Asia expansion toggle*: Rejected per Constitution and `005-score-pad-calculator` principles. The app uses a single unified table where unused expansion rows are simply left blank (treated as 0 points), eliminating all mode-switching friction.

---

## 2. Visual Theming, Watercolor Palette & Iconography

### Context & Need
Every scoring row in Piupiu U displays an authentic watercolor droplet icon (`WatercolorIcon`) and a subtle expansion pill badge when applicable. The Asia expansion needs to follow the Wingspan Naturalist Field Guide (`DESIGN.md`) design system.

### Decision
1. **Icon Type**: `'duo'` in `WatercolorIconType`.
2. **Icon Glyph**: `MaterialCommunityIcons` name `"yin-yang"`. In *Wingspan Asia*, the physical wooden duo tokens are literally circular yin-yang markers in black and white with player color rings.
3. **Palette Wash**:
   - `bg`: `#FAEBEC` (Soft cherry blossom rose wash from `EXPANSION_THEME.asia`)
   - `border`: `#E2A5A7` (Muted terracotta rose border)
   - `ink`: `#7A2024` (Deep crimson naturalist ink)
   - `halo`: `rgba(160, 60, 70, 0.16)` (Soft organic watercolor diffusion halo)
4. **Expansion Badge**:
   - The badge reads `"Ásia"` and uses `EXPANSION_THEME.asia` tokens (`#FAEBEC` background, `#E2A5A7` border, `#7A2024` text), maintaining 100% visual parity with `"Américas"` and `"Oceania"`.

### Alternatives Considered
- *Icon glyph `circle-multiple-outline` or `account-group`*: While descriptive of "two players", `yin-yang` is the literal physical artifact on the Wingspan Asia game pieces, creating instant delight and recognition for board game players.

---

## 3. Data Model, State Persistence & Backward Compatibility

### Context & Need
Existing sessions or serialized scorepad states might not contain the `duo` key in `state.player1.scores` or `state.player2.scores`.

### Decision
1. **Safe Parsing**: `parseScoreNumber(scores['duo'])` already handles `undefined` or `""` safely by returning `0`.
2. **Unified Summation**: `calculatePlayerTotal` and `evaluateScorepad` use `DEFAULT_SCORE_CATEGORIES`, which will now include `duo`. Any omitted score is treated as `0`, allowing games with Base + Asia, Base + Oceania, Base + Americas, or any combination to calculate accurately without migration scripts.
3. **Input Sanitization**: `sanitizeScoreInput` continues to enforce non-negative integer digits capped at 3 digits (`0..999`).

### Alternatives Considered
- *Requiring default keys initialized in state*: Redundant because `scores[categoryId] ?? ''` is already the pattern used across the scorepad inputs.


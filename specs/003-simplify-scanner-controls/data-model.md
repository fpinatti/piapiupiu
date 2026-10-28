# Phase 1 Data Model & State Model: Simplificação de Controles

**Feature Branch**: `003-simplify-scanner-controls`
**Date**: 2026-10-28
**Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/spec.md)

## 1. Ajustes de Estado e Props de Componentes

Nenhuma entidade persistida (`BirdCard`, `ScanMatchResult`, `BirdPhotoMetadata`) sofre alteração estrutural. As interfaces de propriedades das telas são simplificadas para refletir que todas as 597 aves e todos os idiomas estão permanentemente ativos:

### 1.1 `ScannerScreenProps` (`src/screens/ScannerScreen.tsx`)

```ts
export interface ScannerScreenProps {
  matcher: BirdMatcher;
  activeMatch: ScanMatchResult | null;
  onSelectMatch: (match: ScanMatchResult | null) => void;
  recentBirds: BirdCard[];
  onRecordRecentBird: (bird: BirdCard) => void;
  isPlaying: boolean;
  playingBirdId: string | null;
  onPlayBird: (bird: BirdCard) => void;
  onTogglePlayBird: (bird: BirdCard) => void;
}
```

**Estados locais removidos de `ScannerScreen`**:
- `showFiltersDrawer: boolean` (removido)
- `showSimPanel: boolean` (removido)
- `manualOcrInput: string` (removido)
- `SAMPLE_OCR_CARDS: string[]` (removido)

---

### 1.2 `CatalogScreenProps` (`src/screens/CatalogScreen.tsx`)

```ts
export interface CatalogScreenProps {
  matcher: BirdMatcher;
  isPlaying: boolean;
  playingBirdId: string | null;
  onTogglePlayBird: (bird: BirdCard) => void;
}
```

---

### 1.3 `App` Root State (`App.tsx`)

- `matcher` é instanciado uma única vez com `expansions: ALL_EXPANSIONS` (`['base', 'europe', 'oceania', 'asia', 'americas']`) e `language: 'all'`.
- Estados `selectedExpansions` e `language` deixam de ser mutáveis na UI, garantindo que 100% das 597 aves estejam sempre ativas no Scanner e no Catálogo.


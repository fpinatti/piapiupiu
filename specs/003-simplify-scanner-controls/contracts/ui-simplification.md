# UI Contracts: ScannerScreen & CatalogScreen Simplification

**Feature Branch**: `003-simplify-scanner-controls`
**Date**: 2026-10-28

## 1. `ScannerScreen` Contract (`src/screens/ScannerScreen.tsx`)

### Top Overlay Controls
- **Removed**:
  - Botão `"Filtros (N)"` e gaveta `<FilterBar compact />`
  - Botão `"Testar Cartas"`
- **Retained (Hardware-Conditional)**:
  - Botão `"Luz"` / `"Luz: ON"` (exibido apenas quando `cameraCaps.hasTorch === true`)
  - Botão `"Lendo"` / `"Pausado"` (exibido apenas quando `cameraCaps.hasCamera === true`)

### Bottom Stack Controls
- **Removed**:
  - Painel `simContainer` (`"Testar cartas sem câmera"`, chips `SAMPLE_OCR_CARDS` e `TextInput` de simulação)
- **Retained**:
  - Faixa `"Recentes na mesa"` (`recentBirds`)
  - Card da ave reconhecida (`<BirdPlayingCard />` com `<BirdPhoto variant="hero" enableZoom />` e botão Ouvir/Parar)

---

## 2. `CatalogScreen` Contract (`src/screens/CatalogScreen.tsx`)

- **Removed**:
  - Barra `<FilterBar />` no topo da tela
- **Retained**:
  - Barra de pesquisa rápida (`"Buscar ave em PT-BR, Inglês ou Latim..."`)
  - Contador de aves disponíveis (`597 aves disponíveis` por padrão)
  - Lista virtualizada (`FlatList`) exibindo `name_pt` como título principal, `name_en • scientific` como subtítulo, tags de expansão e habitat, `<BirdPhoto variant="thumbnail" enableZoom />` e botão de reprodução de áudio.


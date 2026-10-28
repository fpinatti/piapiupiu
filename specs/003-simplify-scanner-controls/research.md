# Phase 0 Research: Simplificação da Interface com Remoção de "Testar Cartas" e "Filtros"

**Feature Branch**: `003-simplify-scanner-controls`
**Date**: 2026-10-28
**Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/spec.md)

## 1. Remoção do Botão e Painel "Testar Cartas" (`ScannerScreen.tsx`)

### Decision
Remover completamente da tela `src/screens/ScannerScreen.tsx`:
- O botão de ação superior `"Testar Cartas"` (`showSimPanel` toggle).
- O painel inferior `simContainer` (`"Testar cartas sem câmera"`, `SAMPLE_OCR_CARDS`, chips horizontais e `TextInput` manual `manualOcrInput`).
- O gatilho automático `!cameraCaps.hasCamera` que forçava a exibição do painel de simulação quando a câmera ainda estava inicializando ou sem permissão.

### Rationale
- O fluxo real de captura por foto (`Fotografar e Ler Carta`) no `LiveCameraScanner` já está maduro e funcional no Expo Go e Web.
- O painel `"Testar Cartas"` ocupava uma grande faixa vertical da tela do Scanner (especialmente durante a inicialização da câmera quando `cameraCaps.hasCamera` iniciava como `false`), poluindo a interface durante a partida.

### Alternatives Considered
- **Esconder atrás de um menu de configurações**: Desnecessário, pois a aba **Catálogo (597)** já permite buscar e tocar qualquer uma das 597 aves manualmente a qualquer momento.

---

## 2. Remoção da Opção "Filtros" (`ScannerScreen.tsx`, `CatalogScreen.tsx` e `App.tsx`)

### Decision
- Remover o botão `"Filtros"` e a renderização condicional de `<FilterBar compact />` em `src/screens/ScannerScreen.tsx`.
- Remover a barra `<FilterBar />` do topo de `src/screens/CatalogScreen.tsx`.
- Manter o `BirdMatcher` em `App.tsx` inicializado permanentemente com todas as 5 expansões (`ALL_EXPANSIONS = ['base', 'europe', 'oceania', 'asia', 'americas']`) e idioma `'all'` (busca simultânea em Português, Inglês e Nome Científico).
- Simplificar as props de `ScannerScreenProps` e `CatalogScreenProps` removendo `selectedExpansions`, `onToggleExpansion`, `language` e `onChangeLanguage`.

### Rationale
- Com o índice `Fuse.js` otimizado, a busca e o OCR sobre todas as 597 aves levam menos de `15ms` (bem abaixo do limite de `100ms` da Constituição).
- Remover os filtros elimina o erro humano comum na mesa de jogo (desmarcar uma expansão ou idioma por engano e achar que o aplicativo não encontrou a carta) e libera espaço vertical valioso tanto no Scanner quanto na lista do Catálogo.


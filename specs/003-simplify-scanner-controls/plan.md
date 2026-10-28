# Implementation Plan: Simplificação da Interface com Remoção de "Testar Cartas" e "Filtros"

**Branch**: `003-simplify-scanner-controls` | **Date**: 2026-10-28 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/spec.md)

**Input**: Feature specification from `/specs/003-simplify-scanner-controls/spec.md`

## Summary

Simplificar a interface do **Piupiu U** removendo o botão e painel de depuração **"Testar Cartas"** da tela do Scanner (`ScannerScreen.tsx`) e removendo a opção/barra de **"Filtros"** tanto do Scanner (`ScannerScreen.tsx`) quanto do Catálogo (`CatalogScreen.tsx` e `App.tsx`). Todas as **597 aves** das 5 expansões (`base`, `europe`, `oceania`, `asia`, `americas`) e todos os idiomas (`PT-BR`, `EN`, `Científico`) permanecem ativos por padrão no `BirdMatcher`.

## Technical Context

**Language/Version**: TypeScript 5.9 / React 19.3.0 / React Native 0.88.0 (Expo SDK 58)

**Primary Dependencies**: `expo@~58.0.20`, `react-native@0.88.0`, `@expo/vector-icons@^15.1.1`, `fuse.js@^7.0.0`

**Storage**: Catálogo estático em `src/data/birds.json` (597 aves)

**Testing**: Jest + `ts-jest` (`npm test`) e TypeScript (`npm run typecheck`)

**Target Platform**: Android, iOS (Expo Go SDK 58) e Web (`react-native-web`)

**Project Type**: Aplicativo móvel e web companion para *Wingspan*

**Performance Goals**: `<100ms` para busca e leitura OCR nas 597 aves simultaneamente; `60fps` na rolagem da lista

**Constraints**: Preservar todos os controles de câmera (`Fotografar e Ler Carta`, zoom `1x / 1.5x / 2x / Macro`, lanterna `Luz`), histórico `"Recentes na mesa"` e card de reprodução (`BirdPlayingCard`).

**Scale/Scope**: Atualização enxuta em 3 arquivos (`src/screens/ScannerScreen.tsx`, `src/screens/CatalogScreen.tsx`, `App.tsx`) e remoção do componente órfão `src/components/FilterBar.tsx`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Table-Side Speed & Deliberate OCR Precision**: A remoção dos painéis `"Testar Cartas"` e `"Filtros"` reduz a cerimônia na mesa de jogo e libera área útil no visor da câmera, mantendo a busca em `<100ms`. (**PASS**)
- **II. Taxonomic Grounding & 597-Bird Bilingual Catalog**: Com `ALL_EXPANSIONS` e idioma `'all'` sempre ativos, 100% das 597 aves continuam indexadas simultaneamente por `name_pt`, `name_en` e `scientific`. (**PASS**)
- **III. Authentic Ornithological Media & Single-Player Audio**: Nenhuma alteração no streaming de áudio ou fotos reais das aves. (**PASS**)
- **IV. Lightweight Bundle & On-Demand Streaming**: Reduz ainda mais o tamanho do código JS ao remover UI de simulação e filtragem desnecessária. (**PASS**)
- **V. Security, Privacy & Zero Hardcoded Secrets**: Remove um campo de entrada manual (`manualOcrInput`) desnecessário no Scanner e mantém todas as garantias de segurança. (**PASS**)

## Project Structure

### Documentation (this feature)

```text
specs/003-simplify-scanner-controls/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/
│   └── ui-simplification.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── screens/
│   ├── ScannerScreen.tsx    # [MODIFY] Remove botão "Testar Cartas", painel simContainer e botão/gaveta "Filtros"
│   └── CatalogScreen.tsx    # [MODIFY] Remove barra <FilterBar /> e props de filtro
├── components/
│   └── FilterBar.tsx        # [DELETE] Componente de barra de filtros não mais utilizado na UI
App.tsx                      # [MODIFY] Simplifica estado raiz mantendo ALL_EXPANSIONS e idioma 'all' sempre ativos
```

**Structure Decision**: Refatoração direta nos componentes existentes em `src/screens/` e `App.tsx`.

## Verification Plan & Security Review

### Automated Verification
- **`npm run typecheck`**: `0` erros de compilação TypeScript após a simplificação das props de `ScannerScreen` e `CatalogScreen`.
- **`npm test`**: Todas as 4 suítes de testes unitários (`25` testes) continuam passando.

### Security Verification (`mandatory-secure-web-skills`)
- A remoção da superfície de entrada `manualOcrInput` e dos botões de depuração em `ScannerScreen.tsx` reduz a superfície de UI exposta em produção.
- Nenhuma nova dependência, rota externa ou manipulação de DOM é introduzida.

## Complexity Tracking

Nenhuma violação à constituição do projeto.

# Tasks: Simplificação da Interface com Remoção de "Testar Cartas" e "Filtros"

**Input**: Design documents from `/specs/003-simplify-scanner-controls/`

**Prerequisites**: [plan.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/plan.md) (required), [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/spec.md) (required for user stories), [research.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/research.md), [data-model.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/data-model.md), [contracts/ui-simplification.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/contracts/ui-simplification.md), [quickstart.md](file:///home/fpinatti/repos/piapiupiu/specs/003-simplify-scanner-controls/quickstart.md)

**Organization**: Tasks are grouped by user story (`US1`, `US2`) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`)
- Exact file paths are included in every task description

---

## Phase 1: Setup & Foundational (Root State Simplification)

**Purpose**: Ensure `BirdMatcher` in `App.tsx` is permanently configured with all 5 expansions (`ALL_EXPANSIONS`) and language `'all'`, and remove unused filter state props passed down to screens.

- [X] T001 Simplify `App.tsx` by keeping `BirdMatcher` permanently initialized with `expansions: ALL_EXPANSIONS` and `language: 'all'` and removing filter state/props passed to `ScannerScreen` and `CatalogScreen` in `App.tsx`

---

## Phase 2: User Story 1 - Tela do Scanner Limpa sem Botões "Testar Cartas" e "Filtros" (Priority: P1) 🎯 MVP

**Goal**: Remover da tela do Scanner (`ScannerScreen.tsx`) o botão `"Testar Cartas"`, o painel inferior `"Testar cartas sem câmera"` (chips de exemplo e campo de digitação manual) e o botão/gaveta `"Filtros"`, preservando os controles reais da câmera (`Fotografar e Ler Carta`, zoom óptico, lanterna `"Luz"`, faixa `"Recentes na mesa"` e `BirdPlayingCard`).

**Independent Test**: Abrir a aba **Scanner de Cartas** e verificar que os botões `"Testar Cartas"` e `"Filtros"` e seus painéis não aparecem em nenhum momento (com ou sem câmera ativa), mantendo o visor limpo.

### Implementation for User Story 1

- [X] T002 [US1] Remove the `"Testar Cartas"` button, `"Filtros"` button, `<FilterBar compact />` drawer, `simContainer` simulation panel (`SAMPLE_OCR_CARDS`, `manualOcrInput`, `handleSimulatedOcrTrigger`), and unused styles/props in `src/screens/ScannerScreen.tsx`

**Checkpoint**: User Story 1 (MVP) is complete — the Scanner screen is clean and free of simulation/filter clutter.

---

## Phase 3: User Story 2 - Catálogo Direto sem Barra de Filtros (Priority: P2)

**Goal**: Remover a barra superior de filtros (`FilterBar`) da tela do Catálogo (`CatalogScreen.tsx`) para exibir diretamente o campo de busca rápida e a lista completa das 597 aves, e remover o componente `FilterBar.tsx` que deixou de ser utilizado.

**Independent Test**: Abrir a aba **Catálogo (597)** e verificar que a barra de filtros não é exibida acima do campo de pesquisa e que todas as 597 aves estão listadas e pesquisáveis em Português, Inglês e Nome Científico.

### Implementation for User Story 2

- [X] T003 [P] [US2] Remove `<FilterBar />` rendering and filter props (`selectedExpansions`, `onToggleExpansion`, `language`, `onChangeLanguage`) in `src/screens/CatalogScreen.tsx`
- [X] T004 [P] [US2] Remove the unused filter bar component file `src/components/FilterBar.tsx`

**Checkpoint**: Both User Stories 1 and 2 are complete and independently functional.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validate TypeScript compilation and automated unit test suite.

- [X] T005 Run `npm run typecheck` and `npm test` to confirm zero TypeScript errors and 100% test pass rate across all suites

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (`T001`)**: Updates `App.tsx` prop bindings alongside Phase 2 (`T002`) and Phase 3 (`T003`).
- **Phase 2 (`T002` — US1)** & **Phase 3 (`T003`, `T004` — US2)**: Touch separate screen files (`src/screens/ScannerScreen.tsx`, `src/screens/CatalogScreen.tsx`, `src/components/FilterBar.tsx`) and can be executed in parallel.
- **Phase 4 (`T005`)**: Runs after `T001`–`T004` complete.

---

## Parallel Example: User Story 1 & User Story 2

```bash
# T002, T003, and T004 operate on independent files and can run in parallel:
Task T002: "Remove 'Testar Cartas' and 'Filtros' from src/screens/ScannerScreen.tsx"
Task T003: "Remove <FilterBar /> and filter props from src/screens/CatalogScreen.tsx"
Task T004: "Remove unused src/components/FilterBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete `T001` and `T002` to clean up the Scanner screen (`ScannerScreen.tsx`).
2. Complete `T003` and `T004` to clean up the Catalog screen (`CatalogScreen.tsx`) and remove `FilterBar.tsx`.
3. Validate with `T005` (`npm run typecheck && npm test`).


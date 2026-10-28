# Tasks: Redesenho do Disparador e Mira do Scanner de Cartas

**Input**: Design documents from `/specs/004-camera-shutter-and-viewfinder-redesign/`

**Prerequisites**: [plan.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/plan.md) (required), [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/spec.md) (required for user stories), [research.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/research.md), [data-model.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/data-model.md), [contracts/viewfinder-and-shutter.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/contracts/viewfinder-and-shutter.md), [quickstart.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/quickstart.md)

**Organization**: Tasks are grouped by user story (`US1`, `US2`, `US3`) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Exact file paths are included in every task description

---

## Phase 1: User Story 1 - Disparador de Câmera na Parte Inferior da Tela (Priority: P1) 🎯 MVP

**Goal**: Mover o botão disparador de foto para a parte inferior da tela (área do polegar), adotando um botão circular ergonômico (`72x72`) com anel externo contrastante e exclusivamente um ícone de câmera (sem texto longo), com indicador de atividade integrado durante a análise da foto.

**Independent Test**: Abrir o Scanner de Cartas e verificar que o botão de fotografar está localizado na base da tela em formato circular com ícone de câmera, acionando a captura com facilidade ao toque do polegar.

### Implementation for User Story 1

- [X] T001 [US1] Redesign the photo shutter button into a circular thumb-zone button (`72x72`) with camera icon `<Feather name="camera" size={28} />`, move it to the bottom floating area (`bottom: 24`), and position zoom controls at the top in `src/components/LiveCameraScanner.native.tsx`
- [X] T002 [P] [US1] Align `src/components/LiveCameraScanner.web.tsx` by moving the shutter button to the bottom area with the same circular camera-icon styling for browser mode

**Checkpoint**: User Story 1 (MVP) is complete — photo capture shutter button is moved to the bottom of the screen.

---

## Phase 2: User Story 2 & 3 - Mira Despoluída, Marca d'Água e Remoção de Status (Priority: P1/P2)

**Goal**: Desobstruir a caixa de mira pontilhada: mover o rótulo `"Posicione o topo da carta aqui"` para cima da borda pontilhada, remover o texto interno `"Alinhe o nome da ave em CAIXA ALTA dentro da mira"`, adicionar uma marca d'água translúcida de alinhamento e remover a pílula de status `"Lido: ..."` e mensagens técnicas residuais de OCR.

**Independent Test**: Visualizar a mira central no Scanner e confirmar que o rótulo está acima da caixa, o interior possui uma marca d'água sutil de orientação de cabeçalho e nenhuma pílula `"Lido: ..."` ou texto técnico é exibido.

### Implementation for User Story 2 & 3

- [X] T003 [US2] Move `targetLabel` above the dotted box, remove `targetSublabel` and `liveOcrPill`, and add a translucent watermark guide with card header outline and feather silhouette in `src/screens/ScannerScreen.tsx`
- [X] T004 [P] [US3] Remove residual `statusFeedback` and `feedbackPill` banners from `src/components/LiveCameraScanner.native.tsx` and `src/components/LiveCameraScanner.web.tsx`

**Checkpoint**: User Stories 2 and 3 are complete — the viewfinder is clean, unobstructed, and guided by the translucent watermark.

---

## Phase 3: Polish & Verification

**Purpose**: Validate TypeScript compilation and ensure all unit tests pass.

- [X] T005 Run `npm run typecheck` and `npm test` to verify zero TypeScript errors and 100% test pass rate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (`T001`, `T002`)**: Can be developed concurrently across native and web camera components.
- **Phase 2 (`T003`, `T004`)**: Can be developed concurrently with Phase 1.
- **Phase 3 (`T005`)**: Runs after `T001`–`T004` are complete.

---

## Parallel Example

```bash
# T001, T002, and T003 operate on separate files and can run in parallel:
Task T001: "Redesign shutter button in src/components/LiveCameraScanner.native.tsx"
Task T002: "Align web shutter button in src/components/LiveCameraScanner.web.tsx"
Task T003: "Overhaul viewfinder target box in src/screens/ScannerScreen.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)
1. Implement `T001` and `T002` (bottom circular shutter button).
2. Implement `T003` and `T004` (viewfinder watermark guide, top-shifted label, removal of status pills).
3. Validate with `T005` (`npm run typecheck && npm test`).


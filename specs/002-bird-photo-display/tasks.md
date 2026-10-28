# Tasks: Exibição de Fotografia Real da Ave Junto ao Canto

**Input**: Design documents from `/specs/002-bird-photo-display/`

**Prerequisites**: [plan.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/plan.md) (required), [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/spec.md) (required for user stories), [research.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/research.md), [data-model.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/data-model.md), [contracts/bird-image-service.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/contracts/bird-image-service.md), [quickstart.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/quickstart.md)

**Tests**: Unit tests for `birdImageService` are included in the Polish/Verification phase to validate taxonomic resolution, fallback behavior, session caching, and HTTPS URL allow-listing.

**Organization**: Tasks are grouped by user story (`US1`, `US2`, `US3`) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Types & Contracts)

**Purpose**: Extend shared TypeScript definitions with bird photograph metadata types and optional `imageUrl` field on `BirdCard`.

- [X] T001 Extend `BirdCard` with optional `imageUrl?: string` and add `BirdPhotoSource` and `BirdPhotoMetadata` interfaces in `src/types/bird.ts`

---

## Phase 2: Foundational (Core Bird Image Resolution Service & Reusable Component)

**Purpose**: Core open-repository photo resolution service (`birdImageService.ts`) and reusable `<BirdPhoto>` UI component that MUST be complete before integrating into the Scanner, Catalog, and Mini-Player screens.

**⚠️ CRITICAL**: No user story screen integration can begin until this phase is complete.

- [X] T002 Implement `isAllowedImageUrl`, in-memory session cache (`resolvedCache`), in-flight request deduplication (`inFlightRequests`), iNaturalist Taxa API v1 lookup, and Wikipedia REST API v1 (`page/summary`) fallback in `src/services/birdImageService.ts`
- [X] T003 Create reusable `<BirdPhoto>` component with `'hero'`, `'thumbnail'`, and `'mini'` size variants, habitat-tinted ornithological placeholder, smooth loading state, and full-screen zoom `<Modal>` (`enableZoom`) in `src/components/BirdPhoto.tsx`

**Checkpoint**: Foundation ready — `resolveBirdPhoto` and `<BirdPhoto>` are ready for User Story 1, 2, and 3 integrations.

---

## Phase 3: User Story 1 - Visualizar a Foto Real da Ave no Card de Reprodução do Scanner (Priority: P1) 🎯 MVP

**Goal**: Quando o jogador fotografa uma carta de *Wingspan* no Scanner (ou simula uma carta no painel de testes) e o aplicativo reproduz o canto da ave, o card em destaque (`BirdPlayingCard`) exibe a fotografia real da espécie (com toque para ampliar em tela cheia), sem atrasar ou bloquear o áudio.

**Independent Test**: Na aba **Scanner de Cartas**, fotografar ou selecionar qualquer ave (ex.: *Gaio-azul*, *Cegonha-branca*, *Beija-flor-rubi*) e verificar que a foto real aparece no `BirdPlayingCard` com opção de toque para zoom em tela cheia e fallback visual caso offline.

### Implementation for User Story 1

- [X] T004 [US1] Integrate `<BirdPhoto bird={bird} variant="hero" enableZoom />` into the main row of `src/components/BirdPlayingCard.tsx` alongside the bird names and audio playback button
- [X] T005 [US1] Add a tap-to-zoom hint badge (magnifying glass icon overlay) on the `hero` variant and full-screen modal with Portuguese, English, scientific names, and photographer attribution in `src/components/BirdPhoto.tsx`

**Checkpoint**: At this point, User Story 1 (MVP) is complete and independently testable in the Scanner tab.

---

## Phase 4: User Story 2 - Visualizar Miniaturas de Fotos das Aves no Catálogo e no Mini-Player (Priority: P2)

**Goal**: Ao navegar ou pesquisar entre as 597 aves na aba **Catálogo** (ou ao ouvir uma ave pelo **Mini-Player** inferior), o usuário visualiza a miniatura fotográfica de cada espécie visíveis na tela sem travar a rolagem.

**Independent Test**: Abrir a aba **Catálogo (597)**, rolar a lista ou buscar por uma espécie (ex.: *Little Grebe* / *Mergulhão-pequeno*), verificar que as miniaturas carregam progressivamente e que, ao tocar para ouvir, o Mini-Player inferior também exibe a miniatura da ave.

### Implementation for User Story 2

- [X] T006 [P] [US2] Render `<BirdPhoto bird={item} variant="thumbnail" enableZoom />` in each visible bird row of `FlatList` in `src/screens/CatalogScreen.tsx`
- [X] T007 [P] [US2] Render `<BirdPhoto bird={currentlyPlayingBird} variant="mini" enableZoom={false} />` inside the persistent bottom Mini-Player in `App.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently across Scanner, Catalog, and Mini-Player.

---

## Phase 5: User Story 3 - Enriquecimento Opcional do Catálogo com URLs de Fotos Abertas (Priority: P3)

**Goal**: Suportar resolução instantânea via atributo opcional `bird.imageUrl` no registro da ave (além da busca dinâmica pelo nome científico binomial `bird.scientific` e fallback pelo nome em inglês `bird.name_en` para sinônimos taxonômicos).

**Independent Test**: Verificar que uma ave com `imageUrl` pré-definida resolve instantaneamente sem requisição de rede à API de busca, e que espécies com sinônimos taxonômicos (ex.: divergência entre nome científico da carta e base taxonômica) fazem fallback automático para busca por `bird.name_en`.

### Implementation for User Story 3

- [X] T008 [US3] Enhance `resolveBirdPhoto` in `src/services/birdImageService.ts` to prioritize validated `bird.imageUrl` (`source: 'catalog'`) and add taxonomic synonym fallback using `bird.name_en` across both iNaturalist Taxa API and Wikipedia REST API

**Checkpoint**: All 3 user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Automated unit tests, security verification (HTTPS allow-list & sanitization), and TypeScript/bundle validation.

- [X] T009 [P] Create unit test suite in `src/__tests__/birdImageService.test.ts` covering `bird.imageUrl` fast-path, iNaturalist scientific lookup, Wikipedia fallback, session cache hits, in-flight request deduplication, offline error resilience, and `isAllowedImageUrl` security allow-list
- [X] T010 Run `npm run typecheck` and `npm test` to validate zero TypeScript errors and 100% test pass rate across all suites

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1 — `T001`)**: No dependencies — starts immediately.
- **Foundational (Phase 2 — `T002`, `T003`)**: Depends on `T001` — BLOCKS all user stories.
- **User Story 1 (Phase 3 — `T004`, `T005`)**: Depends on Phase 2 (`T002`, `T003`).
- **User Story 2 (Phase 4 — `T006`, `T007`)**: Depends on Phase 2 (`T002`, `T003`). Can run in parallel with User Story 1.
- **User Story 3 (Phase 5 — `T008`)**: Depends on `T002`.
- **Polish (Phase 6 — `T009`, `T010`)**: Depends on `T002`–`T008`.

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Phase 2.
- **User Story 2 (P2)**: Independent after Phase 2 (`T006` in `src/screens/CatalogScreen.tsx` and `T007` in `App.tsx` touch separate files and are marked `[P]`).
- **User Story 3 (P3)**: Independent enhancement on `src/services/birdImageService.ts`.

---

## Parallel Example: User Story 2

```bash
# Once Phase 2 (Foundational) completes, T006 and T007 can be executed in parallel:
Task T006: "Render <BirdPhoto bird={item} variant='thumbnail' enableZoom /> in src/screens/CatalogScreen.tsx"
Task T007: "Render <BirdPhoto bird={currentlyPlayingBird} variant='mini' enableZoom={false} /> in App.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`)
2. Complete Phase 2: Foundational (`T002`, `T003`)
3. Complete Phase 3: User Story 1 (`T004`, `T005`)
4. **STOP and VALIDATE**: Test `BirdPlayingCard` photo display + full-screen zoom modal in the Scanner tab.

### Incremental Delivery

1. Setup + Foundational (`T001`–`T003`) → Core service & component ready
2. Add User Story 1 (`T004`–`T005`) → Hero photo + zoom in Scanner (`BirdPlayingCard`)
3. Add User Story 2 (`T006`–`T007`) → Thumbnails in Catalog (`CatalogScreen`) + Mini-Player (`App.tsx`)
4. Add User Story 3 + Polish (`T008`–`T010`) → Pre-populated URL support, synonym fallback, and unit test verification


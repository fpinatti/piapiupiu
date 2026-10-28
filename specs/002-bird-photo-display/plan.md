# Implementation Plan: Exibição de Fotografia Real da Ave Junto ao Canto

**Branch**: `002-bird-photo-display` | **Date**: 2026-10-28 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/spec.md)

**Input**: Feature specification from `/specs/002-bird-photo-display/spec.md`

## Summary

Exibir a fotografia real de cada espécie de ave junto à reprodução do seu canto no **Card de Reprodução do Scanner** (`BirdPlayingCard`), nos itens da lista do **Catálogo de 597 aves** (`CatalogScreen`) e no **Mini-Player** inferior (`App.tsx`), incluindo ampliação em tela cheia ao tocar na foto.

A abordagem técnica mantém o pacote instalável leve (**zero imagens binárias embutidas no bundle**, preservando atualizações instantâneas no Expo Go / EAS Update) através de:
1. **`src/services/birdImageService.ts`**: Resolução sob demanda de fotografias ornitológicas abertas via **iNaturalist Taxa API v1** (`default_photo.medium_url` / `large_url`) como fonte primária pelo nome científico (`bird.scientific`) e **Wikipedia REST API v1 (`page/summary`)** como fallback, sem exigir chave de API, com cache em memória por sessão (`Map`), deduplicação de requisições concorrentes e validação estrita de URLs HTTPS (`isAllowedImageUrl`).
2. **`src/components/BirdPhoto.tsx`**: Componente visual reutilizável com três variantes (`hero`, `thumbnail`, `mini`), placeholder ornitológico colorido pelo habitat da ave durante o carregamento ou offline, transição suave e modal de ampliação em tela cheia (`enableZoom`).
3. **Integração não-bloqueante**: O carregamento da fotografia ocorre de forma totalmente independente e paralela ao `audioService`, garantindo que a reprodução do canto nunca espere pela imagem.

## Technical Context

**Language/Version**: TypeScript 5.9 / React 19.3.0 / React Native 0.88.0 (Expo SDK 58)

**Primary Dependencies**: `expo@~58.0.20`, `react-native@0.88.0`, `expo-audio@~58.0.10`, `@expo/vector-icons@^15.1.1`, `react-native-safe-area-context@~5.7.0` (sem necessidade de adicionar novas dependências externas ao `package.json`)

**Storage**: Catálogo JSON estático (`src/data/birds.json`) + cache de sessão em memória (`Map<string, BirdPhotoMetadata | null>`) + cache HTTP/disco nativo do componente `<Image>` do React Native

**Testing**: Jest + `ts-jest` (`npm test`) e compilador TypeScript (`npm run typecheck`)

**Target Platform**: Android & iOS (Expo Go SDK 58 / builds nativos) + Web (`react-native-web`)

**Project Type**: Aplicativo móvel e web companion para o jogo de tabuleiro *Wingspan*

**Performance Goals**:
- `<1.5s` para carregar e exibir a fotografia na primeira consulta em rede padrão (`SC-002`)
- `<100ms` para exibir fotografias já consultadas na sessão via cache em memória (`SC-002`)
- `60fps` na rolagem da `FlatList` de 597 aves no `CatalogScreen` (`SC-004`)
- `0ms` de atraso adicional no início da reprodução do canto (`FR-005`)

**Constraints**:
- Zero arquivos de imagem das 597 aves embutidos no bundle JS/assets (`<50 KB` de impacto no bundle — `SC-003`)
- Nenhuma chave de API privada obrigatória (`FR-001`)
- Validação estrita de URLs de imagens remotas via allow-list HTTPS

**Scale/Scope**: 597 espécies de aves em 5 expansões (`base`, `europe`, `oceania`, `asia`, `americas`), 1 novo serviço (`birdImageService.ts`), 1 novo componente (`BirdPhoto.tsx`), 3 superfícies de UI atualizadas (`BirdPlayingCard.tsx`, `CatalogScreen.tsx`, `App.tsx`) e suíte de testes unitários (`birdImageService.test.ts`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Taxonomic Grounding (`PRODUCT.md` Principle #4)**: A busca fotográfica utiliza o nome científico binomial (`bird.scientific`) como chave taxonômica primária no iNaturalist e na Wikipedia, com fallback para `bird.name_en`. (**PASS**)
- **Lightweight Bundle & Fast OTA Updates**: Nenhuma das 597 fotos é embutida estaticamente no bundle Metro; todas são resolvidas sob demanda via HTTPS e mantidas em cache, mantendo o pacote leve para o Expo Go. (**PASS**)
- **Non-Blocking Audio Playback (`FR-005`)**: `audioService.playBird(bird)` e `<BirdPhoto bird={bird} />` operam de forma desacoplada e paralela; falhas de rede na imagem jamais interrompem o som. (**PASS**)
- **Mandatory Secure Coding Rules (`mandatory-secure-web-skills`)**:
  - Todas as URLs retornadas por APIs externas passam por validação estrita de protocolo (`https:`) e allow-list de domínios (`static.inaturalist.org`, `inaturalist-open-data.s3.amazonaws.com`, `upload.wikimedia.org`) antes de serem renderizadas.
  - Nenhum segredo ou chave de API é armazenado no código.
  - Renderização utiliza apenas componentes nativos do React Native (`<Image>`, `<Text>`, `<Modal>`) com auto-escaping nativo do JSX (sem `dangerouslySetInnerHTML` ou manipulação de DOM insegura).
  - Nenhuma adição de pacote externo ao `package.json`. (**PASS**)

## Project Structure

### Documentation (this feature)

```text
specs/002-bird-photo-display/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/
│   └── bird-image-service.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── types/
│   └── bird.ts                          # [MODIFY] Adiciona imageUrl?: string em BirdCard e tipos BirdPhotoMetadata / BirdPhotoSource
├── services/
│   └── birdImageService.ts              # [NEW] Resolução de fotos (iNaturalist Taxa API -> Wikipedia REST API), cache em memória, deduplicação e allow-list HTTPS
├── components/
│   ├── BirdPhoto.tsx                    # [NEW] Avatar/foto da ave com variantes ('hero', 'thumbnail', 'mini'), placeholder por habitat e modal de zoom em tela cheia
│   └── BirdPlayingCard.tsx              # [MODIFY] Exibe <BirdPhoto variant="hero" enableZoom /> ao lado dos nomes e botão de áudio
├── screens/
│   └── CatalogScreen.tsx                # [MODIFY] Exibe <BirdPhoto variant="thumbnail" enableZoom /> em cada item visível da FlatList
└── __tests__/
    └── birdImageService.test.ts         # [NEW] Testes unitários de resolução iNaturalist, fallback Wikipedia, cache, deduplicação e bloqueio de URLs inseguras

App.tsx                                  # [MODIFY] Exibe <BirdPhoto variant="mini" /> no Mini-Player inferior quando uma ave está tocando
```

**Structure Decision**: Mantém a estrutura modular do aplicativo React Native / Expo em `src/types`, `src/services`, `src/components`, `src/screens` e `src/__tests__`, sem adicionar dependências de terceiros.

## Verification Plan & Security Review

### Automated Verification
1. **TypeScript Typecheck (`npm run typecheck`)**: Deve executar com `0` erros.
2. **Unit Tests (`npm test`)**:
   - `src/__tests__/birdImageService.test.ts`:
     - Resolve foto via iNaturalist Taxa API pelo nome científico (`Tachybaptus ruficollis`).
     - Faz fallback automático para Wikipedia REST API quando o iNaturalist não retorna `default_photo`.
     - Retorna resultado instantaneamente do cache em memória na segunda chamada sem disparar novo `fetch`.
     - Deduplica chamadas simultâneas para a mesma ave (`inFlightRequests`).
     - Retorna `null` graciosamente quando offline ou quando ambas as APIs falham.

### Security Verification (`mandatory-secure-web-skills`)
1. **Input Validation & URL Allow-Listing**:
   - Verificar em `birdImageService.test.ts` que `isAllowedImageUrl()` rejeita URLs `http://`, `javascript:`, `data:`, `file://` e domínios não pertencentes à allow-list (`static.inaturalist.org`, `inaturalist-open-data.s3.amazonaws.com`, `upload.wikimedia.org`).
   - Garantir o uso de `encodeURIComponent()` em todos os parâmetros enviados às URLs de consulta da API do iNaturalist e da Wikipedia.
2. **XSS & Safe Rendering**:
   - Garantir que todas as strings de atribuição (`photo.attribution`), nomes de aves e metadados sejam renderizados exclusivamente dentro de componentes `<Text>` do React Native (auto-escaping nativo do React, sem `dangerouslySetInnerHTML`, `innerHTML` ou `alert()`).
3. **Secrets & Privacy**:
   - Confirmar que nenhuma chave de API ou credencial é necessária ou armazenada no código-fonte, e nenhum dado pessoal do usuário é enviado ou registrado em logs.
4. **Zero New Dependencies**:
   - Confirmar que nenhuma nova dependência npm é adicionada ao `package.json`.

## Complexity Tracking

Nenhuma violação à constituição ou às regras de arquitetura do projeto.

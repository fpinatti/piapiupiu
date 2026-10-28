# Implementation Plan: Redesenho do Disparador e Mira do Scanner de Cartas

**Branch**: `004-camera-shutter-and-viewfinder-redesign` | **Date**: 2026-10-28 | **Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/spec.md)

**Input**: Feature specification from `/specs/004-camera-shutter-and-viewfinder-redesign/spec.md`

## Summary

Modernizar a interface do Scanner de Cartas no **Piupiu U** com:
1. **Botão disparador de foto na base da tela**: botão circular ergonômico estilo obturador fotográfico (`72x72`) contendo exclusivamente um ícone de câmera (sem texto longo), centralizado na área do polegar.
2. **Mira pontilhada despoluída**: rótulo `"Posicione o topo da carta aqui"` movido para cima e fora da caixa pontilhada; remoção de textos opacos internos e inserção de gabarito translúcido tipo marca d'água para orientar o enquadramento.
3. **Remoção de pílulas de status residual de OCR**: eliminação de textos técnicos como `"Lido: ..."` e banners de feedback que sobravam da antiga leitura contínua.

## Technical Context

**Language/Version**: TypeScript 5.9 / React 19.3.0 / React Native 0.88.0 (Expo SDK 58)

**Primary Dependencies**: `expo@~58.0.20`, `expo-camera@~58.0.13`, `react-native-webview@14.0.1`, `@expo/vector-icons@^15.1.1`

**Storage**: N/A (alteração puramente de layout e componentes de UI)

**Testing**: Jest + `ts-jest` (`npm test`) e compilador TypeScript (`npm run typecheck`)

**Target Platform**: Android, iOS (Expo Go SDK 58) e Web (`react-native-web`)

**Project Type**: Aplicativo móvel e web companion para *Wingspan*

**Performance Goals**: `60fps` na renderização e movimentação do visor; resposta tátil imediata ao toque no obturador (`<50ms`)

**Constraints**: Preservar compatibilidade total com `LiveCameraScanner.native.tsx` (Expo Go) e `LiveCameraScanner.web.tsx` (Web), mantendo intacto o fluxo de análise OCR e reprodução de áudio.

**Scale/Scope**: 3 arquivos de interface (`src/screens/ScannerScreen.tsx`, `src/components/LiveCameraScanner.native.tsx`, `src/components/LiveCameraScanner.web.tsx`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Table-Side Speed & Deliberate OCR Precision**: O obturador circular na base da tela melhora significativamente a ergonomia com uma mão na mesa de jogo, e o gabarito translúcido na mira garante alinhamento mais rápido sem poluição visual. (**PASS**)
- **II. Taxonomic Grounding & 597-Bird Bilingual Catalog**: Inalterado; todas as 597 aves continuam sendo reconhecidas e reproduzidas. (**PASS**)
- **III. Authentic Ornithological Media & Single-Player Audio**: Inalterado; a captura de foto aciona o fluxo de som autêntico existente. (**PASS**)
- **IV. Lightweight Bundle & On-Demand Streaming**: Inalterado; nenhum ativo pesado ou dependência adicional adicionada. (**PASS**)
- **V. Security, Privacy & Zero Hardcoded Secrets**: Inalterado; conformidade com `mandatory-secure-web-skills`. (**PASS**)

## Project Structure

### Documentation (this feature)

```text
specs/004-camera-shutter-and-viewfinder-redesign/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/
│   └── viewfinder-and-shutter.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── screens/
│   └── ScannerScreen.tsx            # [MODIFY] Move rótulo para cima da mira, adiciona marca d'água translúcida e remove pílulas de status OCR
└── components/
    ├── LiveCameraScanner.native.tsx # [MODIFY] Move botão disparador para a base da tela, transforma em botão circular com ícone de câmera e remove textos de status
    └── LiveCameraScanner.web.tsx    # [MODIFY] Move botão disparador para a base e remove banners de status para paridade com o nativo
```

## Verification Plan & Security Review

### Automated Verification
- `npm run typecheck`: Validação de tipos do TypeScript sem erros.
- `npm test`: Execução de todas as suítes de testes unitários existentes.

### Security Verification (`mandatory-secure-web-skills`)
- Alteração restrita a componentes visuais de apresentação e estilos (`StyleSheet`). Nenhuma nova chamada de rede, injeção de script ou dependência externa.

## Complexity Tracking

Nenhuma violação à constituição do projeto.

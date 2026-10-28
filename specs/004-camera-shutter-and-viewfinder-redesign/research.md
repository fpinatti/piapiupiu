# Phase 0 Research: Redesenho do Disparador e Mira do Scanner de Cartas

**Feature Branch**: `004-camera-shutter-and-viewfinder-redesign`
**Date**: 2026-10-28
**Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/spec.md)

## 1. Posicionamento e Ergonomia do Botão Disparador

### Decision
- **Posição Inferior (*Bottom Thumb-Zone*)**: Mover o obturador de fotos de `top: 68` para a parte inferior central da tela (`bottom: 28` no `LiveCameraScanner.native.tsx` e `LiveCameraScanner.web.tsx`).
- **Formato Circular Minimalista**: Adotar botão circular de tamanho ergonômico padrão de câmera móvel (`width: 72, height: 72, borderRadius: 36`) com anel externo contrastante (`borderWidth: 4, borderColor: colors.primaryBorder`), fundo escuro translúcido ou `colors.primary`, e **exclusivamente um ícone de câmera** (`<Feather name="camera" size={28} color="#FFFFFF" />`).
- **Feedback de Carregamento**: Quando a captura estiver em processamento (`isAnalyzing`), o ícone de câmera é substituído por um `<ActivityIndicator size="small" color="#FFFFFF" />` centralizado.
- **Barra de Zoom**: Os seletores de zoom (`1x`, `1.5x Ideal`, `2x`, `Macro`) permanecem no topo (`top: 18`), permitindo alternar lentes sem interferir na área de disparo.

### Rationale
- Em testes práticos segurando a carta de *Wingspan* com uma mão e o celular com a outra, alcançar o topo da tela para apertar o botão causava tremor na mão e perda de foco. O botão circular na base permite fotografar com o polegar com máxima firmeza e estabilidade.

---

## 2. Mira e Marca d'Água de Alinhamento

### Decision
- **Deslocamento do Rótulo para Fora da Mira**: Mover o rótulo `"Posicione o topo da carta aqui"` para cima da linha pontilhada (`marginBottom: 12` em relação ao topo da caixa).
- **Remoção de Textos Internos**: Eliminar completamente o texto `"Alinhe o nome da ave em CAIXA ALTA dentro da mira"`.
- **Marca d'Água Translúcida de Guia**: Inserir dentro da mira pontilhada um gabarito estilizado em formato de faixa de título de carta de *Wingspan* com baixa opacidade (`rgba(255, 255, 255, 0.12)` ou `rgba(82, 183, 136, 0.18)`), contendo uma sutil silhueta de pena e moldura de título, dando ao jogador a referência visual exata de como alinhar o topo da carta sem obstruir a visão.

---

## 3. Limpeza de Status Residual de OCR

### Decision
- Remover a pílula flutuante `liveOcrPill` (`Lido: ...`) de `ScannerScreen.tsx`.
- Remover a pílula `feedbackPill` e texto residual de OCR de `LiveCameraScanner.native.tsx` e `LiveCameraScanner.web.tsx`.
- Quando uma ave for reconhecida, a confirmação visual e sonora vem diretamente da aparição do card de reprodução (`BirdPlayingCard`) e do início imediato do canto autêntico da ave. Se nenhuma ave for reconhecida, o visor simplesmente descongela suavemente para a próxima tentativa.


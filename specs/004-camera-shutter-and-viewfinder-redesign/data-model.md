# Phase 1 Data Model & UI State: Redesenho do Disparador e Mira

**Feature Branch**: `004-camera-shutter-and-viewfinder-redesign`
**Date**: 2026-10-28
**Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/004-camera-shutter-and-viewfinder-redesign/spec.md)

## 1. UI Components & Props

### 1.1 `LiveCameraScanner` (`src/components/LiveCameraScanner.native.tsx` & `.web.tsx`)
- **Estado removido**: `statusFeedback: string` (eliminado para não renderizar pílulas de texto técnico).
- **Layout de Disparo**:
  - `zoomFloatingBar`: fixado no topo (`top: 16`, `left: 0`, `right: 0`, `alignItems: 'center'`).
  - `bottomShutterContainer`: fixado na base (`position: 'absolute'`, `bottom: 24`, `alignSelf: 'center'`).
  - `shutterCircleButton`: botão circular (`72x72`, `borderRadius: 36`) com ícone `<Feather name="camera" size={28} />` ou `<ActivityIndicator />`.

### 1.2 `ScannerScreen` Overlay (`src/screens/ScannerScreen.tsx`)
- **Estado removido**: `lastRawOcrLine: string` não é mais exibido na UI (removida a pílula `liveOcrPill`).
- **Estrutura da Mira Central (`centerOverlay`)**:
  - `targetLabel`: posicionado **fora e acima** da borda da mira com `marginBottom: 10`.
  - `cardTargetBox`: área retangular pontilhada (`width: '88%'`, `maxWidth: 460`, `height: 155`).
  - `targetWatermarkGuide`: gabarito translúcido posicionado dentro da mira com borda arredondada sutil (`opacity: 0.18`), simulando o cabeçalho de uma carta de *Wingspan* com ícone de pena translúcido.


# PiaPiuPiu — Wingsong Companion App (React Native)

Aplicativo companheiro **100% offline** para o jogo de tabuleiro **Wingspan**, recriando a experiência do *Wingsong* em React Native + TypeScript.

Em vez de usar classificação visual da ilustração (suscetível a falsos-positivos por iluminação e sleeves), o **PiaPiuPiu** utiliza:
1. **OCR On-Device em Tempo Real** (`react-native-vision-camera` v4 + `react-native-vision-camera-text-recognition` / Google ML Kit) focado em uma **Zona de Enquadramento (Bounding Box Virtual)** no terço superior da carta.
2. **Normalização e Fuzzy Matching (`Fuse.js`)** tolerante a reflexos de sleeves e ruídos de OCR (ex: `"GA1O-AZUL"` → `"Gaio-azul"`), buscando simultaneamente em **Português (PT-BR)**, **Inglês (EN)** e **Nome Científico** nas **597 aves oficiais** do jogo **Base** (180) e das expansões **Europa** (81), **Oceania** (95), **Ásia** (90) e **Américas** (151, incluindo os 40 beija-flores).
3. **Debounce Anti-Spam (6 segundos)**: evita disparar o áudio repetidamente enquanto o jogador segura a mesma carta.
4. **Banco de Áudios 100% Offline** (`expo-av`): gravações ornitológicas comprimidas via `ffmpeg` (Mono, 24–32kbps, máx. 4,5s com fade-out — `<20 MB` para todas as 597 aves).

---

## Como Executar

### 1. Instalar dependências
```bash
npm install --legacy-peer-deps
```

### 2. Gerar semente completa (597 aves) e sincronizar áudios offline (Pipeline Node.js + `ffmpeg`)
Requer `ffmpeg` instalado no sistema:
```bash
# 1. Atualizar src/data/birds-seed.json (597 cartas das 5 expansões + nomes PT-BR via Wikidata/iNaturalist)
npm run build:seed

# 2. Processar todas as 597 aves de src/data/birds-seed.json e gerar assets/audio/, src/data/birds.json e src/data/audioMap.ts
npm run sync:birds

# Opções avançadas (filtrar por expansão, concorrência, síntese offline rápida):
node scripts/sync-birds.mjs --expansion americas --limit 10 --concurrency 8
node scripts/sync-birds.mjs --fast-synth --concurrency 12
```
O script busca gravações pelo nome científico (Xeno-Canto / iNaturalist), converte com `ffmpeg` para `assets/audio/` e gera automaticamente `src/data/birds.json` e `src/data/audioMap.ts`.

### 3. Rodar no Android / iOS (Development Build com VisionCamera + ML Kit)
Como o Frame Processor de OCR utiliza código nativo (`react-native-vision-camera` + `react-native-worklets-core`), execute via Development Build do Expo:
```bash
npx expo run:android
# ou
npx expo run:ios
```

### 4. Testes Automatizados e Checagem de Tipos
```bash
npm test
npm run typecheck
```

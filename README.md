# Piupiu U — Guia Sonoro e Visual para Wingspan (React Native / Expo SDK 58)

Aplicativo companheiro para o jogo de tabuleiro **Wingspan**, recriando e expandindo a experiência do *Wingsong* em React Native + TypeScript (**Expo SDK 58**).

O **Piupiu U** combina:
1. **Scanner OCR por Captura de Foto Nítida** (`expo-camera` + `Tesseract.js` Worker) com controles de zoom óptico (`1x`, `1.5x Ideal`, `2x`, `Macro`) para leitura precisa do nome no topo da carta sem borrão de movimento ou foco.
2. **Catálogo Completo com 597 Aves Oficiais (`Fuse.js`)**: busca instantânea (`<100ms`) tolerante a acentos e reflexos de sleeves simultaneamente em **Português (PT-BR)**, **Inglês (EN)** e **Nome Científico (Latim)** cobrindo todas as **5 expansões**:
   - **Jogo Base (`base`)**: 180 aves
   - **Expansão Europa (`europe`)**: 81 aves
   - **Expansão Oceania (`oceania`)**: 95 aves
   - **Expansão Ásia (`asia`)**: 90 aves
   - **Expansão Américas (`americas`)**: 151 aves (incluindo os 40 beija-flores)
3. **Cantos Ornitológicos Reais com Exclusividade de Áudio (`expo-audio`)**: streaming sob demanda de gravações reais de campo via **iNaturalist Research-Grade Sounds API** e **Xeno-Canto API v3**, garantindo que dois sons nunca toquem ao mesmo tempo.
4. **Fotografias Reais das Espécies (`BirdPhoto`)**: exibição da foto real da ave no card do Scanner, na lista do Catálogo e no Mini-Player (com ampliação em tela cheia ao tocar na foto), obtida sob demanda via **iNaturalist Taxa API v1** e **Wikipedia / Wikimedia Commons REST API v1** sem pesar no tamanho do aplicativo (`~2.2 MB`).

---

## Como Executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente (`.env`)
Copie o arquivo `.env.example` para `.env` e preencha os identificadores da sua conta Expo/EAS (e opcionalmente sua chave da API v3 do Xeno-Canto):
```bash
cp .env.example .env
```

### 3. Executar no Expo Go (SDK 58) ou Web
```bash
npm start
# ou publicar atualização OTA no canal preview:
npm run update:preview -- "Descrição da atualização"
```

### 4. Testes Automatizados e Checagem de Tipos
```bash
npm run typecheck
npm test
```

# Quickstart: Exibição de Fotografia Real da Ave Junto ao Canto (`002-bird-photo-display`)

## Pré-requisitos
- Node.js 20+ e dependências instaladas (`npm install`)
- Dispositivo com aplicativo **Expo Go** (SDK 58) ou navegador Web

## 1. Validar Tipagem e Testes Automatizados

Execute a verificação estática do TypeScript e a suíte de testes unitários (incluindo os testes do `birdImageService` e `birdMatcher`):

```bash
npm run typecheck
npm test
```

## 2. Testar no Expo Go / Simulador

Inicie o servidor de desenvolvimento:

```bash
npm start
```

### Cenário 1 — Card de Reprodução no Scanner (`BirdPlayingCard`)
1. Na aba **Scanner de Cartas**, fotografe uma carta física de *Wingspan* ou toque em um dos botões de simulação (ex.: **Gaio-azul**, **Cegonha-branca**, **Beija-flor-rubi**).
2. Verifique que o card de reprodução exibe a **fotografia real da ave** ao lado do nome em português, inglês e científico enquanto o canto da ave é reproduzido sem atraso.
3. Toque sobre a fotografia da ave no card para abrir o **modal de ampliação em tela cheia** com os detalhes da espécie e atribuição da foto.

### Cenário 2 — Miniaturas no Catálogo e Mini-Player (`CatalogScreen` & `App`)
1. Abra a aba **Catálogo (597)** e role a lista ou pesquise por `"Little Grebe"` / `"Mergulhão-pequeno"`.
2. Verifique que cada ave visível exibe sua miniatura fotográfica arredondada ao lado do nome.
3. Toque em uma ave para reproduzir o canto e confirme que o **Mini-Player** na barra inferior também exibe a miniatura fotográfica da ave em reprodução.

### Cenário 3 — Modo Offline / Fallback Resiliente
1. Ative o modo avião no celular e selecione uma ave ainda não carregada na sessão.
2. Verifique que o placeholder ornitológico (ícone com cores do habitat da ave) é exibido sem erros de tela ou quebra de layout.


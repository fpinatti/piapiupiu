# Feature Specification: Redesenho do Disparador e Mira do Scanner de Cartas

**Feature Branch**: `004-camera-shutter-and-viewfinder-redesign`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "no modo de fotografia, como agora a foto nao é lida em tempo real, mas so depois de apertar no botao para tirar foto, esse status na tela nao é mais necessario. Alem disso, mova o botao de 'fotografar e ler carta' para baixo da tela, e ao inves do texto, coloque simplesmente um icone de camera. Alem disso, dentro da caixa pontilhada para posicionar a foto, remova o texto 'Alinhe o nome, etc', se possivel coloque uma marcacao tipo marca dagua transparente pra guia de como alinhar. e a caixa 'posicione o topo da carta aqui' pode ser movida um pouco mais para cima, para fora da linha pontilhada."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disparador de Câmera na Parte Inferior da Tela (Priority: P1)

Quando o jogador está segurando o celular com uma mão e a carta de *Wingspan* com a outra, ele visualiza o botão de disparo posicionado confortavelmente na parte inferior da tela (área do polegar / *thumb zone*). O botão possui formato circular ergonômico contendo apenas um ícone nítido de câmera (sem texto), permitindo acionar a captura com facilidade e sem obstruir o enquadramento superior da carta.

**Why this priority**: É a ergonomia central do aplicativo: câmeras móveis posicionam o obturador na borda inferior para permitir estabilidade ao fotografar sem tremer a mão na mesa de jogo.

**Independent Test**: Pode ser testado abrindo o Scanner e verificando que o botão de captura está na parte inferior central, em formato circular com ícone de câmera e feedback tátil/visual imediato ao tocar para disparar a foto.

**Acceptance Scenarios**:

1. **Given** que o usuário está no Scanner de Cartas com a câmera ativa, **When** ele olha para a tela, **Then** o botão disparador de foto está localizado na parte inferior, em formato circular elegante, contendo unicamente um ícone de câmera (sem rótulos textuais longos como "Fotografar e Ler Carta").
2. **Given** que o usuário toca no botão disparador circular, **When** a foto é capturada e está em análise, **Then** o botão apresenta feedback visual sutil de carregamento (indicador de atividade centralizado) até a carta ser identificada.

---

### User Story 2 - Mira Pontilhada Despoluída com Rótulo Externo e Marca d'Água de Alinhamento (Priority: P1)

Ao posicionar a carta de ave sob a câmera, o jogador vê a caixa de mira pontilhada completamente despoluída de textos intrusivos. A instrução `"Posicione o topo da carta aqui"` fica posicionada sutilmente **acima** (fora da caixa pontilhada), enquanto o interior da mira apresenta uma guia translúcida estilo marca d'água (silhueta/contorno do cabeçalho da carta de ave com baixa opacidade) indicando o local ideal de enquadramento do título.

**Why this priority**: Textos pretos/opacos dentro da caixa pontilhada tapavam a visão da carta física. A marca d'água translúcida serve como gabarito visual intuitivo sem cobrir o texto da carta.

**Independent Test**: Pode ser testado alinhando uma carta de ave e observando que o interior da caixa pontilhada tem apenas cantoneiras e um gabarito translúcido transparente, com a etiqueta `"Posicione o topo da carta aqui"` deslocada para cima da borda pontilhada.

**Acceptance Scenarios**:

1. **Given** que a mira pontilhada está visível na tela, **When** o usuário a visualiza, **Then** o texto `"Alinhe o nome da ave em CAIXA ALTA dentro da mira"` não aparece mais no interior da caixa.
2. **Given** que o usuário está enquadrando uma carta, **When** ele posiciona o topo da carta na mira, **Then** o interior da caixa exibe um contorno ou gabarito translúcido em marca d'água com baixa opacidade para facilitar o alinhamento.
3. **Given** que a etiqueta `"Posicione o topo da carta aqui"` é exibida, **When** renderizada na tela, **Then** ela fica localizada acima e do lado de fora da linha pontilhada superior, liberando 100% da área interna da mira.

---

### User Story 3 - Remoção de Pílulas de Status Persistentes de OCR em Tempo Real (Priority: P2)

Como a leitura agora ocorre exclusivamente por foto deliberada e o card da ave reconhecida (`BirdPlayingCard`) já sobe na tela acompanhado do som quando há correspondência, os textos persistentes de status (como `"Lido: ..."` ou banners de feedback de OCR em tempo real) são removidos da tela da câmera.

**Why this priority**: Evita mensagens técnicas redundantes na interface que sobravam da antiga leitura frame a frame em tempo real.

**Independent Test**: Pode ser testado fotografando uma carta e verificando que nenhuma pílula `"Lido: ..."` ou banner de texto técnico em tempo real fica poluindo a tela da câmera antes ou depois da foto.

**Acceptance Scenarios**:

1. **Given** que uma foto foi tirada e uma ave foi reconhecida, **When** o card da ave aparece, **Then** a pílula de texto `"Lido: ..."` não é exibida na tela da câmera.
2. **Given** que a câmera está aberta aguardando ação, **When** nenhuma foto foi batida, **Then** nenhum banner permanente de status OCR fica sobreposto ao visor.

---

### Edge Cases

- **Aparelho em modo paisagem ou telas menores**: O disparador circular inferior e a mira centralizada devem manter espaçamento vertical seguro sem colidir com a barra de navegação inferior (`bottomNav`) ou a faixa de aves recentes.
- **Card reconhecido em exibição na base da tela**: Quando o card da ave reconhecida (`BirdPlayingCard`) estiver aberto na parte inferior, o botão circular de disparo deve ser reposicionado suavemente ou permanecer acessível logo acima do card para que o usuário possa facilmente fotografar a próxima carta da rodada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE mover o botão disparador de captura da carta da parte superior para a **parte inferior da tela**, centralizado na zona de alcance do polegar.
- **FR-002**: O botão disparador DEVE adotar formato circular ergonômico contendo **exclusivamente um ícone de câmera** (sem o texto `"Fotografar e Ler Carta"`), com indicador de carregamento integrado durante o processamento da foto.
- **FR-003**: O sistema DEVE remover o texto `"Alinhe o nome da ave em CAIXA ALTA dentro da mira"` de dentro da caixa de mira pontilhada.
- **FR-004**: O interior da caixa de mira pontilhada DEVE exibir uma marcação translúcida estilo marca d'água (opacidade reduzida) simulando o formato de cabeçalho de uma carta de *Wingspan* para orientar o enquadramento do jogador.
- **FR-005**: O rótulo `"Posicione o topo da carta aqui"` DEVE ser deslocado para **fora e acima** da borda pontilhada superior da mira.
- **FR-006**: O sistema DEVE remover as pílulas de status residual em tempo real (como `"Lido: ..."` e mensagens técnicas flutuantes de OCR) do visor da câmera.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O interior da caixa pontilhada de mira possui **100% de área livre e desobstruída** de blocos de texto opacos.
- **SC-002**: O botão disparador de foto é acionável com **uma única mão pelo polegar** na região inferior da tela em menos de 1 segundo de reação do jogador.
- **SC-003**: A interface da câmera atinge visual limpo estilo aplicativo moderno de fotografia (apenas visor, mira com gabarito transparente, controles de zoom no topo e obturador circular na base).
- **SC-004**: A taxa de reconhecimento correto da carta permanece inalterada ou melhora devido ao gabarito translúcido que orienta o enquadramento da carta física.

## Assumptions

- O seletor de zoom (`1x`, `1.5x (Ideal)`, `2x`, `Macro`) permanece na parte superior do visor (junto aos controles de iluminação) ou discretamente integrado, mantendo o obturador fotográfico como elemento primário e exclusivo na base da tela.
- Quando uma foto é capturada e o card da ave (`BirdPlayingCard`) surge na tela, o obturador circular se ajusta para permitir novo disparo rápido ou fecha o card ao tocar no X.


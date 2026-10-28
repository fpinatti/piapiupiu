# Design System: Piupiu U (Wingspan Watercolor & Naturalist Field Guide)

<!-- impeccable:design-schema 1 -->

## Visual World: The Naturalist Field Journal & Linen Watercolor Cards

Piupiu U derives its identity directly from Elizabeth Hargrave's *Wingspan* and the delicate watercolor illustrations of Natalia Rojas and Ana Maria Martinez. It replaces dark, cold, generic dashboard styling with the tactile warmth of physical board games: natural linen paper, botanical water washes, brass field-compass accents, and classical ornithological field-guide typography.

---

## 1. Palette & Material Strategy

### Canvas & Surfaces (Warm Linen & Pressed Cotton Paper)
- `canvas`: `#F5F0E6` — Fundo pergaminho quente e linho natural (idêntico ao tabuleiro físico de *Wingspan*).
- `surface`: `#FCFAF7` — Papel linho prensado alvo com textura acolhedora para cards de aves.
- `surfaceElevated`: `#FFFFFF` — Destaque para cards ativos e modais.
- `surfaceSubtle`: `#ECE5D8` — Superfície sutil de apoio em tom linho sombreado.
- `surfaceOverlay`: `rgba(245, 240, 230, 0.94)` — Vidro fosco translúcido pergaminho para sobreposições de câmera.

### Linhas & Molduras (Cartonagem e Detalhes de Latão)
- `border`: `#DCD3C1` — Borda fina de papel e cartonagem artesanal de jogos de tabuleiro.
- `borderSubtle`: `#EBE3D5` — Divisores discretos entre seções.
- `borderFocus`: `#335C45` — Verde floresta botânico para foco e destaque.
- `brass`: `#C8AA6E` — Dourado suave de latão para ícones de som, bússola e cantoneiras de mira.

### Tinta e Tipografia (Tinta Sumi/Carvão Natural)
- `textPrimary`: `#202B24` — Carvão botânico profundo (~14:1 de contraste no linho `#F5F0E6`).
- `textSecondary`: `#546358` — Verde-oliva suave e legível (~6.2:1).
- `textMuted`: `#7B8C80` — Tom de lápis grafite para legendas secundárias (~4.8:1).
- `textTaxonomic`: `#2E5E43` — Verde floresta ornitológico para nomes científicos em latim.

---

## 2. Cores Aquareladas dos 3 Habitats de Wingspan

- **Floresta (`forest`)**:
  - Lavagem aquarela suave: `#E8F2EC`
  - Borda botânica: `#A3CEB2`
  - Tinta de texto: `#1E432B`
  - Faixa aquarelada viva: `#4A7C59`
- **Campo (`grassland`)**:
  - Lavagem aquarela suave: `#FAF0DA`
  - Borda dourada trigo: `#E5C578`
  - Tinta de texto: `#593E0B`
  - Faixa aquarelada viva: `#C99738`
- **Água / Pântano (`wetland`)**:
  - Lavagem aquarela suave: `#E3EFF4`
  - Borda azul cerúleo: `#9AC4D5`
  - Tinta de texto: `#164252`
  - Faixa aquarelada viva: `#427E93`

---

## 3. Cores de Aquarela das 5 Expansões Oficiais

- **Base**: Azul ardósia suave da caixa clássica (`bg: '#EAF0F4'`, `border: '#A9C4D2'`, `text: '#224152'`).
- **Europa**: Azul cobalto real europeu (`bg: '#ECECF9'`, `border: '#A8ACDE'`, `text: '#212668'`).
- **Oceania**: Terracota pôr-do-sol aquarelado (`bg: '#FAEDE4'`, `border: '#E8B395'`, `text: '#7A3212'`).
- **Ásia**: Vermelho laca imperial suave (`bg: '#FAE8E9'`, `border: '#DE9C9E'`, `text: '#731E21'`).
- **Américas**: Verde esmeralda florestal (`bg: '#E6F4EE'`, `border: '#98D1B7'`, `text: '#174E36'`).

---

## 4. Tipografia Ornitológica de Guia de Campo

- **Títulos de Aves e Cabeçalhos**: Família serifada clássica de enciclopédia ornitológica (`Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })`).
- **Subtítulos e Latim Científico**: Serif em itálico fino com tracking elegante (`fontStyle: 'italic'`).
- **Interface e Metadados Numéricos**: Sans-serif limpa e arejada para contadores, botões e tags.

---

## 5. Anatomia da Carta Física de Wingspan (`BirdPlayingCard`)

- **Faixa Superior de Habitat**: Cabeçalho aquarelado com a cor do habitat principal da ave (`HABITAT_THEME[primaryHabitat].bg` com filete inferior `border`).
- **Brasão de Linho**: Emblema de penas e distintivos de expansão em pílulas com borda fina e tipografia artesanal.
- **Moldura da Foto Real**: Retrato arredondado com efeito de estampa litográfica botânica e indicador de zoom.
- **Botão de Som**: Botão com formato de selo botânico em verde floresta e dourado de latão.

---

## 6. Selos e Ícones Aquarelados de Delight (`WatercolorIcon`)

Como não existem bibliotecas prontas de ícones com renderização de aquarela (que exigem gradientes orgânicos, acúmulo de pigmento nas bordas e dispersão em papel), o Piapiu U implementa uma técnica artesanal de **Selos de Aquarela (Watercolor Stamps)**:

1. **Gotículas Orgânicas Assimétricas**: Em vez de círculos perfeitamente redondos, cada selo utiliza raios de borda assimétricos (ex: `borderTopLeftRadius: 62%`, `borderTopRightRadius: 38%`, etc.) simulando gotas reais de tinta sobre papel prensado a frio.
2. **Pigment Pooling (Acúmulo de Pigmento nas Bordas)**: Uma borda delicada de 1.2px ligeiramente mais escura que a lavagem interna imita a física da secagem da aquarela, onde as partículas de pigmento se concentram no menisco da água.
3. **Difusão e Halo de Água**: Uma camada externa semi-transparente que simula a umidade do papel ao redor da pincelada.
4. **Emblemas Botânicos dos Habitats**:
   - **Floresta (`forest`)**: Pinheiro/conífera botânica em tinta verde floresta sobre lavagem verde folha suave.
   - **Campo (`grassland`)**: Tufo de trigo/cevada em tom âmbar sobre lavagem ocre dourada.
   - **Pântano (`wetland`)**: Ondulações e gotas de água doce sobre lavagem azul cerúleo.
5. **Pulso de Dispersão "Wet-on-Wet"**: Quando o canto da ave está tocando, o selo pulsa suavemente (escala sinusoidal 1.0 -> 1.10), dando a impressão viva de tinta fresca se espalhando no linho.

---

## 7. Paisagem de Fundo Aquarelada de Wingspan (`WatercolorBackground`)

Para trazer a atmosfera visual do tabuleiro físico de *Wingspan* para a tela inicial do aplicativo sem poluir nem prejudicar a legibilidade (respeitando WCAG AA com folga):

1. **Três Zonas de Habitat Naturais**:
   - **Topo-Esquerda (Floresta)**: Manchas aquareladas em verde sálvia/musgo (`rgba(62, 107, 79, 0.08)`) com silhueta botânica sutil de pinheiro em marca d'água (`opacity: 0.045`).
   - **Centro-Direita (Campo)**: Manchas aquareladas em ocre trigo/âmbar (`rgba(201, 151, 56, 0.075)`) com marca d'água de ramo de cevada/trigo (`opacity: 0.045`).
   - **Fundo-Esquerda (Pântano/Água)**: Manchas aquareladas em cerúleo de água doce (`rgba(44, 123, 158, 0.08)`) com marca d'água de ondulações lacustres (`opacity: 0.045`).
2. **Marca d'Água Central de Pena**:
   - Uma pena de guia botânico desenhada com traço nanquim ultraleve (`opacity: 0.035`) no papel de linho.
3. **Placa de Cartonagem de Boas-Vindas**:
   - No estado inicial da câmera, o card de orientação surge em placa de linho prensado (`rgba(252, 250, 247, 0.92)`) com cantos de 22px, borda artesanal e selo aquarelado de câmera.
4. **Isolamento de Toque**:
   - `pointerEvents="none"` absoluto, garantindo zero interferência nas interações de toque e gestos.


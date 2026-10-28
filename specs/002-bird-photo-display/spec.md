# Feature Specification: Exibição de Fotografia Real da Ave Junto ao Canto

**Feature Branch**: `002-bird-photo-display`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "queria mostrar a imagem do passaro tambem, é possivel obter do xeno-canto ou de algum outro repositorio open source que tenha as fotos dos passaros e colocar na tela do app junto com o canto?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar a Foto Real da Ave no Card de Reprodução do Scanner (Priority: P1)

Quando o jogador fotografa uma carta de *Wingspan* no Scanner (ou simula uma carta no painel de testes) e o aplicativo começa a reproduzir o canto da ave, o card da ave em destaque na tela deve exibir uma fotografia real e nítida daquela espécie na natureza, lado a lado com o nome em português, inglês, nome científico, expansão e controles de áudio.

**Why this priority**: É o momento principal de encantamento na mesa de jogo — ouvir o canto autêntico enquanto todos os jogadores veem a fotografia real da ave (além da ilustração desenhada na carta física).

**Independent Test**: Pode ser testado de forma independente escaneando ou selecionando qualquer ave no Scanner e verificando que o card de reprodução (`BirdPlayingCard`) exibe a foto real da espécie (ou um placeholder ornitológico elegante enquanto carrega ou caso esteja sem conexão).

**Acceptance Scenarios**:

1. **Given** que o usuário acabou de identificar uma carta no Scanner (ex.: *Gaio-azul* ou *Mergulhão-pequeno*), **When** o card de reprodução da ave aparece na parte inferior da tela junto com o canto, **Then** uma fotografia real da espécie é carregada e exibida automaticamente dentro do card.
2. **Given** que a fotografia da espécie já foi consultada uma vez na sessão, **When** a mesma ave é selecionada novamente, **Then** a fotografia aparece instantaneamente sem nova espera de carregamento.
3. **Given** que o dispositivo está sem conexão à internet ou o repositório público não possui foto disponível no momento, **When** o card da ave é exibido, **Then** o aplicativo exibe uma moldura ilustrada padrão (ícone ornitológico com as cores do habitat da ave) sem quebrar o layout nem interromper a reprodução do canto.

---

### User Story 2 - Visualizar Miniaturas de Fotos das Aves no Catálogo e no Mini-Player (Priority: P2)

Ao navegar ou pesquisar entre as 597 aves na aba **Catálogo** (ou ao ouvir uma ave pelo **Mini-Player** inferior), o usuário visualiza a miniatura fotográfica de cada espécie nos itens da lista e no player compacto, facilitando o reconhecimento visual rápido das aves de todas as 5 expansões.

**Why this priority**: Transforma o Catálogo de uma lista puramente textual em um verdadeiro guia de campo visual e sonoro, além de manter consistência visual quando o Mini-Player está ativo.

**Independent Test**: Pode ser testado abrindo a aba Catálogo, rolando a lista ou buscando por uma espécie (ex.: *Andean Condor* ou *Little Grebe*) e verificando que as miniaturas das aves visíveis carregam progressivamente sem travar a rolagem.

**Acceptance Scenarios**:

1. **Given** que o usuário está na aba Catálogo visualizando a lista de aves, **When** os cards das aves entram na área visível da tela, **Then** cada item exibe a miniatura fotográfica circular/arredondada da respectiva espécie ao lado de seus nomes e tags de habitat.
2. **Given** que o usuário toca para reproduzir uma ave no Catálogo, **When** o Mini-Player inferior aparece, **Then** o Mini-Player também exibe a miniatura da foto da ave que está cantando.

---

### User Story 3 - Enriquecimento Opcional do Catálogo com URLs de Fotos Abertas (Priority: P3)

O mantenedor pode opcionalmente pré-popular ou atualizar as URLs de fotografias abertas das 597 espécies no catálogo de dados do projeto a partir de repositórios científicos e enciclopédicos abertos, reduzindo consultas em tempo de execução e garantindo carregamento quase instantâneo no aplicativo.

**Why this priority**: Melhora a velocidade percebida pelo usuário final sem aumentar o tamanho do pacote instalável do aplicativo (pois armazena apenas a referência da imagem, não os arquivos binários no bundle).

**Independent Test**: Pode ser testado verificando que a resolução de imagem funciona tanto via busca dinâmica pelo nome científico quanto via URL pré-associada no registro da ave.

**Acceptance Scenarios**:

1. **Given** qualquer uma das 597 espécies do catálogo identificadas pelo seu nome científico binomial, **When** o aplicativo solicita a imagem da espécie, **Then** uma fotografia sob licença aberta correspondente ao táxon científico exato é retornada sem exigir chaves de API privadas.

---

### Edge Cases

- **Conexão lenta ou instável durante a partida**: A reprodução do áudio da ave NUNCA deve esperar o carregamento da foto terminar; som e imagem devem ser carregados de forma independente e paralela.
- **Espécies com sinônimos taxonômicos divergentes**: Caso o nome científico impresso na carta de *Wingspan* não retorne imagem na primeira fonte aberta, o sistema deve consultar automaticamente uma segunda fonte aberta de biodiversidade ou buscar pelo nome em inglês da espécie antes de exibir o placeholder.
- **Proporções variadas de fotografias (retrato vs. paisagem)**: Fotografias verticais (ex.: garças, corujas) e horizontais (ex.: patos, aves em voo) devem ser enquadradas de forma consistente sem distorção ou achatamento, mantendo um espaço reservado fixo para evitar saltos de layout (*layout shift*).
- **Uso de memória ao rolar 597 aves no Catálogo**: Apenas as aves atualmente visíveis na tela (ou já consultadas) devem buscar imagens sob demanda, mantendo o consumo de memória e rede baixo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE obter fotografias reais das aves a partir de repositórios científicos/enciclopédicos abertos e gratuitos utilizando o nome científico binomial (`scientific`) como chave primária (e o nome em inglês `name_en` como fallback), sem exigir cadastro ou chave de API obrigatória do usuário.
- **FR-002**: O card de reprodução em destaque no Scanner (`BirdPlayingCard`) DEVE exibir a fotografia da ave identificada com dimensões visíveis e bem definidas, acompanhada de estado de carregamento suave e fallback visual caso a imagem não esteja disponível.
- **FR-003**: Os itens da lista na aba Catálogo (`CatalogScreen`) e o Mini-Player inferior (`App`) DEVEM exibir uma miniatura da fotografia da ave para os itens visíveis na tela.
- **FR-004**: O carregamento das fotografias DEVE ocorrer sob demanda (via URL remota com cache em memória/sessão) sem embutir 597 arquivos de imagem dentro do pacote do aplicativo, mantendo o bundle leve e rápido para atualizar.
- **FR-005**: O carregamento ou eventual falha da fotografia NÃO DEVE atrasar, bloquear ou interromper a reprodução do canto da ave.
- **FR-006**: O usuário DEVE poder ampliar a fotografia da ave no card de reprodução do Scanner (toque na foto para vê-la maior em tela cheia/modal) para apreciar os detalhes da espécie com os demais jogadores da mesa.

### Key Entities *(include if feature involves data)*

- **BirdCard**: Entidade existente da carta de ave (`id`, `name_pt`, `name_en`, `scientific`, `expansion`, `habitats`, `audio`), podendo conter um atributo opcional `imageUrl` (URL pública da fotografia da espécie).
- **BirdMediaCache**: Registro em memória da sessão que associa o `id` / `scientific` da ave à URL da fotografia resolvida nos repositórios abertos, evitando requisições repetidas para a mesma ave.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pelo menos **98% das 597 espécies** do catálogo retornam uma fotografia real correspondente à espécie a partir das fontes abertas integradas.
- **SC-002**: A exibição da fotografia no card de reprodução do Scanner ocorre em **menos de 1,5 segundo** em conexão padrão, e em **menos de 100 milissegundos** em exibições subsequentes da mesma ave na sessão.
- **SC-003**: O tamanho do bundle do aplicativo aumenta em **menos de 50 KB** (zero imagens estáticas das 597 aves embutidas no pacote).
- **SC-004**: A rolagem pelo catálogo de 597 aves permanece fluida sem travamentos enquanto as miniaturas das aves visíveis são carregadas sob demanda.

## Assumptions

- **Fontes Abertas de Fotografias Ornitológicas**: Embora o Xeno-Canto seja focado primariamente em gravações sonoras (muitas gravações exibem apenas o espectrograma de áudio ou foto do gravador), repositórios abertos como **iNaturalist Taxa API** (`default_photo.medium_url` — fotos de espécies verificadas pela comunidade científica) e **Wikipedia / Wikimedia Commons REST API** (`page/summary/<Scientific_name>` — `thumbnail.source`) oferecem fotografias reais de alta qualidade para praticamente 100% das espécies de aves do mundo, gratuitamente e sem necessidade de chave de API.
- **Escopo de Armazenamento**: As imagens serão carregadas sob demanda via HTTPS e mantidas em cache durante o uso do app, seguindo a mesma decisão arquitetural adotada para os áudios a fim de manter o aplicativo leve no Expo Go.


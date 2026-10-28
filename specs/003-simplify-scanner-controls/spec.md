# Feature Specification: Simplificação da Interface com Remoção de "Testar Cartas" e "Filtros"

**Feature Branch**: `003-simplify-scanner-controls`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "remova o botao \"testar cartas\", bem como a opcao \"filtros\""

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tela do Scanner Limpa sem Botões "Testar Cartas" e "Filtros" (Priority: P1)

Quando o jogador abre o **Piupiu U** na aba **Scanner de Cartas** durante uma partida de *Wingspan*, a visão da câmera permanece limpa e focada apenas na captura da carta, sem o botão ou gaveta de **"Testar Cartas"** e sem o botão ou gaveta de **"Filtros"**. Todas as 597 aves de todas as 5 expansões e idiomas (Português, Inglês e Latim) ficam ativas automaticamente por padrão.

**Why this priority**: Reduz a poluição visual na tela da câmera (onde o espaço vertical é essencial para enquadrar a carta, usar os botões de zoom e ver o card da ave reconhecida) e elimina controles de depuração/filtragem desnecessários durante a partida.

**Independent Test**: Pode ser testado abrindo a aba **Scanner de Cartas** e verificando que os botões `"Testar Cartas"` e `"Filtros"` (e seus respectivos painéis expansíveis) não são mais exibidos, enquanto a leitura de cartas de qualquer expansão ou idioma continua funcionando normalmente.

**Acceptance Scenarios**:

1. **Given** que o usuário abre o aplicativo na aba Scanner de Cartas, **When** a tela do Scanner é carregada, **Then** o botão `"Testar Cartas"`, o painel de simulação manual e o botão `"Filtros"` não são exibidos na tela.
2. **Given** que o usuário fotografa uma carta de qualquer uma das 5 expansões (Base, Europa, Oceania, Ásia ou Américas) em Português ou Inglês, **When** o OCR analisa o título da carta, **Then** a busca considera automaticamente todas as 597 aves e todos os idiomas sem exigir configuração prévia de filtros.

---

### User Story 2 - Catálogo Direto sem Barra de Filtros (Priority: P2)

Ao acessar a aba **Catálogo (597)**, o jogador vê diretamente o campo de busca rápida e a lista completa das 597 aves, sem a barra superior de filtros (`FilterBar`), aproveitando melhor a área útil da tela para visualizar os cards e fotografias das aves.

**Why this priority**: Mantém consistência visual com a remoção da opção de filtros no Scanner e libera espaço vertical imediato na tela do Catálogo, já que a busca textual encontra instantaneamente qualquer ave em Português, Inglês ou Nome Científico em menos de 100 ms.

**Independent Test**: Pode ser testado abrindo a aba **Catálogo (597)** e verificando que a barra de filtros de expansão/idioma não é exibida acima da barra de pesquisa e que todas as 597 aves estão disponíveis para busca imediata.

**Acceptance Scenarios**:

1. **Given** que o usuário navega para a aba Catálogo, **When** a tela é exibida, **Then** a barra de filtros não aparece e o usuário visualiza diretamente a barra de pesquisa e a lista completa com as 597 aves.

---

### Edge Cases

- ** Dispositivos sem câmera ou com permissão de câmera negada**: Quando a câmera não estiver ativa ou autorizada no dispositivo, a tela do Scanner deve exibir apenas o aviso claro de permissão/câmera do próprio componente de câmera, sem abrir automaticamente o antigo painel `"Testar cartas sem câmera"`.
- **Cartas com nomes curtos ou multilíngues**: Com todas as 5 expansões e todos os idiomas (`all`) permanentemente ativos por padrão, o motor de busca continua priorizando a melhor pontuação no `BirdMatcher` sem necessidade de intervenção manual do usuário.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE remover o botão `"Testar Cartas"` e o painel de simulação de cartas (`Testar cartas sem câmera` com chips de exemplo e campo de digitação manual) da tela do Scanner (`ScannerScreen`).
- **FR-002**: O sistema DEVE remover o botão `"Filtros"` e a gaveta expansível de filtros da tela do Scanner (`ScannerScreen`).
- **FR-003**: O sistema DEVE remover a barra de filtros (`FilterBar`) da tela do Catálogo (`CatalogScreen`), mantendo todas as 5 expansões (`base`, `europe`, `oceania`, `asia`, `americas`) e todos os idiomas (`all`: PT-BR, EN e Científico) permanentemente ativos por padrão.
- **FR-004**: Os controles úteis de operação da câmera no Scanner (como o botão de lanterna `"Luz"`, quando disponível no hardware, os seletores de zoom óptico `1x / 1.5x / 2x / Macro` e o botão principal `"Fotografar e Ler Carta"`) DEVEM permanecer funcionais e visíveis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **0 controles de depuração ou filtragem** (`"Testar Cartas"`, painel de simulação manual ou `"Filtros"`) são exibidos nas telas do Scanner e do Catálogo.
- **SC-002**: **100% das 597 aves** de todas as 5 expansões permanecem pesquisáveis e reconhecíveis em Português, Inglês e Latim sem necessidade de ativar filtros.
- **SC-003**: A área útil visível do visor da câmera no Scanner e da lista de aves no Catálogo aumenta ao eliminar os cabeçalhos e painéis de filtro/simulação.

## Assumptions

- Como a busca difusa e o leitor OCR operam em menos de 100 ms sobre o catálogo completo de 597 aves, manter todas as expansões e idiomas sempre habilitados (`ALL_EXPANSIONS` e idioma `'all'`) oferece a experiência mais simples e direta na mesa de jogo, eliminando o risco de o jogador esquecer uma expansão desmarcada no filtro e achar que uma ave não foi reconhecida.


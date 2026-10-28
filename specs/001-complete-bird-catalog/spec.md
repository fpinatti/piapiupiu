# Feature Specification: Complete Wingspan Bird Catalog & All Expansions

**Feature Branch**: `001-complete-bird-catalog`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "quero ter o catalogo completo de passaros (hoje esta em 40). Inclua todas as expansoes alem do jogo base (oceania, europa, americas, asia)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan & Identify Any Bird Across Base Game and All 4 Expansions (Priority: P1)

As a *Wingspan* player at the gaming table, I want to point my device at any bird card from the Base Game (including Swift-Start) or any official expansion (**Europe**, **Oceania**, **Asia**, and **Americas**) and have the companion app recognize the bird by its Portuguese, English, or scientific card header and play its authentic bird call offline.

**Why this priority**: The core promise of the companion app is that every official bird card drawn during a match is recognized and has a playable vocalization—missing cards break immersion at the table.

**Independent Test**: Can be independently tested by scanning or simulating the card titles of representative birds from each of the 5 sets (Base, Europe, Oceania, Asia, and Americas) in both Portuguese and English and verifying that each resolves to the right species and plays its audio clip offline.

**Acceptance Scenarios**:

1. **Given** all expansions are enabled in the active filter, **When** a player scans or enters the card header of any bird from the Base Game, Europe, Oceania, Asia, or Americas sets (in Portuguese or English), **Then** the system identifies the exact species and starts playing its bird call within 1 second.
2. **Given** a card header has slight reading imperfections caused by plastic sleeve glare or accent variations, **When** the player frames the top of the card, **Then** the tolerant matching engine still resolves the right species from the complete catalog without false positives from card ability text.

---

### User Story 2 - Filter & Browse the Complete Catalog Including the Americas Expansion (Priority: P2)

As a player who owns a specific combination of *Wingspan* boxes (for example, only Base Game + Americas + Europe), I want to toggle each of the 5 sets (`Base`, `Europa`, `Oceania`, `Ásia`, `Américas`) in the filter bar and browse or search the complete bird catalog by Portuguese name, English name, or Latin scientific name.

**Why this priority**: With over 500 birds in the complete catalog, filtering by the physical expansions present on the table both speeds up manual lookup and narrows the active recognition space to reduce ambiguity between similarly named species.

**Independent Test**: Can be independently tested by toggling the `Américas` filter chip (and each other expansion chip) in the Catalog and Scanner views, verifying that the total bird count updates immediately and only birds from the selected sets appear in search and camera recognition.

**Acceptance Scenarios**:

1. **Given** the user opens the filter bar in either the Scanner or Catalog view, **When** they view the expansion options, **Then** all 5 sets (`Base`, `Europa`, `Oceania`, `Ásia`, `Américas`) are available with distinct visual badges and accurate card counts.
2. **Given** the user selects only the `Américas` expansion, **When** they browse the Catalog or scan a card, **Then** only birds belonging to the Americas expansion are matched and listed.
3. **Given** the user types a partial name in Portuguese, English, or Latin into the Catalog search box, **When** the complete catalog of 500+ birds is loaded, **Then** matching results appear smoothly without lag or interface freezing.

---

### User Story 3 - Automated Synchronization of Complete Bird Dataset & Offline Audio Pack (Priority: P3)

As a project maintainer, I want an automated synchronization workflow that ingests the complete canonical bird roster across all 5 sets (Base, Europe, Oceania, Asia, and Americas), retrieves authentic ornithological recordings by scientific name, and packages compressed offline audio clips for every bird in the catalog.

**Why this priority**: Manually curating and compressing 500+ bird audio files is error-prone and unsustainable; an automated, resumable synchronization process ensures 100% coverage across the entire catalog.

**Independent Test**: Can be independently tested by running the catalog synchronization process for a target expansion (or the full catalog) and verifying that every bird entry in the output dataset has complete names (Portuguese, English, scientific), expansion and habitat metadata, and a valid offline audio file within the target size budget.

**Acceptance Scenarios**:

1. **Given** the complete canonical seed list of *Wingspan* birds across Base, Europe, Oceania, Asia, and Americas, **When** the synchronization workflow runs, **Then** it produces a validated catalog dataset where 100% of entries contain a unique identifier, Portuguese name, English name, scientific binomial name, expansion tag, habitat list, and linked offline audio clip.
2. **Given** a bird species has no Grade-A recording in the primary ornithological repository, **When** the synchronization workflow processes that bird, **Then** it automatically falls back to secondary open ornithological repositories or offline synthesis so no bird in the catalog is left silent.

---

### Edge Cases

- **Similarly named birds across expansions**: When two birds across different expansions share very similar common names (e.g., multiple species of Hummingbirds, Jays, or Owls across Base and Americas), how does the system avoid misidentification?
  - *Resolution*: Exact normalized title matches take precedence over approximate matches, and users can disable expansions they are not playing with at the table.
- **Taxonomic synonyms or updated scientific names**: Some bird species have had taxonomic splits or genus reclassifications between the board game printing and modern ornithological databases.
  - *Resolution*: The catalog retains the scientific name printed on the card for display and search while supporting alternate taxonomic synonyms when querying recording repositories.
- **Official Brazilian Portuguese translation availability**: For newer cards (such as recent Americas expansion cards or promotional cards where a local edition name may vary), how are Portuguese names handled?
  - *Resolution*: Official localized card titles are used wherever published, and recognized ornithological Brazilian Portuguese vernacular names (CBRO / WikiAves standard) are used for any card not yet printed in a local box.
- **Large catalog scrolling and memory footprint**: Rendering 500+ bird rows and bundling 500+ audio clips must not degrade startup time, scrolling smoothness, or exceed mobile app bundle size limits (~15–20 MB total audio budget).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The catalog MUST include the complete roster of official *Wingspan* bird cards across all five sets:
  1. **Base Game (`base`)** (including Swift-Start tutorial birds — ~180 birds)
  2. **European Expansion (`europe`)** (~81 birds)
  3. **Oceania Expansion (`oceania`)** (~95 birds)
  4. **Asia Expansion (`asia`)** (~90 birds)
  5. **Americas Expansion (`americas`)** (including standard bird cards and hummingbird cards — ~151 birds)
- **FR-002**: Every bird entry in the catalog MUST contain:
  - A unique identifier
  - Brazilian Portuguese common name (`name_pt`)
  - English common name (`name_en`)
  - Binomial scientific name (`scientific`)
  - Expansion identifier (`base`, `europe`, `oceania`, `asia`, or `americas`)
  - Habitat tags (`forest`, `grassland`, `wetland`)
  - A bundled offline audio recording (`audio`)
- **FR-003**: The Expansion Filter in both the Scanner and Catalog views MUST include **`Américas`** (`americas`) as a first-class selectable expansion alongside `Base`, `Europa`, `Oceania`, and `Ásia`, with its own distinct semantic badge color.
- **FR-004**: Both real-time camera recognition and manual catalog search MUST match against the full 5-expansion dataset, respecting the user's currently active expansion and language filters.
- **FR-005**: The offline audio synchronization workflow MUST support incremental/resumable execution (skipping already-downloaded audio clips by default), expansion-scoped runs (`--expansion americas`), and automatic fallback so 100% of catalog birds have a playable offline audio clip.
- **FR-006**: Each bundled audio clip MUST be compressed to a short, consistent duration (4 to 6 seconds with a smooth fade-out) so that the complete 500+ bird offline audio pack remains compact (under 20 MB total).

### Key Entities

- **BirdCard**: Represents a single playable bird species from *Wingspan*, containing its unique ID, localized Portuguese name, English name, Latin scientific name, expansion set, allowed habitats, and reference to its offline vocalization clip.
- **ExpansionSet**: Represents one of the five official *Wingspan* card sets (`base`, `europe`, `oceania`, `asia`, `americas`), including its display label in Portuguese, visual badge theme, and member birds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The catalog expands from 40 birds to 100% of the official bird roster across Base, Europe, Oceania, Asia, and Americas (at least 530+ unique bird entries across the 5 sets).
- **SC-002**: 100% of bird entries in the catalog have a playable offline audio clip bundled with the application, keeping the total audio directory size under 20 MB.
- **SC-003**: Searching or filtering the complete 500+ bird catalog returns matching results in under 100 milliseconds with no perceptible UI frame drops.
- **SC-004**: Card title recognition resolves exact and glare-affected bird names across all 5 expansions in under 1 second when tested against sample titles from each set.

## Assumptions

- Both standard bird cards and hummingbird cards from the **Americas** expansion are included as searchable and scannable bird entries under the `americas` expansion filter.
- Where an official Brazilian Portuguese board-game printing is not yet published for specific Americas or promo cards, authoritative Brazilian ornithological common names (CBRO / WikiAves / Avibase PT) are used alongside the official English and Latin scientific names so players can search and scan in either language.
- All audio files remain bundled locally for 100% offline tabletop operation, using mono ~32kbps compression (~15–25 KB per bird) so the full 530+ bird pack adds only ~10–14 MB to the application bundle.


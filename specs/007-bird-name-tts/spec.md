# Feature Specification: Bird Card Name Speech Announcement (TTS)

**Feature Branch**: `007-bird-name-tts`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "quando abrir um card de ave, quero usar alguma ferramenta de text to speech pra falar o nome dela (nome popular + nome cientifico). E pra dar um ar de comedia, fale assim \"piu piu\" + os nomes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comedic Vocal Announcement on Opening Bird Card (Priority: P1)

As a Wingspan player opening a bird card in Piupiu U, I want the app to audibly speak the bird's names preceded by a playful "piu piu", so that I immediately know which bird was opened while adding a fun, lighthearted comedic mood to our gaming table.

**Why this priority**: This is the core experience requested by the user. Every time a bird card is opened (either identified by camera scanner or inspected from the catalog), the app should vocalize `"Piu piu, [Nome Popular], [Nome Científico]"` clearly and with comedic comedic comedic comedic flair.

**Independent Test**: Can be fully tested by opening any bird card (e.g., *Quetzal-resplandecente* or *Coruja-das-torres*) and verifying that speech synthesis audibly speaks "Piu piu", followed by the common name and the binomial scientific name.

**Acceptance Scenarios**:

1. **Given** a user opens a bird card (in Scanner card view or Catalog full-photo view), **When** the card finishes loading, **Then** the application triggers text-to-speech voicing `"Piu piu, [Nome Popular], [Nome Científico]"` in Brazilian Portuguese with natural prosody.
2. **Given** a bird with a Portuguese title and Latin scientific name, **When** the announcement is synthesized, **Then** there is a distinct short natural pause (approx. 300–400ms) after "Piu piu", another pause between the popular name and the scientific name, ensuring clean phonetics.
3. **Given** the device volume is at an audible level, **When** the announcement plays, **Then** the voice sounds clear, crisp, and understandable at a normal table-side distance.

---

### User Story 2 - User Replay and Speech Controls (Priority: P2)

As a player at the table, I want to be able to replay the vocal announcement on demand or cancel it if someone is talking, so that the speech feature never becomes disruptive and can be repeated for other players to hear.

**Why this priority**: Essential table-side etiquette and usability. Players need quick tactile control to hear the funny announcement again or silence it immediately.

**Independent Test**: Can be tested by tapping a dedicated "Falar nome" button on the card to replay the speech, or tapping away/closing the card to immediately stop any active speech synthesis.

**Acceptance Scenarios**:

1. **Given** a bird card is currently open, **When** the user taps the speech announcement button, **Then** the app immediately vocalizes `"Piu piu, [Nome Popular], [Nome Científico]"` from the beginning.
2. **Given** speech synthesis is actively speaking, **When** the user closes the card or switches to another bird, **Then** speech immediately halts without lingering in the background.
3. **Given** speech synthesis is active, **When** the user taps the speech button while speaking, **Then** it toggles/stops the speech.

---

### User Story 3 - Harmony with Biological Bird Vocalizations (Priority: P3)

As a player who also enjoys listening to the real field recordings of bird calls, I want the spoken announcement to coordinate seamlessly with bird song playback so they do not overlap cacophonously.

**Why this priority**: Preserves Constitution Principle III (Authentic Ornithological Media & Strict Single-Player Audio). Spoken words and high-frequency avian songs should not talk over each other in an annoying clash.

**Independent Test**: Can be tested by triggering bird song playback while speech is active (or vice versa) and verifying that speech and biological audio politely yield or coordinate cleanly.

**Acceptance Scenarios**:

1. **Given** speech is actively announcing the bird's name, **When** the user presses play to hear the bird's authentic birdsong, **Then** speech synthesis halts immediately and the real bird call begins cleanly.
2. **Given** real bird call audio is already playing, **When** the user opens a card or taps speech replay, **Then** bird call audio is paused or ducked so the vocal announcement is clearly intelligible.

---

### Edge Cases

- **Fast Card Swapping**: If a user quickly swipes between multiple cards in the catalog or scanner history, any in-flight speech must be cancelled instantaneously so multiple voices never queue up or talk simultaneously.
- **Silent Mode / Mute Switch**: When the physical device is switched to hardware silent mode (iOS ringer switch or Android silent), speech synthesis must respect system audio policies appropriately.
- **Accented & Latin Phonetics**: Scientific names containing Latin diphthongs (e.g. *Aegolius funereus*, *Haematopus palliatus*) must be enunciated without crashing or hanging the TTS engine.
- **Special Characters & Hyphens**: Names with hyphens or apostrophes (e.g. *Alcatraz-de-abbott*, *Pica-pau-do-campo*) must be pronounced fluently without spelling out the punctuation mark.
- **Offline Operation**: The speech synthesis must function reliably offline without requiring external network calls or cloud API keys, leveraging on-device system speech voices.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically generate an audible speech announcement formatted as `"Piu piu, [Nome Popular], [Nome Científico]"` whenever a bird card view is opened.
- **FR-002**: System MUST utilize on-device, zero-cost text-to-speech synthesis with Brazilian Portuguese locale (`pt-BR`) as primary language.
- **FR-003**: System MUST provide a visible, accessible button on the bird card to allow users to replay or stop the vocal announcement on demand.
- **FR-004**: System MUST immediately cancel any ongoing speech synthesis if the user closes the card, navigates to another screen, or opens a different bird.
- **FR-005**: System MUST prevent speech synthesis and authentic biological audio playback from playing concurrently over each other.
- **FR-006**: System MUST introduce a brief comedic rhythm with natural pauses between `"Piu piu"`, the vernacular name, and the scientific name.
- **FR-007**: System MUST provide a preference toggle in the app settings or card header allowing players to mute or enable automatic speech announcements.
- **FR-008**: System MUST support iOS, Android, and Web platforms using native platform speech engines with zero remote server dependencies.

### Key Entities

- **BirdCardSpeechPayload**: Represents the formatted text to be enunciated:
  - `prefix`: `"Piu piu,"` (comedic intro)
  - `popularName`: Localized bird vernacular title (e.g. `"Quetzal-resplandecente"`)
  - `scientificName`: Binomial Latin name (e.g. `"Pharomachrus mocinno"`)
  - `locale`: Language code (`pt-BR`)
  - `rate`: Speech speed multiplier (e.g., 0.95x for comedic cadence and clarity)
  - `pitch`: Speech pitch multiplier (e.g., 1.05x for playful, energetic tone)
- **SpeechSettings**: User preferences regarding vocal announcements:
  - `autoAnnounceOnCardOpen`: Boolean (default: `true`)
  - `speechVolume`: Float between 0.0 and 1.0

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Vocal announcement begins within 300ms of card presentation on both mobile and web.
- **SC-002**: 100% of the 597 birds in the catalog can be vocalized without runtime exceptions or pronunciation crashes.
- **SC-003**: 0 instances of speech audio overlapping with biological field recordings.
- **SC-004**: App bundle size remains under the Constitution limit (<5 MB) with zero external audio assets bundled for TTS.

## Assumptions

- System TTS engines on Android, iOS, and Web browsers have Brazilian Portuguese (`pt-BR`) voice models installed or accessible via OS standard services.
- The phrase "Piu piu" is universally recognized as the onomatopoeia for bird chirping in Brazilian Portuguese culture, matching the lighthearted spirit of the app title (*Piapiupiu / Piupiu U*).
- Users playing in public tournament environments can quickly silence or disable automatic announcements with a single tap toggle.

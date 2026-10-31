# Phase 0 Research: Bird Card Name Speech Announcement (TTS)

## Research Topics & Decisions

### 1. Text-to-Speech Engine Architecture

**Context**: Piupiu U runs on Expo SDK 58 across Android (e.g. Samsung Galaxy S24 Ultra), iOS, and Web. The app requires zero remote cloud dependencies, offline functionality, and zero bundle size bloat per Constitution Principle IV.

**Decision**: Use `expo-speech` (`~58.0.3`) as the unified cross-platform engine, backed by a safe Web Speech API (`window.speechSynthesis`) fallback wrapper in `birdSpeechService.ts`.

**Rationale**:
- `expo-speech` is the standard, battle-tested Expo module targeting native `android.speech.tts.TextToSpeech` on Android, `AVSpeechSynthesizer` on iOS, and the browser's native `SpeechSynthesis` on Web.
- It is fully supported in standard Expo Go clients without requiring custom native compilation or linking.
- It introduces zero audio file bundle weight (`<10KB` JavaScript overhead), satisfying Constitution Principle IV.
- It operates completely offline using the user's pre-installed system voice synthesizer.

**Alternatives Considered**:
- *Pre-rendered TTS `.mp3` files*: Would require generating 597 audio clips and either hosting them remotely (high latency, network dependencies) or bundling them (>30MB bundle bloat, violating Constitution Principle IV).
- *Cloud TTS APIs (Google Cloud Text-to-Speech, ElevenLabs)*: Rejected because they require API keys, remote network latency, data consumption at physical board game tables, and violate the privacy/offline principles of the app.

---

### 2. Comedic Phrasing, Rhythm, and Phonetic Formatting

**Context**: The user specified: *"quando abrir um card de ave, quero usar alguma ferramenta de text to speech pra falar o nome dela (nome popular + nome cientifico). E pra dar um ar de comedia, fale assim 'piu piu' + os nomes"*.

**Decision**: Construct the spoken utterance as:
```text
"Piu piu! [bird.name_pt]... [bird.scientific]."
```
with speech options:
- `language`: `'pt-BR'`
- `pitch`: `1.05` (slightly elevated, cheerful and playful bird caricature)
- `rate`: `0.92` (slightly relaxed cadence ensuring clear enunciation of Latin binomials and hyphenated Portuguese names)

**Rationale**:
- The exclamation point after `"Piu piu!"` prompts TTS engines to produce a cheerful, upbeat inflection.
- The ellipsis (`...`) inserts a natural 300–400ms pause between the comedic onomatopoeia, the popular vernacular name, and the Latin scientific name.
- Hyphenated names (e.g. *Gaivota-de-audouin*) are enunciated naturally by the `pt-BR` voice when formatted with spaces or standard typography.

---

### 3. Strict Single-Player Audio Coordination

**Context**: Constitution Principle III requires *Strict Single-Player Audio*: "multiple bird sounds never play simultaneously". Spoken names and real bird vocalizations must never collide.

**Decision**: Bi-directional stop coordination between `birdSpeechService` and `audioService`:
1. Whenever `birdSpeechService.speakBird(bird)` is triggered, it calls `audioService.stop()` immediately.
2. Whenever `audioService.playBirdSound(bird)` is triggered, it calls `birdSpeechService.stop()` immediately.
3. When the bird card component unmounts or closes, `birdSpeechService.stop()` is invoked in the `useEffect` cleanup hook.

**Rationale**:
- Eliminates any cacophony between synthesized human speech and high-frequency biological avian songs.
- Preserves a polished, intentional table-side audio experience.

---

### 4. User Control & Settings

**Context**: While comedic announcements are delightful, players in competitive game environments or quiet settings may want to silence auto-announcements or trigger them strictly on demand.

**Decision**:
1. Store an active session flag `autoAnnounceEnabled: boolean` (default: `true`).
2. Provide a tactile speech icon button directly on `BirdPlayingCard` and the full-screen photo zoom modal:
   - When speaking: icon pulses or indicates active speech; tapping stops speech.
   - When idle: tapping replays the comedic announcement immediately.
3. Provide a quick mute toggle to disable automatic speech on card open if desired.


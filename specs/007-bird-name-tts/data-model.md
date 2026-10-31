# Phase 1 Data Model: Bird Card Name Speech Announcement (TTS)

## Entities

### 1. `BirdSpeechPayload`

Represents the processed text utterance and phonetic parameters prepared for speech synthesis:

| Field | Type | Description | Example |
|---|---|---|---|
| `birdId` | `string` | Unique identifier of the bird | `"quetzal_resplandecente"` |
| `spokenText` | `string` | Formatted utterance with comedic prefix and pauses | `"Piu piu! Quetzal-resplandecente... Pharomachrus mocinno."` |
| `language` | `string` | BCP-47 locale code for synthesis | `"pt-BR"` |
| `pitch` | `number` | Voice pitch multiplier (0.5 to 2.0) | `1.05` |
| `rate` | `number` | Speech tempo multiplier (0.5 to 2.0) | `0.92` |

**Validation Rules**:
- `birdId` must match `/^[a-z0-9_]+$/`.
- `spokenText` must start with `"Piu piu"` and contain both vernacular and scientific names.
- `pitch` must be clamped between `0.8` and `1.3` to avoid voice distortion.
- `rate` must be clamped between `0.8` and `1.2` to preserve clarity.

---

### 2. `SpeechState`

Represents the current runtime status of speech synthesis:

| Field | Type | Description |
|---|---|---|
| `isSpeaking` | `boolean` | Whether text-to-speech audio is currently being output |
| `currentBirdId` | `string \| null` | The bird ID currently being announced |
| `speechRequestId` | `number` | Monotonically increasing counter for race condition prevention |

**State Transitions**:
```text
[IDLE]
  │
  ├── speakBird(bird) ────► [SPEAKING (birdId, requestId)]
  │                              │
  ├── stop() ◄───────────────────┼── unmount / close card
  │                              ├── user taps stop
  │                              └── utterance onDone()
```

---

### 3. `SpeechSettings`

User preferences for table-side announcements:

| Field | Type | Default | Description |
|---|---|---|---|
| `autoAnnounceOnCardOpen` | `boolean` | `true` | Automatically speak bird name when opening card |
| `enabled` | `boolean` | `true` | Master toggle for speech announcement feature |


# Quickstart & Validation Guide: Bird Card Name Speech Announcement (TTS)

## Feature Overview

When opening a bird card in Piupiu U (in `BirdPlayingCard` or the full-screen photo zoom modal), the app speaks `"Piu piu! [Nome Popular]... [Nome Científico]"` via on-device Text-to-Speech synthesis in Brazilian Portuguese.

---

## Prerequisites & Installation

Verify existing test suite and type check:
```bash
npm run typecheck
npm test
```

Add `expo-speech` dependency (official Expo SDK 58 package):
```bash
npx expo install expo-speech
```

---

## Validation Scenarios

### Scenario 1: Unit Test Validation (Phrase Construction & State Transitions)
Execute the speech service unit tests:
```bash
npm test -- src/__tests__/birdSpeechService.test.ts
```
**Expected Outcome**:
- `formatSpeechPhrase` formats `"Piu piu! [name_pt]... [scientific]."` correctly across accented, hyphenated, and compound Latin names.
- Calling `speakBird` halts any active audio.
- Calling `stop` resets speech state immediately.

---

### Scenario 2: Card Open Auto-Announcement
1. Start the app:
   ```bash
   npm start
   ```
2. Navigate to **Scanner** and select any simulated bird card (e.g., *Quetzal-resplandecente*).
3. When the card appears, verify the device audibly announces:
   $$\text{"Piu piu! Quetzal-resplandecente... Pharomachrus mocinno."}$$
4. Tap the speech icon button on the card to replay the announcement on demand.

---

### Scenario 3: Catalog Full-Screen Photo Zoom
1. Navigate to **Catálogo** tab.
2. Tap the circular photo of any bird (e.g., *Alcatraz-de-abbott*).
3. The 300x300 high-res modal opens and announces:
   $$\text{"Piu piu! Alcatraz-de-abbott... Papasula abbotti."}$$
4. Close the modal or tap the cancel button: speech immediately halts.

---

### Scenario 4: Single-Player Audio Exclusivity
1. Open a card and let the speech start.
2. Immediately tap the green sound button to play the authentic bird song.
3. Verify that the speech vocalization stops cleanly and the real bird song starts without audio overlap.


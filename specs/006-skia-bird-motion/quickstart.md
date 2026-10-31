# Quickstart Validation Guide: Living 2D Bird Artwork with React Native Skia

This guide provides end-to-end validation scenarios for verifying the **Living 2D Bird Artwork** (`006-skia-bird-motion`) feature in Piupiu U.

---

## 1. Prerequisites & Environment Setup

Ensure project dependencies are intact and typechecks pass:

```bash
# Verify working tree
git status

# Typecheck the project
npm run typecheck

# Run automated tests
npm test
```

---

## 2. Automated Test Verification

A dedicated unit test suite validates particle generation, parallax layer calculations, breathing oscillation formulas, and reduced-motion guardrails:

```bash
# Run Jest focused on living card calculations and particle physics
npm test -- src/__tests__/livingCardPhysics.test.ts
```

### Expected Test Assertions:
1. **Parallax Offset**:
   - Normalized tilt `(tiltX: 0.5, tiltY: -0.5)` with factor `1.0` and max `20px` yields `(x: 10, y: -10)`.
   - Layer factors scale strictly: background ($0.35\times$) $<$ subject ($1.0\times$) $<$ particles ($1.45\times$).
2. **Breathing Oscillation**:
   - Harmonic equation produces smooth sine wave between $-2.5\text{px}$ and $+2.5\text{px}$ with periodic cycle $\sim 3.5\text{s}$.
3. **Particle Simulation**:
   - `spawnParticle` generates correct `ParticleKind` (`leaf` for forest, `pollen` for grassland, `mist` for wetland, `musicNote` when audio active).
   - `stepParticles` advances positions, increments age, recycles expired particles, and stays within `maxParticles` cap.
4. **Reduced Motion**:
   - When reduced motion is active, calculated offsets collapse to `(0, 0)` and particle counts remain zero.

---

## 3. Manual Interactive Scenarios (Tabletop Validation)

Start the Expo dev server:

```bash
npx expo start
```

### Scenario A: 2.5D Parallax Tilt & Touch Drag
1. Open the app on a mobile device or simulator.
2. In the **Scanner** tab, tap any bird chip (or scan a Wingspan card) to open the **Bird Playing Card** hero overlay.
3. Tilt the device in your hands:
   - Observe that the bird figure shifts relative to the background habitat wash.
   - The watercolor texture behind the bird moves at a slower rate than the bird subject, producing depth.
4. On simulator or web:
   - Touch/drag your finger across the card surface.
   - Observe that the card tilts and responds to your touch point with realistic perspective and springs back when released.

---

### Scenario B: Subtle Living Breathing & Idle Motion
1. Place the phone flat on a table so the gyroscope is stationary.
2. Watch the bird illustration closely for 5–10 seconds.
3. Observe the gentle, slow breathing cycle:
   - The bird's chest and wing contour gently expand and contract in a tranquil natural rhythm.
   - No visual tearing or texture blur occurs.

---

### Scenario C: Habitat Particle Atmosphere
1. Inspect a **Forest** bird (e.g., *Gavião-Real* or *Coruja-das-Torres*):
   - Observe delicate translucent watercolor leaves gently drifting across the card.
2. Inspect a **Grassland** bird (e.g., *Carcará* or *Quero-Quero*):
   - Observe golden pollen and soft seed particles floating upward.
3. Inspect a **Wetland** bird (e.g., *Garça-Branca-Grande*):
   - Observe soft river mist droplets drifting across the frame.

---

### Scenario D: Melodic Notes during Bird Song Playback
1. With the bird card open, tap the **"Ouvir"** blob button to stream the bird's authentic vocalization.
2. As the audio plays, observe delicate watercolor musical notes emanating from the bird illustration.
3. Tap **"Parar"**:
   - Verify that new musical notes stop generating immediately, and active notes fade out softly.

---

### Scenario E: Lifecycle & Battery Conservation
1. Dismiss the bird card using the **"X"** button.
2. Switch tabs between **Scanner**, **Catálogo**, and **Pontuação**.
3. Verify via GPU/profiler tools that the Skia animation loop is completely halted while no card is being inspected (0% idle GPU consumption).


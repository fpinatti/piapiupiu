# Research: Living 2D Bird Artwork with React Native Skia (006-skia-bird-motion)

## 1. Domain & Technical Feasibility Analysis

### 1.1 Graphic Engine: React Native Skia (`@shopify/react-native-skia`)
- **Core Capability**: Provides direct GPU rendering via JSI (JavaScript Interface) using Google's 2D Skia graphics library (identical to Flutter, Android, and Chromium rendering pipelines).
- **Suitability for Wingspan Artwork**:
  - Wingspan bird illustrations are 2D paintings. Re-authoring 597 birds as vector meshes is unfeasible.
  - Skia enables GPU-accelerated raster manipulation: texture sampling, SkSL runtime shaders, 2.5D matrix transformations, and high-performance particle canvas draws with zero bridge overhead.
- **Decision**: Use `@shopify/react-native-skia` for GPU canvas rendering on supported platforms, combined with a modular fallback component architecture for web/low-power environments.
- **Alternatives Considered**:
  - *Lottie / Rive*: Requires custom vector vectorization and rigging for 597 individual species, which contradicts the scalable photographic/scanned card pipeline.
  - *Three.js / Expo GL*: Heavy overhead (>15MB engine payload) that violates Constitution Principle IV (<5MB bundle budget).

---

### 1.2 Motion & Orientation Tracking
- **Core Capability**: Translating physical device orientation (roll and pitch) into real-time optical parallax depth.
- **Sensors Choice**:
  - `expo-sensors` (`DeviceMotion` or `Gyroscope`): First-party Expo SDK 58 module with zero custom native code, fully compatible with Expo Go and EAS Build.
  - Normalized tilt angles: $-1.0$ to $+1.0$ mapped to a maximum pixel offset ($\pm 12$px for background, $\mp 16$px for bird foreground, $\pm 22$px for foreground frame/particles).
- **Graceful Fallbacks**:
  - **Touch Gesture / Pan Fallback**: Touch coordinates within the card surface smoothly map to equivalent tilt angles with spring dampening (`useDerivedValue` / interpolation).
  - **Ambient Idle Sway**: In stationary or sensor-less mode, an autonomous subtle harmonic oscillation ($\sin(t \times 0.8)$) creates gentle breathing motion without requiring user touch.
- **Decision**: Implement a unified `useBirdMotion` hook that combines hardware orientation, touch drag, and autonomous harmonic idle sway.

---

### 1.3 2.5D Parallax Layering Strategy
- **Layer 0 (Background Wash)**: Habitat watercolor wash (`HABITAT_THEME[habitat].bg` + organic watercolor droplet mask). Moves at low velocity factor ($k = 0.35$).
- **Layer 1 (Subject Layer)**: Bird illustration/photograph with soft oval vignette or transparent cutout. Moves at focal plane velocity ($k = 1.0$).
- **Layer 2 (Living Mesh/Shader)**: Subtle sinusoidal displacement shader applied to Layer 1.
- **Layer 3 (Foreground Atmospheric Particles)**: Habitat leaves, pollen, or musical notes drifting with high parallax velocity ($k = 1.45$).
- **Layer 4 (Tactile Card Border & Badges)**: Card frame, header ribbon, and taxonomic badges.

---

### 1.4 Mesh Distortion & Breathing Shaders (SkSL)
- **Skia Runtime Shaders (SkSL)**: Skia's shading language allows running GLSL-like fragment shaders directly on the GPU.
- **Breathing Rhythm**:
  - A harmonic sine-wave displacement:
    $$d_y = \sin(2\pi \cdot f \cdot t + y \cdot k) \cdot A$$
    where frequency $f \approx 0.28\text{ Hz}$ (approx. 3.5 seconds per breath) and amplitude $A \approx 2\text{px}$.
  - This creates gentle thoracic expansion and feather posture variation without visible image distortion or texture blurring.
- **Decision**: Author an authentic, subtle SkSL fragment shader (`breathingShader.sksl` / inline Skia RuntimeEffect) that animates the bird texture smoothly.

---

### 1.5 Ambient Particle Atmosphere
- **Habitat Particle Types**:
  - `forest`: Falling watercolor leaves ($\sim 12$ active particles, slow drift with angular wobble).
  - `grassland`: Golden seeds / floating pollen ($\sim 18$ active particles, gentle upward draft).
  - `wetland`: Translucent river mist / water droplets ($\sim 10$ active particles, horizontal drift).
  - `audio`: Watercolor musical notes emitted outward in radial waves while `isPlaying === true`.
- **Performance Budget**: Particles are simple Skia vector glyphs or colored circles/teardrops drawn in a single batched canvas pass. Memory footprint is $<20\text{ KB}$ for 20 particle state objects.

---

### 1.6 Battery, Performance & Reduced Motion Governance
- **Render Scope**: The Skia canvas only runs when the single inspected bird card is mounted and visible on screen (`BirdPlayingCard.tsx` hero card or `BirdPhoto` zoom modal). It NEVER runs in the 597-item catalog FlatList.
- **Lifecycle Hook**: Animations suspend immediately when `AppState !== 'active'`, when the card is dismissed, or when navigation leaves the tab.
- **Accessibility**: Listens to `AccessibilityInfo.isReduceMotionEnabled()`. When true, skips shader deformation, parallax tilt, and particle emitters.


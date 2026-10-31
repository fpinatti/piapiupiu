# Feature Specification: Living 2D Bird Artwork with React Native Skia (Arte Dinâmica e Parallax 2.5D)

**Feature Branch**: `006-skia-bird-motion`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "3. Para Dar Vida a Imagens Estáticas 2D: React Native Skia (@shopify/react-native-skia). Se as imagens forem estáticas (PNGs recortados das cartas do Wingspan) e você quiser dar profundidade ou movimento dinâmico sem ter que redesenhar tudo em vetores: Por que usar: Traz o motor gráfico 2D do Google (o mesmo do Chrome e Flutter) diretamente para a GPU do aparelho via JSI. Técnicas possíveis com Skia: Efeito Parallax 2.5D: Separar a ave do fundo e mover as camadas com o giroscópio do celular (react-native-sensors). Distorção de Malha (Mesh Distortion): Aplicar uma malha de vértices sobre a imagem estática para criar ondulação de asas ou movimento de respiração através de shaders GLSL simples. Filtros e Partículas: Criar efeitos de folhas caindo ou notas musicais saindo do pássaro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 2.5D Depth & Parallax Card Tilt (Priority: P1) 🎯 MVP

When a player scans or selects a bird card to inspect it in detail, the card renders with tangible optical depth. Tilting the phone (leveraging the gyroscope) or gently dragging a finger over the card shifts the bird foreground, habitat watercolor wash, and frame at subtly different speeds. This creates a tactile, 2.5D "holographic naturalist collectible" sensation that brings the flat card artwork to life on the table.

**Why this priority**: Immediate tactile delight at the game table; transforms flat scans into physical-feeling collector items without requiring 3D models or manual vector redesign.

**Independent Test**: Open any bird card detail or hero overlay; tilt the device in physical space (or drag on simulator/web); verify that the bird silhouette and background wash move with independent parallax depth layers at 60 FPS.

**Acceptance Scenarios**:

1. **Given** a displayed bird card hero overlay, **When** the player tilts the mobile device along X/Y axes, **Then** the bird figure and background layer displace with smooth differentiated parallax offsets.
2. **Given** a device without gyroscope sensors (or sensor permission denied), **When** the player touches and pans across the card surface, **Then** the card tilts and shifts layers responsive to touch coordinates with smooth spring dampening.
3. **Given** the parallax card is open, **When** motion occurs, **Then** the render loop executes directly on the GPU maintaining a steady 60 FPS.

---

### User Story 2 - Organic Breathing & Wing Wave Living Mesh (Priority: P2)

When viewing the bird card, the bird does not look frozen like an inert sticker. A subtle, natural vertex mesh displacement / GLSL shader applies a rhythmic, gentle breathing cycle and micro-swaying to feathers and wings, creating the illusion of a living bird resting in its habitat.

**Why this priority**: Enhances immersion and emotional connection with the species, honoring the naturalist field guide aesthetic of *Wingspan*.

**Independent Test**: Keep the card stationary on a flat surface; observe the bird illustration; verify gentle cyclical chest expansion and plumage sway without visual texture distortion or tearing.

**Acceptance Scenarios**:

1. **Given** an active bird card on screen, **Then** a continuous, slow-paced (e.g. 3–4 second period) organic mesh displacement cycle runs, giving life to the bird figure.
2. **Given** the card view is dismissed or tab is switched, **Then** the Skia shader animation loop pauses immediately to preserve battery and GPU cycles.
3. **Given** system accessibility settings have "Reduce Motion" enabled, **Then** mesh distortion is disabled and the static card is presented cleanly.

---

### User Story 3 - Ambient Habitat Particles & Melodic Notes (Priority: P3)

To complement the bird's natural environment and authentic vocalizations, the card features ambient particles tailored to the bird's primary habitat: falling leaves in the Forest (*Floresta*), floating seeds and golden pollen in Grasslands (*Campo*), and gentle mist droplets in Wetlands (*Água*). When the player plays the bird's vocalization, delicate watercolor musical notes float softly outward from the bird.

**Why this priority**: Multimodal sensory delight; ties the visual atmosphere directly to Elizabeth Hargrave's habitat ecology and authentic field audio.

**Independent Test**: View a Forest bird card and observe floating leaf particles; tap audio playback and observe musical notes drifting softly during playback, stopping when audio stops.

**Acceptance Scenarios**:

1. **Given** a Forest habitat bird, **Then** subtle translucent leaf watercolor particles drift across the card canvas.
2. **Given** a Grassland or Wetland bird, **Then** habitat-appropriate particles (golden pollen or river mist) drift across the card.
3. **Given** audio playback begins, **Then** watercolor music notes softly emit from the bird and fade into the background.
4. **Given** audio playback stops or ends, **Then** new note emissions cease immediately while existing notes fade out gracefully.

---

### Edge Cases

- **Missing Gyroscope / Web Platform**: Devices lacking hardware gyroscope or web browsers with restricted sensor permissions MUST gracefully fallback to touch-drag interaction and subtle autonomous idle swaying.
- **Low-End Devices / Battery Saver**: When battery saver is active or frame rate dips below 45 FPS, particle count and mesh subdivision MUST automatically scale down.
- **Reduced Motion Accessibility**: If the user has OS-level reduced motion enabled, all parallax tilting, mesh distortion, and particles MUST be suppressed.
- **Single Bird at a Time**: Animated Skia canvases MUST only run on the single active card being inspected (Hero Card overlay or Detail modal), never on all 597 items simultaneously in the Catalog FlatList.
- **Transparent / Cutout vs Full Artwork**: If an isolated cutout bird PNG is available, it layers over the habitat; if only a single species photo is loaded, depth is created via soft vignette masking and focal plane separation.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render card artwork using a GPU-accelerated 2D graphics canvas (React Native Skia) for the active bird inspection view.
- **FR-002**: System MUST implement a 2.5D multi-layer parallax composition separating bird foreground and habitat background.
- **FR-003**: System MUST calculate dynamic parallax translation based on device orientation/gyroscope input when available.
- **FR-004**: System MUST provide interactive touch-pan gesture fallback when gyroscope is unavailable or denied.
- **FR-005**: System MUST apply a subtle, organic breathing mesh/shader displacement to the bird subject with a gentle cycle (0.25 to 0.3 Hz).
- **FR-006**: System MUST generate habitat-themed ambient particle effects matching the bird's primary habitat (`forest`, `grassland`, `wetland`).
- **FR-007**: System MUST emit ambient musical note particles during active audio playback that synchronize with audio state.
- **FR-008**: System MUST suspend all Skia animations immediately upon card dismissal or app backgrounding.
- **FR-009**: System MUST strictly adhere to OS accessibility settings, disabling motion when "Reduce Motion" is enabled.
- **FR-010**: System MUST harmonize with the Naturalist Field Guide visual identity (`DESIGN.md`), using watercolor transparency washes, organic movement, and zero arcade-like flashiness.

### Key Entities

- **LivingCardConfig**: Configuration entity defining layer separation, depth scale factor, and active shader effects for a bird card.
- **HabitatAtmosphere**: Definition of particle type, color wash, speed, and density for each habitat (`forest`, `grassland`, `wetland`).
- **MotionSensorState**: Normalized X/Y tilt angles (-1.0 to 1.0) derived from gyroscope or touch drag.
- **ParticleSystemState**: Collection of active ambient particles (position, velocity, opacity, lifecycle).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Stable 60 FPS animation rendering on supported mobile devices during parallax tilt and shader effects.
- **SC-002**: Zero perceptual audio glitching or stuttering during concurrent bird song streaming and particle animation.
- **SC-003**: Less than 100ms initialization time when opening the living card view.
- **SC-004**: 100% graceful fallback to touch-drag or static card on platforms without gyroscope support.
- **SC-005**: Zero battery drain while the card is closed (0% GPU usage when idle on catalog or scanner views).

---

## Assumptions

- Living artwork effects are focused on the prominent single-card inspection experience (`BirdPlayingCard.tsx` / Hero View / Modal), keeping the 597-item catalog lightweight.
- Gyroscope access is requested with standard permission protocols and non-intrusive fallback if denied.
- Shaders are lightweight GLSL/SkSL fragment and vertex programs compatible with standard mobile GPUs.


/**
 * Pure Mathematical & Simulation Helpers for Living 2D Bird Artwork
 * Feature: 006-skia-bird-motion
 */

import { HabitatType } from '../types/bird';
import {
  DEFAULT_LIVING_CONFIG,
  HABITAT_PARTICLE_THEMES,
  HabitatParticle,
  MUSIC_NOTE_PARTICLE_THEME,
  ParticleKind,
} from '../types/livingCard';

/**
 * Calculates 2.5D parallax layer translation based on normalized tilt (-1.0 to 1.0).
 */
export function calculateLayerOffset(
  tiltX: number,
  tiltY: number,
  factor: number = 1.0,
  maxOffsetPx: number = 16
): { x: number; y: number } {
  const clampedX = Math.max(-1.0, Math.min(1.0, isNaN(tiltX) ? 0 : tiltX));
  const clampedY = Math.max(-1.0, Math.min(1.0, isNaN(tiltY) ? 0 : tiltY));

  return {
    x: clampedX * factor * maxOffsetPx,
    y: clampedY * factor * maxOffsetPx,
  };
}

/**
 * Calculates subtle breathing thoracic expansion and slight vertical heave.
 */
export function calculateBreathingOffset(
  timeSeconds: number,
  frequencyHz: number = DEFAULT_LIVING_CONFIG.breathingFrequency,
  amplitudePx: number = DEFAULT_LIVING_CONFIG.breathingAmplitude
): { scaleY: number; offsetY: number } {
  if (isNaN(timeSeconds)) {
    return { scaleY: 1.0, offsetY: 0 };
  }

  const phase = 2 * Math.PI * frequencyHz * timeSeconds;
  const sinVal = Math.sin(phase);

  return {
    offsetY: sinVal * amplitudePx,
    scaleY: 1.0 + sinVal * (amplitudePx * 0.012),
  };
}

/**
 * Calculates feather sheen specular sunlight highlight sweep and intensity.
 * Simulates sunlight catching the bird's plumage as the card or viewing angle tilts.
 */
export function calculateFeatherSheen(
  timeSeconds: number,
  tiltX: number = 0,
  tiltY: number = 0
): { sweepProgress: number; intensity: number } {
  if (isNaN(timeSeconds)) {
    return { sweepProgress: 0, intensity: 0 };
  }

  // Dynamic light angle moving with device tilt and gentle harmonic idle oscillation
  const sweepAngle = tiltX * 0.75 + Math.sin(timeSeconds * 0.7) * 0.35;
  // Specular intensity peaks during active motion tilt
  const tiltMotionMagnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
  const intensity = Math.min(1.0, 0.22 + tiltMotionMagnitude * 0.28);

  return {
    sweepProgress: Math.max(-1.0, Math.min(1.0, sweepAngle)),
    intensity,
  };
}

/**
 * GLSL / SkSL Runtime Effect for Natural Specular Feather Sheen.
 * Applies a diagonal light sweep highlight across plumage with warm golden sunlight tint.
 */
export const FEATHER_SHEEN_SKSL = `
uniform float2 resolution;
uniform float time;
uniform float tiltX;
uniform float tiltY;
uniform shader image;

half4 main(float2 xy) {
  half4 color = image.eval(xy);
  if (color.a <= 0.01) {
    return color;
  }
  float2 uv = xy / resolution;
  // 35-degree diagonal sunlight band across plumage
  float lightBand = sin((uv.x * 0.8 + uv.y * 0.6) * 3.14159 + tiltX * 2.2 + time * 0.7);
  // Specular sheen with soft power curve
  float sheen = pow(max(0.0, lightBand), 7.0) * (0.22 + length(float2(tiltX, tiltY)) * 0.15);
  // Warm golden sunlight tint
  half3 sunGlaze = half3(1.0, 0.96, 0.86) * sheen;
  return half4(color.rgb + sunGlaze * color.a, color.a);
}
`;

/**
 * Spawns a single atmospheric particle for a given habitat or audio playback note.
 */
export function spawnParticle(
  canvasWidth: number,
  canvasHeight: number,
  habitat: HabitatType = 'forest',
  isAudioNote: boolean = false,
  seedIndex: number = 0
): HabitatParticle {
  const w = canvasWidth > 0 ? canvasWidth : 200;
  const h = canvasHeight > 0 ? canvasHeight : 200;

  if (isAudioNote) {
    const theme = MUSIC_NOTE_PARTICLE_THEME;
    const color = theme.colors[seedIndex % theme.colors.length];
    return {
      id: `note_${Date.now()}_${seedIndex}`,
      x: w * 0.45 + (Math.random() - 0.5) * (w * 0.3),
      y: h * 0.55 + (Math.random() - 0.5) * (h * 0.2),
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.6 - Math.random() * 0.8,
      size: theme.baseSize + (Math.random() - 0.5) * 2,
      opacity: 0.85,
      rotation: (Math.random() - 0.5) * 0.5,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      age: 0,
      maxAge: 70 + Math.floor(Math.random() * 30),
      kind: 'musicNote',
      color,
    };
  }

  const theme = HABITAT_PARTICLE_THEMES[habitat] || HABITAT_PARTICLE_THEMES.forest;
  const color = theme.colors[seedIndex % theme.colors.length];

  let startX = Math.random() * w;
  let startY = 0;

  if (theme.baseSpeedY < 0) {
    // Rising particles (grassland pollen) start near bottom
    startY = h + Math.random() * 10;
  } else {
    // Falling or drifting particles start near top or left
    startY = -10 + Math.random() * (h * 0.5);
  }

  return {
    id: `part_${Date.now()}_${seedIndex}`,
    x: startX,
    y: startY,
    vx: theme.baseSpeedX * (0.8 + Math.random() * 0.4),
    vy: theme.baseSpeedY * (0.8 + Math.random() * 0.4),
    size: theme.baseSize * (0.8 + Math.random() * 0.4),
    opacity: 0.7,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    age: 0,
    maxAge: 100 + Math.floor(Math.random() * 60),
    kind: theme.kind,
    color,
  };
}

/**
 * Steps the particle system forward by one frame, recycling expired particles.
 */
export function stepParticles(
  particles: readonly HabitatParticle[],
  canvasWidth: number,
  canvasHeight: number,
  habitat: HabitatType = 'forest',
  isPlayingAudio: boolean = false,
  maxParticles: number = DEFAULT_LIVING_CONFIG.maxParticles
): HabitatParticle[] {
  const w = canvasWidth > 0 ? canvasWidth : 200;
  const h = canvasHeight > 0 ? canvasHeight : 200;

  const nextList: HabitatParticle[] = [];

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const newAge = p.age + 1;

    // Check bounds & lifespan
    const isOut =
      newAge >= p.maxAge ||
      p.x < -20 ||
      p.x > w + 20 ||
      p.y < -30 ||
      p.y > h + 30;

    if (!isOut) {
      // Calculate smooth fade-in and fade-out envelope
      const progress = newAge / p.maxAge;
      let alphaFactor = 1.0;
      if (progress < 0.2) {
        alphaFactor = progress / 0.2;
      } else if (progress > 0.7) {
        alphaFactor = 1.0 - (progress - 0.7) / 0.3;
      }

      nextList.push({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        rotation: p.rotation + p.rotationSpeed,
        age: newAge,
        opacity: Math.max(0, Math.min(1.0, alphaFactor * 0.8)),
      });
    }
  }

  // Replenish particles if under capacity
  let seed = 0;
  while (nextList.length < maxParticles) {
    // If audio is playing, prioritize musical notes
    const shouldSpawnNote = isPlayingAudio && Math.random() < 0.4;
    nextList.push(spawnParticle(w, h, habitat, shouldSpawnNote, seed++));
  }

  return nextList;
}


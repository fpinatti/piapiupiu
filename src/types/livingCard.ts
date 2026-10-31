/**
 * Types and Configurations for Living 2D Bird Artwork
 * Feature: 006-skia-bird-motion
 */

import { BirdCard, HabitatType } from './bird';

export type MotionSource = 'gyroscope' | 'touch' | 'idle';

export interface MotionSensorState {
  readonly tiltX: number; // Normalized -1.0 to 1.0
  readonly tiltY: number; // Normalized -1.0 to 1.0
  readonly source: MotionSource;
  readonly isActive: boolean;
}

export type ParticleKind = 'leaf' | 'pollen' | 'mist' | 'musicNote';

export interface HabitatParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  age: number;
  maxAge: number;
  kind: ParticleKind;
  color: string;
}

export interface LivingArtworkConfig {
  readonly backgroundParallaxFactor: number;
  readonly subjectParallaxFactor: number;
  readonly particleParallaxFactor: number;
  readonly breathingFrequency: number; // Hz (~0.28)
  readonly breathingAmplitude: number; // pixels (~2.5)
  readonly maxParticles: number;
  readonly enableBreathing: boolean;
  readonly enableParticles: boolean;
  readonly enableParallax: boolean;
}

export const DEFAULT_LIVING_CONFIG: LivingArtworkConfig = {
  backgroundParallaxFactor: 0.35,
  subjectParallaxFactor: 1.0,
  particleParallaxFactor: 1.45,
  breathingFrequency: 0.28,
  breathingAmplitude: 2.5,
  maxParticles: 16,
  enableBreathing: true,
  enableParticles: true,
  enableParallax: true,
} as const;

export const HABITAT_PARTICLE_THEMES: Record<
  HabitatType,
  {
    kind: ParticleKind;
    colors: readonly string[];
    baseSize: number;
    baseSpeedY: number;
    baseSpeedX: number;
  }
> = {
  forest: {
    kind: 'leaf',
    colors: ['rgba(45, 90, 66, 0.70)', 'rgba(62, 107, 79, 0.60)', 'rgba(84, 128, 98, 0.65)'],
    baseSize: 6,
    baseSpeedY: 0.7,
    baseSpeedX: 0.3,
  },
  grassland: {
    kind: 'pollen',
    colors: ['rgba(201, 151, 56, 0.65)', 'rgba(230, 180, 80, 0.75)', 'rgba(168, 123, 30, 0.60)'],
    baseSize: 4.5,
    baseSpeedY: -0.4,
    baseSpeedX: 0.2,
  },
  wetland: {
    kind: 'mist',
    colors: ['rgba(65, 125, 146, 0.55)', 'rgba(120, 175, 195, 0.60)', 'rgba(44, 123, 158, 0.50)'],
    baseSize: 5.5,
    baseSpeedY: 0.3,
    baseSpeedX: 0.6,
  },
};

export const MUSIC_NOTE_PARTICLE_THEME = {
  kind: 'musicNote' as ParticleKind,
  colors: ['rgba(45, 90, 66, 0.85)', 'rgba(32, 43, 36, 0.75)'],
  baseSize: 9,
  baseSpeedY: -0.8,
  baseSpeedX: 0.4,
};

export interface LivingBirdArtworkProps {
  bird: BirdCard;
  isPlaying?: boolean;
  width?: number;
  height?: number;
  disabled?: boolean;
  onPress?: () => void;
}


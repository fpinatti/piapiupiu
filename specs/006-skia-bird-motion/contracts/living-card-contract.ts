/**
 * Interface Contract: Living 2D Bird Artwork with React Native Skia
 * Feature: 006-skia-bird-motion
 */

import { BirdCard, HabitatType } from '../../../src/types/bird';

export type MotionSource = 'gyroscope' | 'touch' | 'idle';

export interface MotionSensorState {
  readonly tiltX: number; // -1.0 to 1.0
  readonly tiltY: number; // -1.0 to 1.0
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

export interface LivingBirdCardProps {
  readonly bird: BirdCard;
  readonly isPlaying: boolean;
  readonly width?: number;
  readonly height?: number;
  readonly enableZoom?: boolean;
  readonly onTogglePlay?: (bird: BirdCard) => void;
  readonly onDismiss?: () => void;
}

/**
 * Pure helper contract for particle simulation physics
 */
export interface ParticleSimulationContract {
  /**
   * Spawns a new particle for the specified habitat or audio event.
   */
  spawnParticle(
    canvasWidth: number,
    canvasHeight: number,
    habitat: HabitatType,
    isAudioNote: boolean
  ): HabitatParticle;

  /**
   * Advances active particles by one animation step, recycling expired particles.
   */
  stepParticles(
    particles: readonly HabitatParticle[],
    canvasWidth: number,
    canvasHeight: number,
    habitat: HabitatType,
    isPlayingAudio: boolean,
    maxParticles: number
  ): HabitatParticle[];
}

/**
 * Pure calculation contract for 2.5D optical layer translations
 */
export interface ParallaxCalculationContract {
  /**
   * Calculates pixel offsets for a given layer based on normalized tilt and parallax factor.
   */
  calculateLayerOffset(
    tiltX: number,
    tiltY: number,
    factor: number,
    maxOffsetPx: number
  ): { x: number; y: number };

  /**
   * Computes subtle breathing displacement offset for a given timestamp.
   */
  calculateBreathingOffset(
    timeSeconds: number,
    frequencyHz: number,
    amplitudePx: number
  ): { scaleY: number; offsetY: number };
}


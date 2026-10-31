import { HabitatType } from '../types/bird';
import {
  calculateBreathingOffset,
  calculateFeatherSheen,
  calculateLayerOffset,
  spawnParticle,
  stepParticles,
} from '../utils/livingCardPhysics';

describe('livingCardPhysics', () => {
  describe('calculateLayerOffset', () => {
    it('scales offset proportionally to tilt and factor', () => {
      // tiltX = 0.5, tiltY = -0.5, factor = 1.0, max = 20
      const offset = calculateLayerOffset(0.5, -0.5, 1.0, 20);
      expect(offset.x).toBeCloseTo(10);
      expect(offset.y).toBeCloseTo(-10);
    });

    it('enforces relative depth between background, subject, and particles', () => {
      const tilt = 0.8;
      const bg = calculateLayerOffset(tilt, 0, 0.35, 20);
      const subject = calculateLayerOffset(tilt, 0, 1.0, 20);
      const particles = calculateLayerOffset(tilt, 0, 1.45, 20);

      expect(bg.x).toBeLessThan(subject.x);
      expect(subject.x).toBeLessThan(particles.x);
    });

    it('clamps tilt exceeding bounds (-1.0 to 1.0)', () => {
      const positiveClamp = calculateLayerOffset(2.5, 0, 1.0, 10);
      expect(positiveClamp.x).toBe(10);

      const negativeClamp = calculateLayerOffset(-3.0, 0, 1.0, 10);
      expect(negativeClamp.x).toBe(-10);
    });

    it('handles NaN gracefully with 0 offset', () => {
      const nanOffset = calculateLayerOffset(NaN, NaN, 1.0, 10);
      expect(nanOffset.x).toBe(0);
      expect(nanOffset.y).toBe(0);
    });
  });

  describe('calculateBreathingOffset', () => {
    it('returns zero displacement at time = 0', () => {
      const offset = calculateBreathingOffset(0, 0.28, 2.5);
      expect(offset.offsetY).toBeCloseTo(0);
      expect(offset.scaleY).toBeCloseTo(1.0);
    });

    it('reaches maximum positive amplitude at quarter phase', () => {
      // f = 0.25 Hz -> T = 4s. Quarter phase is t = 1s
      const offset = calculateBreathingOffset(1.0, 0.25, 3.0);
      expect(offset.offsetY).toBeCloseTo(3.0);
      expect(offset.scaleY).toBeGreaterThan(1.0);
    });

    it('handles NaN time gracefully', () => {
      const offset = calculateBreathingOffset(NaN);
      expect(offset.offsetY).toBe(0);
      expect(offset.scaleY).toBe(1.0);
    });
  });

  describe('calculateFeatherSheen', () => {
    it('returns valid bounded sweep progress and intensity', () => {
      const sheen = calculateFeatherSheen(1.5, 0.4, -0.2);
      expect(sheen.sweepProgress).toBeGreaterThanOrEqual(-1.0);
      expect(sheen.sweepProgress).toBeLessThanOrEqual(1.0);
      expect(sheen.intensity).toBeGreaterThan(0);
      expect(sheen.intensity).toBeLessThanOrEqual(1.0);
    });

    it('increases intensity during active device tilt', () => {
      const stationary = calculateFeatherSheen(0, 0, 0);
      const tilted = calculateFeatherSheen(0, 0.8, 0.6);
      expect(tilted.intensity).toBeGreaterThan(stationary.intensity);
    });

    it('handles NaN gracefully', () => {
      const nanSheen = calculateFeatherSheen(NaN);
      expect(nanSheen.sweepProgress).toBe(0);
      expect(nanSheen.intensity).toBe(0);
    });
  });

  describe('spawnParticle', () => {
    it('spawns habitat-specific particles', () => {
      const forestParticle = spawnParticle(200, 200, 'forest', false, 1);
      expect(forestParticle.kind).toBe('leaf');

      const grasslandParticle = spawnParticle(200, 200, 'grassland', false, 1);
      expect(grasslandParticle.kind).toBe('pollen');

      const wetlandParticle = spawnParticle(200, 200, 'wetland', false, 1);
      expect(wetlandParticle.kind).toBe('mist');
    });

    it('spawns musical note particle when audio is active', () => {
      const noteParticle = spawnParticle(200, 200, 'forest', true, 1);
      expect(noteParticle.kind).toBe('musicNote');
      expect(noteParticle.vy).toBeLessThan(0); // notes float upward
    });

    it('initializes valid coordinates, size, and lifespan', () => {
      const particle = spawnParticle(150, 250, 'forest', false, 0);
      expect(particle.size).toBeGreaterThan(0);
      expect(particle.maxAge).toBeGreaterThan(0);
      expect(particle.opacity).toBeGreaterThan(0);
      expect(particle.color).toBeDefined();
    });
  });

  describe('stepParticles', () => {
    it('advances particle positions according to velocity', () => {
      const initial = [
        {
          id: 'test_1',
          x: 50,
          y: 50,
          vx: 2,
          vy: 3,
          size: 5,
          opacity: 0.8,
          rotation: 0,
          rotationSpeed: 0.1,
          age: 10,
          maxAge: 100,
          kind: 'leaf' as const,
          color: '#2D5A42',
        },
      ];

      const stepped = stepParticles(initial, 200, 200, 'forest', false, 1);
      expect(stepped[0].x).toBe(52);
      expect(stepped[0].y).toBe(53);
      expect(stepped[0].rotation).toBeCloseTo(0.1);
      expect(stepped[0].age).toBe(11);
    });

    it('recycles particles when age exceeds maxAge', () => {
      const expiring = [
        {
          id: 'old',
          x: 50,
          y: 50,
          vx: 1,
          vy: 1,
          size: 5,
          opacity: 0.5,
          rotation: 0,
          rotationSpeed: 0,
          age: 99,
          maxAge: 100,
          kind: 'leaf' as const,
          color: '#2D5A42',
        },
      ];

      const stepped = stepParticles(expiring, 200, 200, 'forest', false, 1);
      // The old particle died and was replenished with a fresh particle (age = 0)
      expect(stepped).toHaveLength(1);
      expect(stepped[0].id).not.toBe('old');
      expect(stepped[0].age).toBe(0);
    });

    it('maintains particle count up to maxParticles cap', () => {
      const empty: any[] = [];
      const populated = stepParticles(empty, 200, 200, 'grassland', false, 8);
      expect(populated).toHaveLength(8);
      populated.forEach((p) => {
        expect(p.kind).toBe('pollen');
      });
    });

    it('spawns musical notes when audio is playing', () => {
      const empty: any[] = [];
      const populated = stepParticles(empty, 200, 200, 'forest', true, 16);
      expect(populated).toHaveLength(16);
      const hasNote = populated.some((p) => p.kind === 'musicNote');
      // With isPlayingAudio = true and 16 particles, note generation probability is high
      expect(hasNote).toBe(true);
    });
  });
});


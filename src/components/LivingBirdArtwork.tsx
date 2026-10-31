import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useBirdMotion } from '../hooks/useBirdMotion';
import { getCachedBirdPhoto, resolveBirdPhoto } from '../services/birdImageService';
import { HABITAT_THEME } from '../theme/tokens';
import { HabitatParticle, LivingBirdArtworkProps } from '../types/livingCard';
import {
  calculateBreathingOffset,
  calculateFeatherSheen,
  calculateLayerOffset,
  calculateSheenGeometry,
  stepParticles,
} from '../utils/livingCardPhysics';

// Try to safely import Skia components for GPU rendering
let SkiaComponents: {
  Canvas: any;
  Group: any;
  Circle: any;
  Path: any;
  Fill: any;
  Skia: any;
} | null = null;

try {
  const skia = require('@shopify/react-native-skia');
  if (skia && skia.Canvas) {
    SkiaComponents = {
      Canvas: skia.Canvas,
      Group: skia.Group,
      Circle: skia.Circle,
      Path: skia.Path,
      Fill: skia.Fill,
      Skia: skia.Skia,
    };
  }
} catch {
  // Graceful fallback to pure React Native animated layers
  SkiaComponents = null;
}

// Safely check if Skia is ready and supported in the current environment
const isSkiaAvailable =
  Platform.OS !== 'web'
    ? Boolean(SkiaComponents?.Canvas)
    : Boolean(
      typeof window !== 'undefined' &&
      (window as any).CanvasKit &&
      SkiaComponents?.Canvas
    );

export function LivingBirdArtwork({
  bird,
  isPlaying = false,
  width = 76,
  height = 76,
  disabled = false,
  onPress,
}: LivingBirdArtworkProps) {
  const primaryHabitat = bird.habitats?.[0] || 'forest';
  const habitatTheme = HABITAT_THEME[primaryHabitat] || HABITAT_THEME.forest;

  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    return getCachedBirdPhoto(bird.id)?.thumbUrl ?? null;
  });

  // Resolve photo if not yet cached
  useEffect(() => {
    let isMounted = true;
    const cached = getCachedBirdPhoto(bird.id);
    if (cached) {
      setPhotoUrl(cached.thumbUrl);
      return;
    }
    resolveBirdPhoto(bird).then((res) => {
      if (isMounted && res) {
        setPhotoUrl(res.thumbUrl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [bird]);

  // Unified orientation and touch pan motion
  const { motion, reduceMotion, touchHandlers } = useBirdMotion({
    disabled,
    enableIdleSway: true,
  });

  const [particles, setParticles] = useState<HabitatParticle[]>([]);
  const [breathing, setBreathing] = useState({ scaleY: 1.0, offsetY: 0 });
  const [sheen, setSheen] = useState({ sweepProgress: 0, intensity: 0.22 });
  const [appActive, setAppActive] = useState(true);

  // Pause simulation when app is in background
  useEffect(() => {
    const handleAppState = (status: AppStateStatus) => {
      setAppActive(status === 'active');
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Frame loop for particles, breathing oscillation, and feather sheen reflection
  useEffect(() => {
    if (disabled || reduceMotion || !appActive) return;

    let animId: number;
    let startTime = Date.now();

    const loop = () => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const breathingAmplitude = Math.max(0.6, Math.min(1.8, width * 0.012));
      setBreathing(calculateBreathingOffset(elapsedSec, 0.28, breathingAmplitude));
      setSheen(calculateFeatherSheen(elapsedSec, motion.tiltX, motion.tiltY));

      setParticles((prev) =>
        stepParticles(prev, width, height, primaryHabitat, isPlaying, 12)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [disabled, reduceMotion, appActive, width, height, primaryHabitat, isPlaying, motion.tiltX, motion.tiltY]);

  // Proportional subtle parallax offset (delicate 2.5D optical micro-shift)
  const maxParallax = useMemo(
    () => Math.max(3, Math.min(7, Math.round(width * 0.03))),
    [width]
  );

  const bgOffset = useMemo(
      () => (reduceMotion ? { x: 0, y: 0 } : calculateLayerOffset(motion.tiltX, motion.tiltY, 0.3, maxParallax)),
        [motion.tiltX, motion.tiltY, reduceMotion, maxParallax]
  );

  const subjectOffset = useMemo(
      () => (reduceMotion ? { x: 0, y: 0 } : calculateLayerOffset(motion.tiltX, motion.tiltY, 0.6, maxParallax)),
        [motion.tiltX, motion.tiltY, reduceMotion, maxParallax]
  );

  const particleOffset = useMemo(
      () => (reduceMotion ? { x: 0, y: 0 } : calculateLayerOffset(motion.tiltX, motion.tiltY, 1.35, maxParallax)),
        [motion.tiltX, motion.tiltY, reduceMotion, maxParallax]
  );

  const sheenGeometry = useMemo(() => calculateSheenGeometry(width, height), [width, height]);

  // Minimal overscan (only 4-8px) to eliminate border gaps with virtually zero crop/zoom
  const overscan = Math.max(4, Math.min(8, Math.round(width * 0.03 + 2)));
  const imageWidth = width + overscan * 2;
  const imageHeight = height + overscan * 2;

  // PanResponder to capture touch-drag tilts smoothly
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => touchHandlers.onTouchStart(),
        onPanResponderMove: (e) => touchHandlers.onTouchMove(e, width, height),
        onPanResponderRelease: () => {
          touchHandlers.onTouchEnd();
          if (onPress) onPress();
        },
        onPanResponderTerminate: () => touchHandlers.onTouchEnd(),
      }),
    [touchHandlers, width, height, onPress]
  );

  return (
    <View
      style={[
        styles.cardContainer,
        {
          width,
          height,
          backgroundColor: habitatTheme.bg,
          borderColor: habitatTheme.border,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Layer 0: Background Habitat Watercolor Wash */}
      <View
        style={[
          styles.layerBackground,
          {
            backgroundColor: habitatTheme.bg,
            transform: [
              { translateX: bgOffset.x },
              { translateY: bgOffset.y },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.watercolorWashDroplet,
            { backgroundColor: habitatTheme.wash, opacity: 0.18 },
          ]}
        />
      </View>

      {/* Layer 1: Subject Bird with Living Breathing Oscillation */}
      <View
        style={[
          styles.layerSubject,
          {
            transform: [
              { translateX: subjectOffset.x },
              { translateY: subjectOffset.y + (reduceMotion ? 0 : breathing.offsetY) },
              { scaleY: reduceMotion ? 1.0 : breathing.scaleY },
            ],
          },
        ]}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl, cache: 'force-cache' }}
            style={[styles.birdImage, { width: imageWidth, height: imageHeight }]}
            resizeMode="cover"
            accessibilityLabel={`Foto viva de ${bird.name_pt}`}
          />
        ) : (
          <View style={[styles.placeholderBox, { backgroundColor: habitatTheme.bg }]} />
        )}

        {/* Subtle Specular Feather Sheen (Reflexo de luz solar localizado nas penas) */}
        {!reduceMotion && (
          <View
            style={[
              styles.featherSheenOverlay,
              {
                transform: [
                  { rotate: '-25deg' },
                  {
                    translateX: sheen.sweepProgress * (width * 0.22),
                  },
                  {
                    translateY: sheen.sweepProgress * (height * 0.12),
                  },
                ],
                opacity: sheen.intensity,
              },
            ]}
            pointerEvents="none"
          >
            <View
              style={[
                styles.sheenLayerCentered,
                {
                  width: sheenGeometry.layers.outer.width,
                  height: sheenGeometry.layers.outer.height,
                  borderRadius: sheenGeometry.layers.outer.borderRadius,
                  backgroundColor: sheenGeometry.layers.outer.backgroundColor,
                },
              ]}
            >
              <View
                style={[
                  styles.sheenLayerCentered,
                  {
                    width: sheenGeometry.layers.mid.width,
                    height: sheenGeometry.layers.mid.height,
                    borderRadius: sheenGeometry.layers.mid.borderRadius,
                    backgroundColor: sheenGeometry.layers.mid.backgroundColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.sheenLayerCentered,
                    {
                      width: sheenGeometry.layers.halo.width,
                      height: sheenGeometry.layers.halo.height,
                      borderRadius: sheenGeometry.layers.halo.borderRadius,
                      backgroundColor: sheenGeometry.layers.halo.backgroundColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sheenLayerCentered,
                      {
                        width: sheenGeometry.layers.core.width,
                        height: sheenGeometry.layers.core.height,
                        borderRadius: sheenGeometry.layers.core.borderRadius,
                        backgroundColor: sheenGeometry.layers.core.backgroundColor,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.sheenLayerCentered,
                        {
                          width: sheenGeometry.layers.glint.width,
                          height: sheenGeometry.layers.glint.height,
                          borderRadius: sheenGeometry.layers.glint.borderRadius,
                          backgroundColor: sheenGeometry.layers.glint.backgroundColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Layer 2: GPU/Vector Atmospheric Particles (Skia or View Fallback) */}
      {!reduceMotion && (
        <View
          style={[
            styles.layerParticles,
            {
              transform: [
                { translateX: particleOffset.x },
                { translateY: particleOffset.y },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {isSkiaAvailable && SkiaComponents?.Canvas ? (
            <SkiaComponents.Canvas style={{ width, height }}>
              <SkiaComponents.Group>
                {particles.map((p) => (
                  <SkiaComponents.Circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={p.size / 2}
                    color={p.color}
                    opacity={p.opacity}
                  />
                ))}
              </SkiaComponents.Group>
            </SkiaComponents.Canvas>
          ) : (
            particles.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.particleFallback,
                  {
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.kind === 'leaf' ? p.size * 1.5 : p.size,
                    borderRadius: p.kind === 'leaf' ? p.size * 0.4 : p.size / 2,
                    backgroundColor: p.color,
                    opacity: p.opacity,
                    transform: [{ rotate: `${p.rotation}rad` }],
                  },
                ]}
              />
            ))
          )}
        </View>
      )}

      {/* Layer 3: Subtle Optical Vignette Highlight */}
      <View style={styles.layerVignette} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerBackground: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watercolorWashDroplet: {
    width: '120%',
    height: '120%',
    borderRadius: 100,
  },
  layerSubject: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  birdImage: {
    position: 'absolute',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
  },
  layerParticles: {
    ...StyleSheet.absoluteFill,
  },
  particleFallback: {
    position: 'absolute',
  },
  layerVignette: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 12,
  },
  featherSheenOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        filter: 'blur(8px)',
        mixBlendMode: 'soft-light',
      },
    }),
  },
  sheenLayerCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

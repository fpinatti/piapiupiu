import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, GestureResponderEvent, Platform } from 'react-native';
import { MotionSensorState } from '../types/livingCard';

export interface UseBirdMotionOptions {
  disabled?: boolean;
  enableIdleSway?: boolean;
}

export function useBirdMotion({
  disabled = false,
  enableIdleSway = true,
}: UseBirdMotionOptions = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [motion, setMotion] = useState<MotionSensorState>({
    tiltX: 0,
    tiltY: 0,
    source: 'idle',
    isActive: false,
  });

  const isTouchingRef = useRef(false);
  const touchOffsetRef = useRef({ x: 0, y: 0 });
  const idleStartTimeRef = useRef(Date.now());

  // Listen to OS-level accessibility reduced motion setting
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      subscription?.remove();
    };
  }, []);

  // Hardware Gyroscope / DeviceMotion subscription on native
  useEffect(() => {
    if (disabled || reduceMotion || Platform.OS === 'web') return;

    let isMounted = true;
    let sensorSubscription: { remove: () => void } | null = null;

    async function startSensors() {
      try {
        const { DeviceMotion } = await import('expo-sensors');
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (!isAvailable || !isMounted) return;

        DeviceMotion.setUpdateInterval(50); // ~20Hz update rate, efficient on battery
        sensorSubscription = DeviceMotion.addListener((data) => {
          if (!isMounted || isTouchingRef.current) return;

          if (data && data.rotation) {
            // gamma: left-to-right tilt in radians (-pi to pi)
            // beta: front-to-back tilt in radians (-pi to pi)
            const gamma = data.rotation.gamma ?? 0;
            const beta = data.rotation.beta ?? 0;

            // Normalize radians (approx +/- 30 degrees = +/- 0.5 rad to +/- 1.0)
            const normX = Math.max(-1.0, Math.min(1.0, gamma / 0.5));
            const normY = Math.max(-1.0, Math.min(1.0, beta / 0.5));

            const isMoving = Math.abs(normX) > 0.05 || Math.abs(normY) > 0.05;

            setMotion({
              tiltX: normX,
              tiltY: normY,
              source: 'gyroscope',
              isActive: isMoving,
            });
          }
        });
      } catch {
        // Gyroscope not available or denied; fallback silently
      }
    }

    startSensors();

    return () => {
      isMounted = false;
      sensorSubscription?.remove();
    };
  }, [disabled, reduceMotion]);

  // Autonomous harmonic idle sway when touch and gyroscope are idle
  useEffect(() => {
    if (disabled || reduceMotion || !enableIdleSway) {
      setMotion({ tiltX: 0, tiltY: 0, source: 'idle', isActive: false });
      return;
    }

    const interval = setInterval(() => {
      if (isTouchingRef.current) return;

      const elapsedSec = (Date.now() - idleStartTimeRef.current) / 1000;
      // Gentle harmonic oscillation with period ~4.5s
      const swayX = Math.sin(elapsedSec * 1.4) * 0.16;
      const swayY = Math.cos(elapsedSec * 1.1) * 0.12;

      setMotion((prev) => {
        // If gyroscope is actively controlling motion, don't override
        if (prev.source === 'gyroscope' && prev.isActive) {
          return prev;
        }
        return {
          tiltX: swayX,
          tiltY: swayY,
          source: 'idle',
          isActive: false,
        };
      });
    }, 60);

    return () => clearInterval(interval);
  }, [disabled, reduceMotion, enableIdleSway]);

  // Touch handlers for interactive drag
  const onTouchStart = useCallback(() => {
    isTouchingRef.current = true;
  }, []);

  const onTouchMove = useCallback((e: GestureResponderEvent, cardWidth = 200, cardHeight = 260) => {
    if (disabled || reduceMotion) return;
    isTouchingRef.current = true;

    const { locationX, locationY } = e.nativeEvent;
    const centerX = cardWidth / 2;
    const centerY = cardHeight / 2;

    const normX = Math.max(-1.0, Math.min(1.0, (locationX - centerX) / centerX));
    const normY = Math.max(-1.0, Math.min(1.0, (locationY - centerY) / centerY));

    touchOffsetRef.current = { x: normX, y: normY };

    setMotion({
      tiltX: normX,
      tiltY: normY,
      source: 'touch',
      isActive: true,
    });
  }, [disabled, reduceMotion]);

  const onTouchEnd = useCallback(() => {
    isTouchingRef.current = false;
    idleStartTimeRef.current = Date.now();
  }, []);

  return {
    motion: reduceMotion ? { tiltX: 0, tiltY: 0, source: 'idle' as const, isActive: false } : motion,
    reduceMotion,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}


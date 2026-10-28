import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, HABITAT_THEME } from '../theme/tokens';
import { HabitatType } from '../types/bird';

export type WatercolorIconType =
  | 'forest'
  | 'grassland'
  | 'wetland'
  | 'feather'
  | 'audio'
  | 'egg'
  | 'camera'
  | 'wingspan';

export interface WatercolorIconProps {
  type: WatercolorIconType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 1 | 2 | 3;
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Visual dimensions by size step
const DIMENSIONS = {
  sm: { container: 24, iconSize: 12 },
  md: { container: 32, iconSize: 16 },
  lg: { container: 42, iconSize: 22 },
} as const;

// Asymmetric organic radii matching natural watercolor droplet splatters
const BLOB_RADII = {
  1: {
    borderTopLeftRadius: 0.62,
    borderTopRightRadius: 0.38,
    borderBottomRightRadius: 0.58,
    borderBottomLeftRadius: 0.42,
  },
  2: {
    borderTopLeftRadius: 0.40,
    borderTopRightRadius: 0.65,
    borderBottomRightRadius: 0.38,
    borderBottomLeftRadius: 0.60,
  },
  3: {
    borderTopLeftRadius: 0.55,
    borderTopRightRadius: 0.45,
    borderBottomRightRadius: 0.68,
    borderBottomLeftRadius: 0.35,
  },
} as const;

// Palette definitions per icon type (using authentic Wingspan watercolor washes)
const PALETTES: Record<
  WatercolorIconType,
  { bg: string; border: string; ink: string; halo: string }
> = {
  forest: {
    bg: HABITAT_THEME.forest.bg,
    border: HABITAT_THEME.forest.border,
    ink: HABITAT_THEME.forest.text,
    halo: 'rgba(62, 107, 79, 0.16)',
  },
  grassland: {
    bg: HABITAT_THEME.grassland.bg,
    border: HABITAT_THEME.grassland.border,
    ink: HABITAT_THEME.grassland.text,
    halo: 'rgba(201, 151, 56, 0.18)',
  },
  wetland: {
    bg: HABITAT_THEME.wetland.bg,
    border: HABITAT_THEME.wetland.border,
    ink: HABITAT_THEME.wetland.text,
    halo: 'rgba(44, 123, 158, 0.16)',
  },
  feather: {
    bg: '#EBE2CF',
    border: '#D0C2A5',
    ink: '#3D3326',
    halo: 'rgba(120, 100, 75, 0.14)',
  },
  audio: {
    bg: '#EAF3ED',
    border: '#A5CFB5',
    ink: '#1C452C',
    halo: 'rgba(45, 106, 79, 0.20)',
  },
  egg: {
    bg: '#E4ECF4',
    border: '#B2CDDC',
    ink: '#2A5C75',
    halo: 'rgba(70, 130, 180, 0.15)',
  },
  camera: {
    bg: '#F0ECE1',
    border: '#D5CCBA',
    ink: '#202B24',
    halo: 'rgba(32, 43, 36, 0.12)',
  },
  wingspan: {
    bg: '#FAF1DC',
    border: '#E8CB82',
    ink: '#5B400D',
    halo: 'rgba(200, 170, 110, 0.18)',
  },
};

export function WatercolorIcon({
  type,
  size = 'md',
  variant = 1,
  pulse = false,
  style,
}: WatercolorIconProps) {
  const animScale = useRef(new Animated.Value(1)).current;
  const { container, iconSize } = DIMENSIONS[size];
  const palette = PALETTES[type] || PALETTES.feather;
  const radiiScale = BLOB_RADII[variant] || BLOB_RADII[1];

  const tl = Math.round(container * radiiScale.borderTopLeftRadius);
  const tr = Math.round(container * radiiScale.borderTopRightRadius);
  const br = Math.round(container * radiiScale.borderBottomRightRadius);
  const bl = Math.round(container * radiiScale.borderBottomLeftRadius);

  useEffect(() => {
    if (!pulse) {
      animScale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animScale, {
          toValue: 1.10,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animScale, {
          toValue: 1.0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, animScale]);

  const renderGlyph = () => {
    switch (type) {
      case 'forest':
        return <MaterialCommunityIcons name="pine-tree" size={iconSize} color={palette.ink} />;
      case 'grassland':
        return <MaterialCommunityIcons name="barley" size={iconSize} color={palette.ink} />;
      case 'wetland':
        return <MaterialCommunityIcons name="water" size={iconSize} color={palette.ink} />;
      case 'audio':
        return <Feather name="volume-2" size={iconSize} color={palette.ink} />;
      case 'egg':
        return <MaterialCommunityIcons name="egg" size={iconSize} color={palette.ink} />;
      case 'camera':
        return <Feather name="camera" size={iconSize} color={palette.ink} />;
      case 'wingspan':
        return <MaterialCommunityIcons name="arrow-expand-horizontal" size={iconSize} color={palette.ink} />;
      case 'feather':
      default:
        return <Feather name="feather" size={iconSize} color={palette.ink} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: container,
          height: container,
          transform: [{ scale: animScale }],
        },
        style,
      ]}
      pointerEvents="none"
    >
      {/* Outer Watercolor Diffusion Halo */}
      <View
        style={[
          styles.halo,
          {
            backgroundColor: palette.halo,
            borderTopLeftRadius: tl + 2,
            borderTopRightRadius: tr + 2,
            borderBottomRightRadius: br + 2,
            borderBottomLeftRadius: bl + 2,
          },
        ]}
      />

      {/* Core Watercolor Puddle with Pigment Pooling Border */}
      <View
        style={[
          styles.puddle,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            borderTopLeftRadius: tl,
            borderTopRightRadius: tr,
            borderBottomRightRadius: br,
            borderBottomLeftRadius: bl,
          },
        ]}
      >
        {renderGlyph()}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    ...StyleSheet.absoluteFill,
    margin: -1.5,
  },
  puddle: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

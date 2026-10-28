import React from 'react';
import {
  AccessibilityRole,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';

export type BlobVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'brass';
export type BlobShape = 'pill' | 'pebble';

export interface WatercolorBlobButtonProps {
  onPress: () => void;
  title?: string;
  icon?: React.ReactNode;
  variant?: BlobVariant;
  shape?: BlobShape;
  shapeVariant?: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  activeOpacity?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

// Organic asymmetric border radii definitions for natural watercolor puddles
const SHAPES = {
  pill: {
    1: {
      outer: { borderTopLeftRadius: 36, borderTopRightRadius: 20, borderBottomRightRadius: 32, borderBottomLeftRadius: 22 },
      inner: { borderTopLeftRadius: 28, borderTopRightRadius: 15, borderBottomRightRadius: 24, borderBottomLeftRadius: 16 },
    },
    2: {
      outer: { borderTopLeftRadius: 22, borderTopRightRadius: 38, borderBottomRightRadius: 18, borderBottomLeftRadius: 32 },
      inner: { borderTopLeftRadius: 16, borderTopRightRadius: 30, borderBottomRightRadius: 13, borderBottomLeftRadius: 24 },
    },
    3: {
      outer: { borderTopLeftRadius: 32, borderTopRightRadius: 26, borderBottomRightRadius: 38, borderBottomLeftRadius: 18 },
      inner: { borderTopLeftRadius: 24, borderTopRightRadius: 19, borderBottomRightRadius: 30, borderBottomLeftRadius: 13 },
    },
  },
  pebble: {
    1: {
      outer: { borderTopLeftRadius: 28, borderTopRightRadius: 20, borderBottomRightRadius: 26, borderBottomLeftRadius: 22 },
      inner: { borderTopLeftRadius: 22, borderTopRightRadius: 15, borderBottomRightRadius: 20, borderBottomLeftRadius: 16 },
    },
    2: {
      outer: { borderTopLeftRadius: 20, borderTopRightRadius: 29, borderBottomRightRadius: 18, borderBottomLeftRadius: 26 },
      inner: { borderTopLeftRadius: 15, borderTopRightRadius: 22, borderBottomRightRadius: 13, borderBottomLeftRadius: 20 },
    },
    3: {
      outer: { borderTopLeftRadius: 26, borderTopRightRadius: 21, borderBottomRightRadius: 29, borderBottomLeftRadius: 17 },
      inner: { borderTopLeftRadius: 20, borderTopRightRadius: 16, borderBottomRightRadius: 22, borderBottomLeftRadius: 12 },
    },
  },
} as const;

// Two-level watercolor palette: soft translucent halo wash + rich pigment core puddle
const PALETTES: Record<
  BlobVariant,
  { halo: string; coreBg: string; coreBorder: string; text: string }
> = {
  primary: {
    halo: 'rgba(45, 106, 79, 0.20)',
    coreBg: colors.primary,
    coreBorder: colors.primaryBorder,
    text: colors.onPrimary,
  },
  secondary: {
    halo: 'rgba(180, 160, 130, 0.22)',
    coreBg: colors.surfaceElevated,
    coreBorder: colors.border,
    text: colors.textPrimary,
  },
  danger: {
    halo: 'rgba(185, 40, 40, 0.18)',
    coreBg: colors.dangerSurface,
    coreBorder: colors.dangerBorder,
    text: colors.onDanger,
  },
  warning: {
    halo: 'rgba(201, 151, 56, 0.22)',
    coreBg: colors.warningSurface,
    coreBorder: colors.warningBorder,
    text: colors.onWarning,
  },
  brass: {
    halo: 'rgba(200, 170, 110, 0.24)',
    coreBg: colors.brass,
    coreBorder: colors.brassDark,
    text: '#FFFFFF',
  },
};

const SIZES = {
  sm: { minHeight: 38, paddingH: 14, paddingV: 7, fontSize: typeScale.caption, gap: 6 },
  md: { minHeight: MIN_TOUCH_TARGET, paddingH: 22, paddingV: 11, fontSize: typeScale.body, gap: 8 },
  lg: { minHeight: 56, paddingH: 30, paddingV: 15, fontSize: typeScale.title, gap: 10 },
} as const;

export function WatercolorBlobButton({
  onPress,
  title,
  icon,
  variant = 'primary',
  shape = 'pill',
  shapeVariant = 1,
  size = 'md',
  disabled = false,
  activeOpacity = 0.82,
  accessibilityRole = 'button',
  accessibilityLabel,
  style,
  contentStyle,
  textStyle,
  children,
}: WatercolorBlobButtonProps) {
  const palette = PALETTES[variant];
  const sizeConfig = SIZES[size];
  const radii = SHAPES[shape][shapeVariant] || SHAPES[shape][1];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      style={[styles.touchWrapper, { opacity: disabled ? 0.6 : 1 }, style]}
    >
      {/* Level 1: Outer Translucent Watercolor Halo Wash */}
      <View
        style={[
          styles.outerHalo,
          radii.outer,
          { backgroundColor: palette.halo },
        ]}
      />

      {/* Level 2: Inner Core Pigment Puddle with Meniscus Border */}
      <View
        style={[
          styles.innerCore,
          radii.inner,
          {
            backgroundColor: palette.coreBg,
            borderColor: palette.coreBorder,
            minHeight: sizeConfig.minHeight,
            paddingHorizontal: sizeConfig.paddingH,
            paddingVertical: sizeConfig.paddingV,
            gap: sizeConfig.gap,
          },
          contentStyle,
        ]}
      >
        {icon}
        {title ? (
          <Text
            style={[
              styles.labelText,
              {
                color: palette.text,
                fontSize: sizeConfig.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    ...StyleSheet.absoluteFill,
    margin: -4,
  },
  innerCore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  labelText: {
    fontWeight: '700',
    fontFamily: fonts.sans,
    letterSpacing: 0.25,
  },
});

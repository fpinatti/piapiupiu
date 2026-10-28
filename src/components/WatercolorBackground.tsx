import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface WatercolorBackgroundProps {
  /** Optional variant: 'full' includes watermarks, 'subtle' only soft washes */
  variant?: 'full' | 'subtle';
}

/**
 * Authentic Wingspan Board Game Watercolor Landscape Backdrop.
 * Layers soft watercolor washes of the 3 habitats (Forest top-left, Grassland mid-right, Wetland bottom-left)
 * with faint botanical watermarks, giving the warm linen paper organic life without competing with foreground UI.
 */
export function WatercolorBackground({ variant = 'full' }: WatercolorBackgroundProps) {
  return (
    <View style={styles.container} pointerEvents="none" aria-hidden={true}>
      {/* Habitat 1: Forest (Floresta) - Soft Sage Wash Top-Left */}
      <View style={[styles.wash, styles.forestWashOuter]} />
      <View style={[styles.wash, styles.forestWashInner]} />
      {variant === 'full' && (
        <View style={styles.forestWatermark}>
          <MaterialCommunityIcons
            name="pine-tree"
            size={110}
            color="rgba(45, 106, 79, 0.045)"
          />
        </View>
      )}

      {/* Habitat 2: Grassland (Campo) - Warm Amber Wheat Wash Mid-Right */}
      <View style={[styles.wash, styles.grasslandWashOuter]} />
      <View style={[styles.wash, styles.grasslandWashInner]} />
      {variant === 'full' && (
        <View style={styles.grasslandWatermark}>
          <MaterialCommunityIcons
            name="barley"
            size={120}
            color="rgba(168, 123, 30, 0.045)"
          />
        </View>
      )}

      {/* Habitat 3: Wetland (Pântano) - Soft Aquatic Cerulean Wash Bottom-Left */}
      <View style={[styles.wash, styles.wetlandWashOuter]} />
      <View style={[styles.wash, styles.wetlandWashInner]} />
      {variant === 'full' && (
        <View style={styles.wetlandWatermark}>
          <MaterialCommunityIcons
            name="waves"
            size={105}
            color="rgba(30, 101, 130, 0.045)"
          />
        </View>
      )}

      {/* Subtle Central Feather Quill Watermark */}
      {variant === 'full' && (
        <View style={styles.centralWatermark}>
          <Feather
            name="feather"
            size={135}
            color="rgba(60, 50, 40, 0.035)"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 0,
  },
  wash: {
    position: 'absolute',
  },

  // Forest Washes (Top-Left)
  forestWashOuter: {
    width: 320,
    height: 240,
    top: -50,
    left: -60,
    backgroundColor: 'rgba(62, 107, 79, 0.08)',
    borderTopLeftRadius: 140,
    borderTopRightRadius: 210,
    borderBottomRightRadius: 160,
    borderBottomLeftRadius: 110,
  },
  forestWashInner: {
    width: 210,
    height: 150,
    top: -10,
    left: -20,
    backgroundColor: 'rgba(45, 106, 79, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 140,
    borderBottomRightRadius: 90,
    borderBottomLeftRadius: 120,
  },
  forestWatermark: {
    position: 'absolute',
    top: 15,
    left: 20,
    transform: [{ rotate: '-18deg' }],
  },

  // Grassland Washes (Mid-Right)
  grasslandWashOuter: {
    width: 290,
    height: 270,
    top: '32%',
    right: -70,
    backgroundColor: 'rgba(201, 151, 56, 0.075)',
    borderTopLeftRadius: 170,
    borderTopRightRadius: 110,
    borderBottomRightRadius: 150,
    borderBottomLeftRadius: 190,
  },
  grasslandWashInner: {
    width: 180,
    height: 170,
    top: '36%',
    right: -20,
    backgroundColor: 'rgba(168, 123, 30, 0.05)',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 80,
    borderBottomRightRadius: 110,
    borderBottomLeftRadius: 130,
  },
  grasslandWatermark: {
    position: 'absolute',
    top: '38%',
    right: 15,
    transform: [{ rotate: '22deg' }],
  },

  // Wetland Washes (Bottom-Left)
  wetlandWashOuter: {
    width: 330,
    height: 280,
    bottom: -60,
    left: -70,
    backgroundColor: 'rgba(44, 123, 158, 0.08)',
    borderTopLeftRadius: 180,
    borderTopRightRadius: 140,
    borderBottomRightRadius: 100,
    borderBottomLeftRadius: 160,
  },
  wetlandWashInner: {
    width: 200,
    height: 180,
    bottom: -10,
    left: -10,
    backgroundColor: 'rgba(30, 101, 130, 0.05)',
    borderTopLeftRadius: 130,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 80,
    borderBottomLeftRadius: 120,
  },
  wetlandWatermark: {
    position: 'absolute',
    bottom: 45,
    left: 25,
    transform: [{ rotate: '-10deg' }],
  },

  // Central Watermark
  centralWatermark: {
    position: 'absolute',
    top: '24%',
    left: '26%',
    transform: [{ rotate: '-26deg' }],
  },
});

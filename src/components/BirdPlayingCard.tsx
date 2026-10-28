import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  colors,
  EXPANSION_THEME,
  fonts,
  HABITAT_THEME,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from '../theme/tokens';
import { BirdCard } from '../types/bird';
import { BirdPhoto } from './BirdPhoto';

interface BirdPlayingCardProps {
  bird: BirdCard;
  isPlaying: boolean;
  score?: number;
  matchedText?: string;
  cooldownActive?: boolean;
  onTogglePlay: (bird: BirdCard) => void;
  onDismiss?: () => void;
}

export function BirdPlayingCard({
  bird,
  isPlaying,
  matchedText,
  cooldownActive = false,
  onTogglePlay,
  onDismiss,
}: BirdPlayingCardProps) {
  const expansionInfo = EXPANSION_THEME[bird.expansion];
  const primaryHabitat = bird.habitats?.[0];
  const primaryHabTheme = primaryHabitat
    ? HABITAT_THEME[primaryHabitat]
    : undefined;

  return (
    <View style={styles.cardContainer}>
      {/* Authentic Wingspan Watercolor Header Ribbon */}
      <View
        style={[
          styles.cardHeaderRibbon,
          primaryHabTheme && {
            backgroundColor: primaryHabTheme.bg,
            borderBottomColor: primaryHabTheme.border,
          },
        ]}
      >
        <View style={styles.badgesRow}>
          {expansionInfo && (
            <View
              style={[
                styles.expansionBadge,
                {
                  backgroundColor: expansionInfo.bg,
                  borderColor: expansionInfo.border,
                },
              ]}
            >
              <Text
                style={[styles.expansionText, { color: expansionInfo.text }]}
              >
                {expansionInfo.label}
              </Text>
            </View>
          )}

          {bird.habitats?.map((h) => {
            const hab = HABITAT_THEME[h];
            if (!hab) return null;
            return (
              <View
                key={h}
                style={[
                  styles.habitatBadge,
                  { backgroundColor: hab.bg, borderColor: hab.border },
                ]}
              >
                <Text style={[styles.habitatText, { color: hab.text }]}>
                  {hab.label}
                </Text>
              </View>
            );
          })}

          <View style={styles.statusBadge}>
            <Feather
              name={cooldownActive ? 'clock' : 'check-circle'}
              size={11}
              color={colors.textTaxonomic}
            />
            <Text style={styles.statusBadgeText}>
              {cooldownActive ? 'Recente' : 'Identificada'}
            </Text>
          </View>
        </View>

        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar card da ave"
          >
            <Feather name="x" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Card Body (Linen Texture Surface) */}
      <View style={styles.cardBody}>
        <View style={styles.mainRow}>
          <View style={styles.photoFrame}>
            <BirdPhoto bird={bird} variant="hero" enableZoom />
          </View>

          <View style={styles.namesColumn}>
            <Text style={styles.namePt}>{bird.name_pt}</Text>
            <Text style={styles.nameEn}>
              {bird.name_en} •{' '}
              <Text style={styles.scientific}>{bird.scientific}</Text>
            </Text>
            {matchedText ? (
              <Text style={styles.ocrSourceText} numberOfLines={1}>
                Lido na carta: &ldquo;{matchedText}&rdquo;
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => onTogglePlay(bird)}
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              isPlaying
                ? `Parar canto de ${bird.name_pt}`
                : `Ouvir canto de ${bird.name_pt}`
            }
          >
            <Feather
              name={isPlaying ? 'square' : 'volume-2'}
              size={18}
              color={isPlaying ? colors.onDanger : colors.onPrimary}
            />
            <Text
              style={[
                styles.playButtonLabel,
                isPlaying && { color: colors.onDanger },
              ]}
            >
              {isPlaying ? 'Parar' : 'Ouvir'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHeaderRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    flex: 1,
  },
  expansionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  expansionText: {
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  habitatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  habitatText: {
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statusBadgeText: {
    color: colors.textTaxonomic,
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  closeBtn: {
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    marginLeft: 6,
  },
  cardBody: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  photoFrame: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  namesColumn: {
    flex: 1,
  },
  namePt: {
    fontFamily: fonts.serif,
    color: colors.textPrimary,
    fontSize: typeScale.display,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  nameEn: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: typeScale.label,
    marginTop: 3,
  },
  scientific: {
    fontStyle: 'italic',
    color: colors.textTaxonomic,
  },
  ocrSourceText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  playButton: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 96,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#173627',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  playButtonActive: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  playButtonLabel: {
    color: colors.onPrimary,
    fontSize: typeScale.label,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

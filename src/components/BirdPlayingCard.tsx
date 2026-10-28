import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  colors,
  EXPANSION_THEME,
  HABITAT_THEME,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from '../theme/tokens';
import { BirdCard } from '../types/bird';

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

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
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
              <Text style={[styles.expansionText, { color: expansionInfo.text }]}>
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
              size={12}
              color={colors.textTaxonomic}
            />
            <Text style={styles.statusBadgeText}>
              {cooldownActive ? 'Leitura recente' : 'Carta reconhecida'}
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
            <Feather name="x" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainRow}>
        <View style={styles.namesColumn}>
          <Text style={styles.namePt}>{bird.name_pt}</Text>
          <Text style={styles.nameEn}>
            {bird.name_en} •{' '}
            <Text style={styles.scientific}>{bird.scientific}</Text>
          </Text>
          {matchedText ? (
            <Text style={styles.ocrSourceText} numberOfLines={1}>
              Lido no topo da carta: &ldquo;{matchedText}&rdquo;
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => onTogglePlay(bird)}
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          activeOpacity={0.8}
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  expansionText: {
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  habitatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  habitatText: {
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: colors.textTaxonomic,
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  namesColumn: {
    flex: 1,
  },
  namePt: {
    color: colors.textPrimary,
    fontSize: typeScale.display,
    fontWeight: '800',
  },
  nameEn: {
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
    fontSize: typeScale.caption,
    marginTop: 5,
  },
  playButton: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 108,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playButtonActive: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  playButtonLabel: {
    color: colors.onPrimary,
    fontSize: typeScale.label,
    fontWeight: '800',
  },
});

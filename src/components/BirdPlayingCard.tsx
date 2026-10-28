import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BirdCard } from '../types/bird';
import { EXPANSION_META } from './FilterBar';

interface BirdPlayingCardProps {
  bird: BirdCard;
  isPlaying: boolean;
  score?: number;
  matchedText?: string;
  onTogglePlay: (bird: BirdCard) => void;
  onDismiss?: () => void;
}

const HABITAT_LABELS: Record<string, string> = {
  forest: 'Floresta',
  grassland: 'Campo',
  wetland: 'Água',
};

export function BirdPlayingCard({
  bird,
  isPlaying,
  score,
  matchedText,
  onTogglePlay,
  onDismiss,
}: BirdPlayingCardProps) {
  const expansionInfo = EXPANSION_META.find((e) => e.id === bird.expansion);
  const confidencePct =
    score !== undefined ? Math.max(1, Math.round((1 - score) * 100)) : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgesRow}>
          {expansionInfo && (
            <View
              style={[
                styles.expansionBadge,
                {
                  backgroundColor: expansionInfo.color + '28',
                  borderColor: expansionInfo.color,
                },
              ]}
            >
              <Text style={[styles.expansionText, { color: expansionInfo.color }]}>
                {expansionInfo.label.toUpperCase()}
              </Text>
            </View>
          )}
          {bird.habitats?.map((h) => (
            <View key={h} style={styles.habitatBadge}>
              <Text style={styles.habitatText}>{HABITAT_LABELS[h] || h}</Text>
            </View>
          ))}
          {confidencePct !== null && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>OCR {confidencePct}%</Text>
            </View>
          )}
        </View>

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainRow}>
        <View style={styles.namesColumn}>
          <Text style={styles.namePt}>{bird.name_pt}</Text>
          <Text style={styles.nameEn}>
            {bird.name_en} • <Text style={styles.scientific}>{bird.scientific}</Text>
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
        >
          <Text style={styles.playButtonIcon}>{isPlaying ? '■' : '▶'}</Text>
          <Text style={styles.playButtonLabel}>
            {isPlaying ? 'Parar' : 'Ouvir'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  expansionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  expansionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  habitatBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  habitatText: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '600',
  },
  confidenceBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confidenceText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closeBtnText: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  namesColumn: {
    flex: 1,
  },
  namePt: {
    color: '#f9fafb',
    fontSize: 19,
    fontWeight: '800',
  },
  nameEn: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
  scientific: {
    fontStyle: 'italic',
    color: '#6ee7b7',
  },
  ocrSourceText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playButtonActive: {
    backgroundColor: '#ef4444',
  },
  playButtonIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  playButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});


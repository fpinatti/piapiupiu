import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BirdPlayingCard } from '../components/BirdPlayingCard';
import { LiveCameraScanner } from '../components/LiveCameraScanner';
import {
  BirdMatcher,
  DEFAULT_DEBOUNCE_MS,
  shouldTriggerBirdAudio,
} from '../services/birdMatcher';
import {
  colors,
  spacing,
  typeScale,
} from '../theme/tokens';
import {
  BirdCard,
  LastPlayedRecord,
  ScanMatchResult,
} from '../types/bird';

export interface ScannerScreenProps {
  matcher: BirdMatcher;
  activeMatch: ScanMatchResult | null;
  onSelectMatch: (match: ScanMatchResult | null) => void;
  recentBirds: BirdCard[];
  onRecordRecentBird: (bird: BirdCard) => void;
  isPlaying: boolean;
  playingBirdId: string | null;
  onPlayBird: (bird: BirdCard) => void;
  onTogglePlayBird: (bird: BirdCard) => void;
}

export function ScannerScreen({
  matcher,
  activeMatch,
  onSelectMatch,
  recentBirds,
  onRecordRecentBird,
  isPlaying,
  playingBirdId,
  onPlayBird,
  onTogglePlayBird,
}: ScannerScreenProps) {
  const [torchOn, setTorchOn] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [cooldownNotice, setCooldownNotice] = useState(false);
  const [cameraCaps, setCameraCaps] = useState<{
    hasCamera: boolean;
    hasTorch: boolean;
  }>({ hasCamera: false, hasTorch: false });

  const lastPlayedRef = useRef<LastPlayedRecord>({ id: '', time: 0 });

  useEffect(() => {
    if (!cooldownNotice) return;
    const timer = setTimeout(() => setCooldownNotice(false), 2200);
    return () => clearTimeout(timer);
  }, [cooldownNotice]);

  const evaluateCandidateLines = useCallback(
    (lines: string[], bypassDebounce: boolean = false) => {
      if (!lines || lines.length === 0) {
        return;
      }

      const match = matcher.matchBestFromLines(lines);
      if (!match) {
        return;
      }

      const now = Date.now();
      const shouldPlay =
        bypassDebounce ||
        shouldTriggerBirdAudio(
          match.bird.id,
          now,
          lastPlayedRef.current,
          DEFAULT_DEBOUNCE_MS
        );

      if (shouldPlay) {
        setCooldownNotice(false);
        lastPlayedRef.current = { id: match.bird.id, time: now };
        onSelectMatch(match);
        onRecordRecentBird(match.bird);
        onPlayBird(match.bird);
      } else {
        setCooldownNotice(true);
      }
    },
    [matcher, onPlayBird, onRecordRecentBird, onSelectMatch]
  );

  const handleLiveOcrLines = useCallback(
    (lines: string[]) => {
      // Since OCR is triggered deliberately per captured photo, always play the matched bird's sound
      evaluateCandidateLines(lines, true);
    },
    [evaluateCandidateLines]
  );

  const handleReplayRecentBird = (bird: BirdCard) => {
    lastPlayedRef.current = { id: bird.id, time: Date.now() };
    onSelectMatch({
      bird,
      score: 0,
      matchedText: bird.name_pt.toUpperCase(),
      normalizedQuery: bird.name_pt.toLowerCase(),
    });
    onPlayBird(bird);
  };

  return (
    <View style={styles.container}>
      <LiveCameraScanner
        scannerPaused={scannerPaused}
        torchOn={torchOn}
        onOcrLinesDetected={handleLiveOcrLines}
        onCameraCapabilitiesChange={setCameraCaps}
      />

      {/* Hardware Camera Action Bar (only rendered when torch or camera controls apply) */}
      {(cameraCaps.hasTorch || cameraCaps.hasCamera) && (
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.quickActionsRow} pointerEvents="box-none">
            {cameraCaps.hasTorch && (
              <TouchableOpacity
                onPress={() => setTorchOn((prev) => !prev)}
                style={[styles.actionBtn, torchOn && styles.actionBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={
                  torchOn ? 'Desligar lanterna' : 'Ligar lanterna'
                }
              >
                <Feather name="zap" size={15} color={colors.textPrimary} />
                <Text style={styles.actionBtnText}>
                  {torchOn ? 'Luz: ON' : 'Luz'}
                </Text>
              </TouchableOpacity>
            )}

            {cameraCaps.hasCamera && (
              <TouchableOpacity
                onPress={() => setScannerPaused((prev) => !prev)}
                style={[styles.actionBtn, scannerPaused && styles.actionBtnWarn]}
                accessibilityRole="button"
                accessibilityLabel={
                  scannerPaused
                    ? 'Retomar leitura da câmera'
                    : 'Pausar leitura da câmera'
                }
              >
                <Feather
                  name={scannerPaused ? 'play' : 'pause'}
                  size={15}
                  color={scannerPaused ? colors.onWarning : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    scannerPaused && { color: colors.onWarning },
                  ]}
                >
                  {scannerPaused ? 'Pausado' : 'Lendo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Center Virtual Bounding Box (only rendered when camera is active, pointerEvents="none") */}
      <View style={styles.centerOverlay} pointerEvents="none">
        {cameraCaps.hasCamera && (
            <View style={styles.targetWrapper}>
              {/* Label placed OUTSIDE and ABOVE the dotted box */}
              <View style={styles.targetLabelBadge}>
                <Text style={styles.targetLabel}>
                  Posicione o topo da carta aqui
                </Text>
              </View>

                  {/* Dotted Target Box with Translucent Watermark Guide */}
                  <View
                    style={[
                      styles.cardTargetBox,
                      activeMatch && isPlaying && styles.cardTargetBoxActive,
                    ]}
                  >
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />

                    {/* Translucent alignment watermark guide */}
                    <View style={styles.watermarkGuide}>
                      <View style={styles.watermarkHeaderBox}>
                        <Feather
                          name="feather"
                          size={20}
                          color="rgba(255, 255, 255, 0.22)"
                        />
                        <View style={styles.watermarkTextLine} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Bottom Area: Recent Birds Strip and Active Bird Card */}
            <View style={styles.bottomStack} pointerEvents="box-none">
              {recentBirds.length > 0 && (
                <View style={styles.recentBar}>
                  <Text style={styles.recentLabel}>Recentes na mesa:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentChipsRow}
                  >
                    {recentBirds.map((bird) => {
                      const active = isPlaying && playingBirdId === bird.id;
                      return (
                        <TouchableOpacity
                          key={bird.id}
                          onPress={() => handleReplayRecentBird(bird)}
                          style={[
                            styles.recentChip,
                            active && styles.recentChipActive,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Ouvir novamente ${bird.name_pt}`}
                        >
                          <Feather
                            name={active ? 'volume-2' : 'rotate-ccw'}
                            size={13}
                            color={active ? colors.onPrimary : colors.textTaxonomic}
                          />
                          <Text
                            style={[
                              styles.recentChipText,
                              active && { color: colors.onPrimary },
                            ]}
                          >
                            {bird.name_pt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {activeMatch && (
                <View style={styles.bottomCardWrapper}>
                  <BirdPlayingCard
                    bird={activeMatch.bird}
                    isPlaying={isPlaying && playingBirdId === activeMatch.bird.id}
                    score={activeMatch.score}
                    matchedText={activeMatch.matchedText}
                    cooldownActive={cooldownNotice}
                    onTogglePlay={onTogglePlayBird}
                    onDismiss={() => onSelectMatch(null)}
                  />
                </View>
              )}
            </View>
          </View>
        );
}

        const styles = StyleSheet.create({
          container: {
          flex: 1,
        backgroundColor: colors.canvas,
  },
        topOverlay: {
          paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
        zIndex: 10,
  },
        quickActionsRow: {
          flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 8,
  },
        actionBtn: {
          minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surfaceOverlay,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
  },
        actionBtnActive: {
          backgroundColor: colors.primary,
        borderColor: colors.primaryBorder,
  },
        actionBtnWarn: {
          backgroundColor: colors.warningSurface,
        borderColor: colors.warningBorder,
  },
        actionBtnText: {
          color: colors.textPrimary,
        fontSize: typeScale.label,
        fontWeight: '700',
  },
        centerOverlay: {
          flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
  },
          targetWrapper: {
          width: '88%',
        maxWidth: 460,
        alignItems: 'center',
  },
        targetLabelBadge: {
          marginBottom: 12,
  },
        targetLabel: {
          color: colors.textPrimary,
        backgroundColor: colors.surfaceOverlay,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        fontWeight: '700',
        fontSize: typeScale.body,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
  },
        cardTargetBox: {
          width: '100%',
        height: 155,
        borderWidth: 2,
        borderColor: colors.primaryBorder,
        borderStyle: 'dashed',
        borderRadius: 16,
        backgroundColor: 'rgba(45, 106, 79, 0.10)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        position: 'relative',
  },
        cardTargetBoxActive: {
          borderColor: colors.textTaxonomic,
        backgroundColor: 'rgba(82, 183, 136, 0.18)',
  },
        corner: {
          position: 'absolute',
        width: 20,
        height: 20,
        borderColor: colors.primaryBorder,
  },
        cornerTL: {
          top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
  },
        cornerTR: {
          top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
  },
        cornerBL: {
          bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
  },
        cornerBR: {
          bottom: -2,
        right: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
  },
        watermarkGuide: {
          width: '86%',
        alignItems: 'center',
        justifyContent: 'center',
  },
        watermarkHeaderBox: {
          flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 40,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingHorizontal: 12,
        gap: 10,
  },
        watermarkTextLine: {
          flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
        bottomStack: {
          zIndex: 10,
  },
        recentBar: {
          flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xs,
        gap: 8,
  },
        recentLabel: {
          color: colors.textSecondary,
        fontSize: typeScale.caption,
        fontWeight: '700',
  },
        recentChipsRow: {
          gap: 8,
        alignItems: 'center',
  },
        recentChip: {
          minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surfaceOverlay,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        borderRadius: 999,
  },
        recentChipActive: {
          backgroundColor: colors.primary,
        borderColor: colors.primaryBorder,
  },
        recentChipText: {
          color: colors.textPrimary,
        fontSize: typeScale.caption,
        fontWeight: '700',
  },
        bottomCardWrapper: {
          paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
  },
});

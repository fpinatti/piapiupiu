import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BirdPlayingCard } from '../components/BirdPlayingCard';
import { FilterBar } from '../components/FilterBar';
import { LiveCameraScanner } from '../components/LiveCameraScanner';
import {
  BirdMatcher,
  DEFAULT_DEBOUNCE_MS,
  shouldTriggerBirdAudio,
} from '../services/birdMatcher';
import {
  colors,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from '../theme/tokens';
import {
  AppLanguage,
  BirdCard,
  ExpansionId,
  LastPlayedRecord,
  ScanMatchResult,
} from '../types/bird';

interface ScannerScreenProps {
  matcher: BirdMatcher;
  selectedExpansions: ExpansionId[];
  onToggleExpansion: (expansion: ExpansionId) => void;
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
  activeMatch: ScanMatchResult | null;
  onSelectMatch: (match: ScanMatchResult | null) => void;
  recentBirds: BirdCard[];
  onRecordRecentBird: (bird: BirdCard) => void;
  isPlaying: boolean;
  playingBirdId: string | null;
  onPlayBird: (bird: BirdCard) => void;
  onTogglePlayBird: (bird: BirdCard) => void;
}

const SAMPLE_OCR_CARDS = [
  'GAIO-AZUL',
  'GA1O-AZUL',
  'CORUJA-DAS-TORRES',
  'EURASIAN JAY',
  'KOOKABURRA-RISONHA',
  'GROU-DA-MANCHÚRIA',
  'PATO-MANDARIM',
  'TUI',
  'ANDEAN CONDOR',
  'RUBY-TOPAZ HUMMINGBIRD',
];

export function ScannerScreen({
  matcher,
  selectedExpansions,
  onToggleExpansion,
  language,
  onChangeLanguage,
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
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [manualOcrInput, setManualOcrInput] = useState('');
  const [lastRawOcrLine, setLastRawOcrLine] = useState<string>('');
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

      setLastRawOcrLine(lines[0]);
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
      // Since OCR is now triggered deliberately per captured photo, always play the matched bird's sound
      evaluateCandidateLines(lines, true);
    },
    [evaluateCandidateLines]
  );

  const handleSimulatedOcrTrigger = (textToScan: string) => {
    const trimmed = textToScan.trim();
    if (!trimmed) return;
    evaluateCandidateLines([trimmed], true);
  };

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

      {/* Distilled Top Action Bar */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.quickActionsRow} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => setShowFiltersDrawer((prev) => !prev)}
            style={[
              styles.actionBtn,
              showFiltersDrawer && styles.actionBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Alternar filtros de idioma e expansão"
          >
            <Feather name="sliders" size={15} color={colors.textPrimary} />
            <Text style={styles.actionBtnText}>
              Filtros ({selectedExpansions.length})
            </Text>
          </TouchableOpacity>

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
                scannerPaused ? 'Retomar leitura da câmera' : 'Pausar leitura da câmera'
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

          <TouchableOpacity
            onPress={() => setShowSimPanel((prev) => !prev)}
            style={[
              styles.actionBtn,
              (showSimPanel || !cameraCaps.hasCamera) && styles.actionBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Alternar painel de teste sem câmera"
          >
            <Feather name="terminal" size={15} color={colors.textPrimary} />
            <Text style={styles.actionBtnText}>Testar Cartas</Text>
          </TouchableOpacity>
        </View>

        {showFiltersDrawer && (
          <FilterBar
            selectedExpansions={selectedExpansions}
            onToggleExpansion={onToggleExpansion}
            language={language}
            onChangeLanguage={onChangeLanguage}
            compact
          />
        )}
      </View>

      {/* Center Virtual Bounding Box (only rendered when camera is active, pointerEvents="none") */}
      <View style={styles.centerOverlay} pointerEvents="none">
        {cameraCaps.hasCamera && (
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

            <Text style={styles.targetLabel}>
              Posicione o topo da carta aqui
            </Text>
            <Text style={styles.targetSublabel}>
              Alinhe o nome da ave em CAIXA ALTA dentro da mira
            </Text>
            {lastRawOcrLine ? (
              <View style={styles.liveOcrPill}>
                <Text style={styles.liveOcrText} numberOfLines={1}>
                  Lido: {lastRawOcrLine}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Bottom Area: Recent Birds Strip, Test Deck Drawer, and Active Bird Card */}
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

        {(showSimPanel || !cameraCaps.hasCamera) && (
          <View style={styles.simContainer}>
            <Text style={styles.simTitle}>
              Testar cartas sem câmera (toque em um exemplo ou digite com reflexo)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.simChipsRow}
            >
              {SAMPLE_OCR_CARDS.map((sample) => (
                <TouchableOpacity
                  key={sample}
                  onPress={() => handleSimulatedOcrTrigger(sample)}
                  style={styles.simChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Simular leitura da carta ${sample}`}
                >
                  <Text style={styles.simChipText}>{sample}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.simInputRow}>
              <TextInput
                value={manualOcrInput}
                onChangeText={setManualOcrInput}
                placeholder="Digite o topo da carta (ex: GA1O-AZUL, TUI)..."
                placeholderTextColor={colors.textMuted}
                style={styles.simInput}
                onSubmitEditing={() => handleSimulatedOcrTrigger(manualOcrInput)}
              />
              <TouchableOpacity
                onPress={() => handleSimulatedOcrTrigger(manualOcrInput)}
                style={styles.simSendBtn}
                accessibilityRole="button"
                accessibilityLabel="Testar leitura digitada"
              >
                <Text style={styles.simSendBtnText}>Testar</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
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
  cardTargetBox: {
    width: '88%',
    maxWidth: 460,
    height: 155,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(45, 106, 79, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
  targetLabel: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceOverlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: '700',
    fontSize: typeScale.body,
    overflow: 'hidden',
  },
  targetSublabel: {
    color: colors.textSecondary,
    fontSize: typeScale.caption,
    marginTop: 6,
    textAlign: 'center',
  },
  liveOcrPill: {
    marginTop: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '90%',
  },
  liveOcrText: {
    color: colors.textTaxonomic,
    fontSize: typeScale.caption,
    fontWeight: '600',
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
  simContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surfaceOverlay,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  simTitle: {
    color: colors.textSecondary,
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  simChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  simChip: {
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  simChipText: {
    color: colors.textPrimary,
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  simInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simInput: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: typeScale.body,
  },
  simSendBtn: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  simSendBtnText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: typeScale.label,
  },
  bottomCardWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});

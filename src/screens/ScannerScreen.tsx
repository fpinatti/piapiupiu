import React, { useCallback, useRef, useState } from 'react';
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
];

export function ScannerScreen({
  matcher,
  selectedExpansions,
  onToggleExpansion,
  language,
  onChangeLanguage,
  activeMatch,
  onSelectMatch,
  isPlaying,
  playingBirdId,
  onPlayBird,
  onTogglePlayBird,
}: ScannerScreenProps) {
  const [torchOn, setTorchOn] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [manualOcrInput, setManualOcrInput] = useState('');
  const [lastRawOcrLine, setLastRawOcrLine] = useState<string>('');
  const [cameraCaps, setCameraCaps] = useState<{
    hasCamera: boolean;
    hasTorch: boolean;
  }>({ hasCamera: false, hasTorch: false });

  const lastPlayedRef = useRef<LastPlayedRecord>({ id: '', time: 0 });

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
        lastPlayedRef.current = { id: match.bird.id, time: now };
        onSelectMatch(match);
        onPlayBird(match.bird);
      }
    },
    [matcher, onPlayBird, onSelectMatch]
  );

  const handleLiveOcrLines = useCallback(
    (lines: string[]) => {
      evaluateCandidateLines(lines, false);
    },
    [evaluateCandidateLines]
  );

  const handleSimulatedOcrTrigger = (textToScan: string) => {
    const trimmed = textToScan.trim();
    if (!trimmed) return;
    evaluateCandidateLines([trimmed], true);
  };

  return (
    <View style={styles.container}>
      <LiveCameraScanner
        scannerPaused={scannerPaused}
        torchOn={torchOn}
        onOcrLinesDetected={handleLiveOcrLines}
        onCameraCapabilitiesChange={setCameraCaps}
      />

      {/* Top Controls & Filter Bar */}
      <View style={styles.topOverlay}>
        <FilterBar
          selectedExpansions={selectedExpansions}
          onToggleExpansion={onToggleExpansion}
          language={language}
          onChangeLanguage={onChangeLanguage}
          compact
        />

        <View style={styles.quickActionsRow}>
          {cameraCaps.hasTorch && (
            <TouchableOpacity
              onPress={() => setTorchOn((prev) => !prev)}
              style={[styles.actionBtn, torchOn && styles.actionBtnActive]}
            >
              <Text style={styles.actionBtnText}>
                {torchOn ? 'Lanterna: ON' : 'Lanterna: OFF'}
              </Text>
            </TouchableOpacity>
          )}

          {cameraCaps.hasCamera && (
            <TouchableOpacity
              onPress={() => setScannerPaused((prev) => !prev)}
              style={[styles.actionBtn, scannerPaused && styles.actionBtnWarn]}
            >
              <Text style={styles.actionBtnText}>
                {scannerPaused ? 'Scanner: Pausado' : 'Scanner: Ativo'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowSimPanel((prev) => !prev)}
            style={[
              styles.actionBtn,
              (showSimPanel || !cameraCaps.hasCamera) && styles.actionBtnActive,
            ]}
          >
            <Text style={styles.actionBtnText}>Simulador OCR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Center Virtual Bounding Box (Aiming Target for Card Header) */}
      <View style={styles.centerOverlay} pointerEvents="box-none">
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
                OCR: {lastRawOcrLine}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Interactive OCR Simulator Panel */}
      {(showSimPanel || !cameraCaps.hasCamera) && (
        <View style={styles.simContainer}>
          <Text style={styles.simTitle}>
            Simulador de Leitura OCR (Clique em uma carta ou digite com erros de reflexo)
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
              >
                <Text style={styles.simChipText}>{sample}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.simInputRow}>
            <TextInput
              value={manualOcrInput}
              onChangeText={setManualOcrInput}
              placeholder="Digite um texto OCR (ex: GA1O-AZUL, TUI)..."
              placeholderTextColor="#6b7280"
              style={styles.simInput}
              onSubmitEditing={() => handleSimulatedOcrTrigger(manualOcrInput)}
            />
            <TouchableOpacity
              onPress={() => handleSimulatedOcrTrigger(manualOcrInput)}
              style={styles.simSendBtn}
            >
              <Text style={styles.simSendBtnText}>Simular</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Detected Bird Card */}
      {activeMatch && (
        <View style={styles.bottomCardWrapper}>
          <BirdPlayingCard
            bird={activeMatch.bird}
            isPlaying={isPlaying && playingBirdId === activeMatch.bird.id}
            score={activeMatch.score}
            matchedText={activeMatch.matchedText}
            onTogglePlay={onTogglePlayBird}
            onDismiss={() => onSelectMatch(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topOverlay: {
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 8,
    zIndex: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionBtnActive: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  actionBtnWarn: {
    backgroundColor: '#78350f',
    borderColor: '#f59e0b',
  },
  actionBtnText: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: '600',
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardTargetBox: {
    width: '88%',
    maxWidth: 460,
    height: 155,
    borderWidth: 2,
    borderColor: '#4ade80',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardTargetBoxActive: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#10b981',
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
    color: '#ffffff',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: '700',
    fontSize: 14,
    overflow: 'hidden',
  },
  targetSublabel: {
    color: '#d1fae5',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  liveOcrPill: {
    marginTop: 10,
    backgroundColor: 'rgba(6, 78, 59, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '90%',
  },
  liveOcrText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '600',
  },
  simContainer: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.94)',
    borderWidth: 1,
    borderColor: '#374151',
    gap: 8,
  },
  simTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  simChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  simChip: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  simChipText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
  },
  simInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#f9fafb',
    fontSize: 13,
  },
  simSendBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  simSendBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomCardWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});

import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { BirdPhoto } from './src/components/BirdPhoto';
import { WatercolorBackground } from './src/components/WatercolorBackground';
import { WatercolorIcon } from './src/components/WatercolorIcon';
import birdsCatalogJson from './src/data/birds.json';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { audioService } from './src/services/audioService';
import { BirdMatcher } from './src/services/birdMatcher';
import {
  colors,
  fonts,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from './src/theme/tokens';
import {
  BirdCard,
  ExpansionId,
  ScanMatchResult,
} from './src/types/bird';

type ActiveTab = 'scanner' | 'catalog';

const ALL_EXPANSIONS: ExpansionId[] = [
  'base',
  'europe',
  'oceania',
  'asia',
  'americas',
];
const CATALOG_BIRDS = birdsCatalogJson as BirdCard[];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [activeMatch, setActiveMatch] = useState<ScanMatchResult | null>(null);
  const [recentBirds, setRecentBirds] = useState<BirdCard[]>([]);
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    birdId: string | null;
  }>({ isPlaying: false, birdId: null });

  const matcher = useMemo(() => {
    return new BirdMatcher(CATALOG_BIRDS, {
      threshold: 0.35,
      expansions: ALL_EXPANSIONS,
      language: 'all',
    });
  }, []);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => {
      unsubscribe();
      audioService.stop();
    };
  }, []);

  const handleRecordRecentBird = useCallback((bird: BirdCard) => {
    setRecentBirds((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== bird.id);
      return [bird, ...withoutCurrent].slice(0, 5);
    });
  }, []);

  const handlePlayBird = useCallback(
    (bird: BirdCard) => {
      handleRecordRecentBird(bird);
      audioService.playBird(bird);
    },
    [handleRecordRecentBird]
  );

  const handleTogglePlayBird = useCallback(
    (bird: BirdCard) => {
      handleRecordRecentBird(bird);
      audioService.toggleBird(bird);
    },
    [handleRecordRecentBird]
  );

  const currentlyPlayingBird = useMemo(() => {
    if (!playbackState.birdId) return null;
    return CATALOG_BIRDS.find((b) => b.id === playbackState.birdId) ?? null;
  }, [playbackState.birdId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        {/* Naturalist Field Guide Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <WatercolorIcon
              type="feather"
              size="md"
              pulse={playbackState.isPlaying}
            />
            <View>
              <Text style={styles.brandTitle}>Piupiu U</Text>
              <Text style={styles.brandSubtitle}>
                Guia Sonoro & Visual para Wingspan
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <WatercolorBackground />
          {activeTab === 'scanner' ? (
            <ScannerScreen
              matcher={matcher}
              activeMatch={activeMatch}
              onSelectMatch={setActiveMatch}
              recentBirds={recentBirds}
              onRecordRecentBird={handleRecordRecentBird}
              isPlaying={playbackState.isPlaying}
              playingBirdId={playbackState.birdId}
              onPlayBird={handlePlayBird}
              onTogglePlayBird={handleTogglePlayBird}
            />
          ) : (
            <CatalogScreen
              matcher={matcher}
              isPlaying={playbackState.isPlaying}
              playingBirdId={playbackState.birdId}
              onTogglePlayBird={handleTogglePlayBird}
            />
          )}
        </View>

        {/* Persistent Mini-Player when audio is playing in Catalog */}
        {activeTab === 'catalog' &&
          playbackState.isPlaying &&
          currentlyPlayingBird && (
            <View style={styles.miniPlayer}>
              <View style={styles.miniPlayerInfo}>
                <BirdPhoto
                  bird={currentlyPlayingBird}
                  variant="mini"
                  enableZoom={false}
                />
                <View style={styles.miniPlayerTexts}>
                  <Text style={styles.miniPlayerTitle} numberOfLines={1}>
                    Tocando: {currentlyPlayingBird.name_pt}
                  </Text>
                  <Text style={styles.miniPlayerSubtitle} numberOfLines={1}>
                    {currentlyPlayingBird.name_en} •{' '}
                    {currentlyPlayingBird.scientific}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => audioService.stop()}
                style={styles.miniPlayerStopBtn}
                accessibilityRole="button"
                accessibilityLabel={`Parar canto de ${currentlyPlayingBird.name_pt}`}
              >
                <Feather name="square" size={15} color={colors.onDanger} />
                <Text style={styles.miniPlayerStopText}>Parar</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Botanical Tab Navigation Bar */}
        <View style={styles.bottomNav} accessibilityRole="tablist">
          <TouchableOpacity
            onPress={() => setActiveTab('scanner')}
            style={[
              styles.navTab,
              activeTab === 'scanner' && styles.navTabActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'scanner' }}
            accessibilityLabel="Scanner de Cartas"
          >
            <Feather
              name="camera"
              size={18}
              color={
                activeTab === 'scanner'
                    ? colors.primary
                    : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.navTabText,
                activeTab === 'scanner' && styles.navTabTextActive,
              ]}
            >
              Scanner de Cartas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('catalog')}
            style={[
              styles.navTab,
              activeTab === 'catalog' && styles.navTabActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'catalog' }}
            accessibilityLabel={`Catálogo de ${CATALOG_BIRDS.length} aves`}
          >
            <Feather
              name="book-open"
              size={18}
              color={
                activeTab === 'catalog'
                    ? colors.primary
                    : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.navTabText,
                activeTab === 'catalog' && styles.navTabTextActive,
              ]}
            >
              Catálogo ({CATALOG_BIRDS.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandEmblem: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: fonts.serif,
    color: colors.textPrimary,
    fontSize: typeScale.display,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: typeScale.caption,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.md,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  miniPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniPlayerTexts: {
    flex: 1,
  },
  miniPlayerTitle: {
    fontFamily: fonts.serif,
    color: colors.textPrimary,
    fontSize: typeScale.label,
    fontWeight: '700',
  },
  miniPlayerSubtitle: {
    color: colors.textSecondary,
    fontSize: typeScale.caption,
  },
  miniPlayerStopBtn: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  miniPlayerStopText: {
    color: colors.onDanger,
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  navTab: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  navTabActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  navTabText: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: typeScale.label,
    fontWeight: '600',
  },
  navTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

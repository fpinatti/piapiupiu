import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import birdsCatalogJson from './src/data/birds.json';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { audioService } from './src/services/audioService';
import { BirdMatcher } from './src/services/birdMatcher';
import {
  AppLanguage,
  BirdCard,
  ExpansionId,
  ScanMatchResult,
} from './src/types/bird';

type ActiveTab = 'scanner' | 'catalog';

const ALL_EXPANSIONS: ExpansionId[] = ['base', 'europe', 'oceania', 'asia'];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [selectedExpansions, setSelectedExpansions] =
    useState<ExpansionId[]>(ALL_EXPANSIONS);
  const [language, setLanguage] = useState<AppLanguage>('all');
  const [activeMatch, setActiveMatch] = useState<ScanMatchResult | null>(null);
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    birdId: string | null;
  }>({ isPlaying: false, birdId: null });

  const matcher = useMemo(() => {
    return new BirdMatcher(birdsCatalogJson as BirdCard[], {
      threshold: 0.35,
      expansions: selectedExpansions,
      language,
    });
  }, []);

  useEffect(() => {
    matcher.setFilters({
      expansions: selectedExpansions,
      language,
    });
  }, [matcher, selectedExpansions, language]);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => {
      unsubscribe();
      audioService.stop();
    };
  }, []);

  const handleToggleExpansion = useCallback((expansion: ExpansionId) => {
    setSelectedExpansions((prev) => {
      if (prev.includes(expansion)) {
        // Prevent deselecting all expansions at once
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== expansion);
      }
      return [...prev, expansion];
    });
  }, []);

  const handlePlayBird = useCallback((bird: BirdCard) => {
    audioService.playBird(bird);
  }, []);

  const handleTogglePlayBird = useCallback((bird: BirdCard) => {
    audioService.toggleBird(bird);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>PiaPiuPiu</Text>
          <Text style={styles.brandSubtitle}>
            Wingsong Companion • OCR & Cantos Offline
          </Text>
        </View>

        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            onPress={() => setActiveTab('scanner')}
            style={[
              styles.tabButton,
              activeTab === 'scanner' && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'scanner' && styles.tabButtonTextActive,
              ]}
            >
              Scanner OCR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('catalog')}
            style={[
              styles.tabButton,
              activeTab === 'catalog' && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'catalog' && styles.tabButtonTextActive,
              ]}
            >
              Catálogo ({(birdsCatalogJson as BirdCard[]).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'scanner' ? (
          <ScannerScreen
            matcher={matcher}
            selectedExpansions={selectedExpansions}
            onToggleExpansion={handleToggleExpansion}
            language={language}
            onChangeLanguage={setLanguage}
            activeMatch={activeMatch}
            onSelectMatch={setActiveMatch}
            isPlaying={playbackState.isPlaying}
            playingBirdId={playbackState.birdId}
            onPlayBird={handlePlayBird}
            onTogglePlayBird={handleTogglePlayBird}
          />
        ) : (
          <CatalogScreen
            matcher={matcher}
            selectedExpansions={selectedExpansions}
            onToggleExpansion={handleToggleExpansion}
            language={language}
            onChangeLanguage={setLanguage}
            isPlaying={playbackState.isPlaying}
            playingBirdId={playbackState.birdId}
            onTogglePlayBird={handleTogglePlayBird}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  brandTitle: {
    color: '#10b981',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#10b981',
  },
  tabButtonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
});


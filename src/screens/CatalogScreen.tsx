import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EXPANSION_META, FilterBar } from '../components/FilterBar';
import { BirdMatcher } from '../services/birdMatcher';
import { AppLanguage, BirdCard, ExpansionId } from '../types/bird';

interface CatalogScreenProps {
  matcher: BirdMatcher;
  selectedExpansions: ExpansionId[];
  onToggleExpansion: (expansion: ExpansionId) => void;
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
  isPlaying: boolean;
  playingBirdId: string | null;
  onTogglePlayBird: (bird: BirdCard) => void;
}

export function CatalogScreen({
  matcher,
  selectedExpansions,
  onToggleExpansion,
  language,
  onChangeLanguage,
  isPlaying,
  playingBirdId,
  onTogglePlayBird,
}: CatalogScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const results = useMemo(() => {
    return matcher.searchCatalog(searchQuery);
  }, [matcher, searchQuery, selectedExpansions, language]);

  return (
    <View style={styles.container}>
      <FilterBar
        selectedExpansions={selectedExpansions}
        onToggleExpansion={onToggleExpansion}
        language={language}
        onChangeLanguage={onChangeLanguage}
      />

      <View style={styles.searchBarWrapper}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar ave em PT-BR, Inglês ou Nome Científico..."
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {results.length} {results.length === 1 ? 'ave encontrada' : 'aves encontradas'} (100% offline)
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const active = isPlaying && playingBirdId === item.id;
          const expMeta = EXPANSION_META.find((e) => e.id === item.expansion);
          const primaryTitle =
            language === 'en' ? item.name_en : item.name_pt;
          const secondaryTitle =
            language === 'en' ? item.name_pt : item.name_en;

          return (
            <TouchableOpacity
              onPress={() => onTogglePlayBird(item)}
              style={[styles.birdRow, active && styles.birdRowActive]}
              activeOpacity={0.75}
            >
              <View style={styles.birdInfo}>
                <View style={styles.titleLine}>
                  <Text style={styles.primaryName}>{primaryTitle}</Text>
                  {expMeta && (
                    <View
                      style={[
                        styles.expTag,
                        {
                          backgroundColor: expMeta.color + '24',
                          borderColor: expMeta.color,
                        },
                      ]}
                    >
                      <Text style={[styles.expTagText, { color: expMeta.color }]}>
                        {expMeta.label}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.secondaryName}>
                  {secondaryTitle} •{' '}
                  <Text style={styles.scientificName}>{item.scientific}</Text>
                </Text>
              </View>

              <View
                style={[
                  styles.playCircle,
                  active && styles.playCircleActive,
                ]}
              >
                <Text style={styles.playCircleIcon}>
                  {active ? '■' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nenhuma ave encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Tente outro termo ou ative mais expansões no filtro acima.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 14,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  clearBtnText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
  },
  countRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  countText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 8,
  },
  birdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  birdRowActive: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b33',
  },
  birdInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryName: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  expTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  expTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  secondaryName: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 3,
  },
  scientificName: {
    fontStyle: 'italic',
    color: '#6ee7b7',
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircleActive: {
    backgroundColor: '#ef4444',
    borderColor: '#f87171',
  },
  playCircleIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});


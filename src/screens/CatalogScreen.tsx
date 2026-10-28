import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { BirdPhoto } from '../components/BirdPhoto';
import { BirdMatcher } from '../services/birdMatcher';
import {
  colors,
  EXPANSION_THEME,
  HABITAT_THEME,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from '../theme/tokens';
import { BirdCard } from '../types/bird';

export interface CatalogScreenProps {
  matcher: BirdMatcher;
  isPlaying: boolean;
  playingBirdId: string | null;
  onTogglePlayBird: (bird: BirdCard) => void;
}

export function CatalogScreen({
  matcher,
  isPlaying,
  playingBirdId,
  onTogglePlayBird,
}: CatalogScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 2 : 1;

  const results = useMemo(() => {
    return matcher.searchCatalog(searchQuery);
  }, [matcher, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar ave em PT-BR, Inglês ou Latim..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {results.length}{' '}
          {results.length === 1 ? 'ave disponível' : 'aves disponíveis'}
        </Text>
      </View>

      <FlatList
        key={`catalog-grid-${numColumns}`}
        data={results}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        renderItem={({ item }) => {
          const active = isPlaying && playingBirdId === item.id;
          const expMeta = EXPANSION_THEME[item.expansion];
          const primaryTitle = item.name_pt;
          const secondaryTitle = item.name_en;

          return (
            <TouchableOpacity
              onPress={() => onTogglePlayBird(item)}
              style={[
                styles.birdRow,
                numColumns > 1 && styles.birdRowColumn,
                active && styles.birdRowActive,
              ]}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={
                active
                  ? `Parar canto de ${primaryTitle}`
                  : `Ouvir canto de ${primaryTitle}`
              }
            >
              <View style={styles.birdLeading}>
                <BirdPhoto bird={item} variant="thumbnail" enableZoom />
              </View>

              <View style={styles.birdInfo}>
                <View style={styles.titleLine}>
                  <Text style={styles.primaryName}>{primaryTitle}</Text>
                </View>

                <Text style={styles.secondaryName}>
                  {secondaryTitle} •{' '}
                  <Text style={styles.scientificName}>{item.scientific}</Text>
                </Text>

                <View style={styles.tagsRow}>
                  {expMeta && (
                    <View
                      style={[
                        styles.expTag,
                        {
                          backgroundColor: expMeta.bg,
                          borderColor: expMeta.border,
                        },
                      ]}
                    >
                      <Text style={[styles.expTagText, { color: expMeta.text }]}>
                        {expMeta.label}
                      </Text>
                    </View>
                  )}

                  {item.habitats?.map((h) => {
                    const hab = HABITAT_THEME[h];
                    if (!hab) return null;
                    return (
                      <View
                        key={h}
                        style={[
                          styles.habitatTag,
                          {
                            backgroundColor: hab.bg,
                            borderColor: hab.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.habitatTagText, { color: hab.text }]}
                        >
                          {hab.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View
                style={[
                  styles.playCircle,
                  active && styles.playCircleActive,
                ]}
              >
                <Feather
                  name={active ? 'square' : 'volume-2'}
                  size={18}
                  color={active ? colors.onDanger : colors.textPrimary}
                />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="feather" size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma ave encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Tente outro nome em Português, Inglês ou Latim.
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
    backgroundColor: colors.canvas,
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typeScale.body,
    paddingVertical: 10,
  },
  clearBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  countText: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: 10,
  },
  columnWrapper: {
    gap: 10,
  },
  birdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  birdRowColumn: {
    flex: 1,
  },
  birdRowActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surfaceElevated,
  },
  birdLeading: {
    marginRight: spacing.md,
  },
  birdInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryName: {
    color: colors.textPrimary,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
  secondaryName: {
    color: colors.textSecondary,
    fontSize: typeScale.label,
    marginTop: 3,
  },
  scientificName: {
    fontStyle: 'italic',
    color: colors.textTaxonomic,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  expTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  expTagText: {
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  habitatTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  habitatTagText: {
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  playCircle: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircleActive: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  emptyBox: {
    paddingVertical: 56,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typeScale.label,
    textAlign: 'center',
  },
});

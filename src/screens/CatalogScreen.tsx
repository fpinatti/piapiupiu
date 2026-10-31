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
import { WatercolorBlobButton } from '../components/WatercolorBlobButton';
import { WatercolorIcon } from '../components/WatercolorIcon';
import { BirdMatcher } from '../services/birdMatcher';
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
      {/* Field Notebook Search Header */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar ave em PT-BR, Inglês ou Latim..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <WatercolorBlobButton
              onPress={() => setSearchQuery('')}
              shape="pebble"
              shapeVariant={1}
              variant="secondary"
              size="sm"
              accessibilityLabel="Limpar busca"
              contentStyle={{ minHeight: 30, width: 30, paddingHorizontal: 0, paddingVertical: 0 }}
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
            </WatercolorBlobButton>
          )}
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {results.length}{' '}
          {results.length === 1 ? 'ave catalogada' : 'aves catalogadas'} (5 expansões)
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
        renderItem={({ item, index }) => {
          const active = isPlaying && playingBirdId === item.id;
          const expMeta = EXPANSION_THEME[item.expansion];
          const primaryTitle = item.name_pt;
          const secondaryTitle = item.name_en;

          return (
            <View
              style={[
                styles.birdRow,
                numColumns > 1 && styles.birdRowColumn,
                active && styles.birdRowActive,
              ]}
            >
              <View style={styles.birdLeading}>
                <BirdPhoto
                  bird={item}
                  variant="thumbnail"
                  living={active}
                  isPlaying={active}
                  enableZoom
                />
              </View>

              <TouchableOpacity
                onPress={() => onTogglePlayBird(item)}
                style={styles.birdInfo}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                  active
                    ? `Parar canto de ${primaryTitle}`
                    : `Ouvir canto de ${primaryTitle}`
                }
              >
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

                  {item.habitats?.map((h, hIdx) => (
                    <WatercolorIcon
                      key={h}
                      type={h}
                      size="sm"
                      variant={(((hIdx) % 3) + 1) as 1 | 2 | 3}
                      pulse={active}
                    />
                  ))}
                </View>
              </TouchableOpacity>

              <WatercolorBlobButton
                onPress={() => onTogglePlayBird(item)}
                shape="pebble"
                shapeVariant={(((index % 3) + 1) as 1 | 2 | 3)}
                variant={active ? 'danger' : 'primary'}
                size="sm"
                accessibilityLabel={
                  active
                    ? `Parar canto de ${primaryTitle}`
                    : `Ouvir canto de ${primaryTitle}`
                }
                contentStyle={{ minHeight: 40, width: 40, paddingHorizontal: 0, paddingVertical: 0 }}
              >
                <Feather
                  name={active ? 'square' : 'volume-2'}
                  size={17}
                  color={active ? colors.onDanger : colors.onPrimary}
                />
              </WatercolorBlobButton>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <WatercolorIcon type="feather" size="lg" />
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    gap: 10,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typeScale.body,
    paddingVertical: 10,
  },
  clearBtn: {
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  countText: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    color: colors.textSecondary,
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
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  birdRowColumn: {
    flex: 1,
  },
  birdRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.16,
    shadowRadius: 10,
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
    fontFamily: fonts.serif,
    color: colors.textPrimary,
    fontSize: typeScale.title,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secondaryName: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: typeScale.label,
    marginTop: 2,
  },
  scientificName: {
    fontStyle: 'italic',
    color: colors.textTaxonomic,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  expTag: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expTagText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontFamily: fonts.serif,
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

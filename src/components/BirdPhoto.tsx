import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getCachedBirdPhoto,
  resolveBirdPhoto,
} from '../services/birdImageService';
import { WatercolorBlobButton } from './WatercolorBlobButton';
import {
  colors,
  EXPANSION_THEME,
  fonts,
  HABITAT_THEME,
  spacing,
  typeScale,
} from '../theme/tokens';
import { BirdCard, BirdPhotoMetadata } from '../types/bird';

export interface BirdPhotoProps {
  /** The bird whose photograph should be displayed */
  bird: BirdCard;
  /**
   * Visual size variant:
   * - 'hero' (76x76 rounded portrait inside BirdPlayingCard)
   * - 'thumbnail' (54x54 rounded portrait inside CatalogScreen rows)
   * - 'mini' (38x38 rounded portrait inside App Mini-Player)
   */
  variant?: 'hero' | 'thumbnail' | 'mini';
  /** Whether tapping the photo opens the full-screen zoom modal */
  enableZoom?: boolean;
}

const VARIANT_DIMENSIONS = {
  hero: { size: 76, borderRadius: 14, iconSize: 24 },
  thumbnail: { size: 54, borderRadius: 12, iconSize: 18 },
  mini: { size: 38, borderRadius: 10, iconSize: 15 },
} as const;

export function BirdPhoto({
  bird,
  variant = 'thumbnail',
  enableZoom,
}: BirdPhotoProps) {
  const canZoom = enableZoom ?? variant === 'hero';
  const dims = VARIANT_DIMENSIONS[variant];

  const [photo, setPhoto] = useState<BirdPhotoMetadata | null>(() => {
    return getCachedBirdPhoto(bird.id) ?? null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return getCachedBirdPhoto(bird.id) === undefined;
  });
  const [imageError, setImageError] = useState<boolean>(false);
  const [zoomVisible, setZoomVisible] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setImageError(false);

    const cached = getCachedBirdPhoto(bird.id);
    if (cached !== undefined) {
      setPhoto(cached);
      setIsLoading(false);
      return;
    }

    setPhoto(null);
    setIsLoading(true);

    resolveBirdPhoto(bird)
      .then((resolved) => {
        if (!isMounted) return;
        setPhoto(resolved);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setPhoto(null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bird]);

  const primaryHabitat = bird.habitats?.[0];
  const habitatPalette = primaryHabitat
    ? HABITAT_THEME[primaryHabitat]
    : undefined;
  const expansionPalette = EXPANSION_THEME[bird.expansion];

  const hasValidPhoto = Boolean(photo?.thumbUrl && !imageError);

  const containerStyle = [
    styles.container,
    {
      width: dims.size,
      height: dims.size,
      borderRadius: dims.borderRadius,
      backgroundColor: habitatPalette?.bg ?? colors.surfaceSubtle,
      borderColor: habitatPalette?.border ?? colors.border,
    },
  ];

  const content = (
    <View style={containerStyle}>
      {hasValidPhoto && photo ? (
        <>
          <Image
            source={{ uri: photo.thumbUrl, cache: 'force-cache' }}
            style={[
              styles.image,
              {
                width: dims.size,
                height: dims.size,
                borderRadius: dims.borderRadius - 1,
              },
            ]}
            resizeMode="cover"
            onError={() => setImageError(true)}
            accessibilityLabel={`Fotografia da ave ${bird.name_pt} (${bird.scientific})`}
          />
          {canZoom && variant === 'hero' && (
            <View style={styles.zoomBadge}>
              <Feather name="maximize-2" size={11} color="#FFFFFF" />
            </View>
          )}
        </>
      ) : (
        <View style={styles.placeholderBox}>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={habitatPalette?.text ?? colors.textTaxonomic}
            />
          ) : (
            <Feather
              name="feather"
              size={dims.iconSize}
              color={habitatPalette?.text ?? colors.textTaxonomic}
            />
          )}
        </View>
      )}
    </View>
  );

  if (!canZoom || !hasValidPhoto || !photo) {
    return content;
  }

  const sourceLabel =
    photo.source === 'inaturalist'
      ? 'iNaturalist'
      : photo.source === 'wikipedia'
        ? 'Wikimedia Commons'
        : 'Catálogo Aberto';

  return (
    <>
      <TouchableOpacity
        onPress={() => setZoomVisible(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Ampliar fotografia de ${bird.name_pt}`}
      >
        {content}
      </TouchableOpacity>

      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setZoomVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalNamePt}>{bird.name_pt}</Text>
                <Text style={styles.modalNameEn}>
                  {bird.name_en} •{' '}
                  <Text style={styles.modalScientific}>{bird.scientific}</Text>
                </Text>
              </View>

              <WatercolorBlobButton
                onPress={() => setZoomVisible(false)}
                shape="pebble"
                shapeVariant={2}
                variant="secondary"
                size="sm"
                accessibilityLabel="Fechar visualização da foto"
                contentStyle={{ minHeight: 36, width: 36, paddingHorizontal: 0, paddingVertical: 0 }}
              >
                <Feather name="x" size={18} color={colors.textPrimary} />
              </WatercolorBlobButton>
            </View>

            <View style={styles.modalImageWrapper}>
              <Image
                source={{ uri: photo.fullUrl || photo.thumbUrl, cache: 'force-cache' }}
                style={styles.modalImage}
                resizeMode="contain"
                accessibilityLabel={`Fotografia ampliada de ${bird.name_pt}`}
              />
            </View>

            <View style={styles.modalFooter}>
              <View style={styles.modalBadgesRow}>
                {expansionPalette && (
                  <View
                    style={[
                      styles.modalBadge,
                      {
                        backgroundColor: expansionPalette.bg,
                        borderColor: expansionPalette.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalBadgeText,
                        { color: expansionPalette.text },
                      ]}
                    >
                      {expansionPalette.label}
                    </Text>
                  </View>
                )}

                <View style={styles.sourceBadge}>
                  <Feather
                    name="camera"
                    size={12}
                    color={colors.textTaxonomic}
                  />
                  <Text style={styles.sourceBadgeText}>
                    Fonte: {sourceLabel}
                  </Text>
                </View>
              </View>

              {photo.attribution ? (
                <Text style={styles.attributionText} numberOfLines={2}>
                  {photo.attribution}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    backgroundColor: colors.surfaceSubtle,
  },
  placeholderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(13, 21, 18, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 13, 11, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSubtle,
  },
  modalTitleGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  modalNamePt: {
    fontFamily: fonts.serif,
    color: colors.textPrimary,
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  modalNameEn: {
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    fontSize: typeScale.caption,
    marginTop: 2,
  },
  modalScientific: {
    fontStyle: 'italic',
    color: colors.textTaxonomic,
  },
  modalCloseBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageWrapper: {
    width: '100%',
    height: 320,
    backgroundColor: '#070C0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  modalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalBadgeText: {
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceBadgeText: {
    color: colors.textTaxonomic,
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  attributionText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});


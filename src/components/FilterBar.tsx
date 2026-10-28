import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  colors,
  EXPANSION_THEME,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from '../theme/tokens';
import { AppLanguage, ExpansionId } from '../types/bird';

export const EXPANSION_META = [
  EXPANSION_THEME.base,
  EXPANSION_THEME.europe,
  EXPANSION_THEME.oceania,
  EXPANSION_THEME.asia,
  EXPANSION_THEME.americas,
];

export const LANGUAGE_META: {
  id: AppLanguage;
  label: string;
}[] = [
  { id: 'all', label: 'PT + EN' },
  { id: 'pt', label: 'PT-BR' },
  { id: 'en', label: 'EN' },
];

interface FilterBarProps {
  selectedExpansions: ExpansionId[];
  onToggleExpansion: (expansion: ExpansionId) => void;
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
  compact?: boolean;
}

export function FilterBar({
  selectedExpansions,
  onToggleExpansion,
  language,
  onChangeLanguage,
  compact = false,
}: FilterBarProps) {
  const [minExpansionHint, setMinExpansionHint] = useState(false);

  useEffect(() => {
    if (!minExpansionHint) return;
    const timer = setTimeout(() => setMinExpansionHint(false), 2600);
    return () => clearTimeout(timer);
  }, [minExpansionHint]);

  const handlePressExpansion = (expId: ExpansionId) => {
    if (
      selectedExpansions.length === 1 &&
      selectedExpansions.includes(expId)
    ) {
      setMinExpansionHint(true);
      return;
    }
    setMinExpansionHint(false);
    onToggleExpansion(expId);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {/* Language selector pills */}
        <View style={styles.group}>
          {LANGUAGE_META.map((lang) => {
            const active = language === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                onPress={() => onChangeLanguage(lang.id)}
                style={[styles.langPill, active && styles.langPillActive]}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Idioma de busca: ${lang.label}`}
              >
                <Text style={[styles.langText, active && styles.langTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Expansion filter pills */}
        <View style={styles.group}>
          {EXPANSION_META.map((exp) => {
            const active = selectedExpansions.includes(exp.id);
            return (
              <TouchableOpacity
                key={exp.id}
                onPress={() => handlePressExpansion(exp.id)}
                style={[
                  styles.expPill,
                  active && {
                    backgroundColor: exp.bg,
                    borderColor: exp.border,
                  },
                ]}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Expansão ${exp.label}`}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: active ? exp.border : colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.expText,
                    active && { color: exp.text },
                  ]}
                >
                  {exp.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {minExpansionHint && (
        <View style={styles.hintRow} accessibilityLiveRegion="polite">
          <Text style={styles.hintText}>
            Mantenha pelo menos 1 expansão ativa para buscar cartas.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerCompact: {
    backgroundColor: colors.surfaceOverlay,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
  },
  scrollRow: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  langPill: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryBorder,
  },
  langText: {
    color: colors.textSecondary,
    fontSize: typeScale.label,
    fontWeight: '600',
  },
  langTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  expPill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expText: {
    color: colors.textSecondary,
    fontSize: typeScale.label,
    fontWeight: '600',
  },
  hintRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  hintText: {
    color: colors.onWarning,
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
});

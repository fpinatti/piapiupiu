import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppLanguage, ExpansionId } from '../types/bird';

export const EXPANSION_META: {
  id: ExpansionId;
  label: string;
  color: string;
}[] = [
  { id: 'base', label: 'Base', color: '#3b82f6' },
  { id: 'europe', label: 'Europa', color: '#8b5cf6' },
  { id: 'oceania', label: 'Oceania', color: '#f59e0b' },
  { id: 'asia', label: 'Ásia', color: '#ef4444' },
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
                onPress={() => onToggleExpansion(exp.id)}
                style={[
                  styles.expPill,
                  active && {
                    backgroundColor: exp.color + '33',
                    borderColor: exp.color,
                  },
                ]}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: active ? exp.color : '#6b7280' },
                  ]}
                />
                <Text style={[styles.expText, active && styles.expTextActive]}>
                  {exp.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  containerCompact: {
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: 14,
    borderBottomWidth: 0,
    paddingVertical: 6,
  },
  scrollRow: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#374151',
    marginHorizontal: 6,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  langPillActive: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  langText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  langTextActive: {
    color: '#ecfdf5',
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  expText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  expTextActive: {
    color: '#f9fafb',
  },
});


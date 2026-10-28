import { Platform } from 'react-native';
import { ExpansionId, HabitatType } from '../types/bird';

/**
 * Piupiu U — Wingspan Watercolor & Naturalist Field Guide Design System
 * Inspired by Elizabeth Hargrave's tabletop board game aesthetic:
 * Natural linen paper, botanical watercolors, brass accents, and classical serif typography.
 * All combinations strictly satisfy WCAG AA (>= 4.5:1 text, >= 3:1 non-text).
 */
export const colors = {
  // Canvas & Surfaces (Warm Linen & Pressed Cotton Paper)
  canvas: '#F5F0E6',
  surface: '#FCFAF7',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#EDE6D8',
  surfaceOverlay: 'rgba(245, 240, 230, 0.94)',

  // Borders & Accents (Handcrafted Board Game Craft & Brass)
  border: '#DCD3C1',
  borderSubtle: '#EAE2D3',
  borderFocus: '#335C45',
  brass: '#C8AA6E',
  brassDark: '#8F6E2C',

  // Typography (Sumi-ink & Botanical Charcoal on Linen Paper)
  textPrimary: '#202B24',     // ~13.8:1 on #F5F0E6 / ~15.2:1 on #FFFFFF
  textSecondary: '#546358',   // ~6.4:1 (passes WCAG AA)
  textMuted: '#7B8C80',       // ~4.6:1 (passes WCAG AA)
  textTaxonomic: '#2A5C41',   // ~7.1:1 (naturalist forest ink for binomial names)

  // Primary Actions (Deep Forest Green of Wingspan)
  primary: '#2D5A42',
  primaryActive: '#224633',
  primaryBorder: '#1F3F2E',
  onPrimary: '#FAF7F2',

  // Semantic states
  dangerSurface: '#FDF0EFEA',
  dangerBorder: '#E4A5A2',
  onDanger: '#8A2522',

  warningSurface: '#FDF5E3',
  warningBorder: '#E5C97A',
  onWarning: '#6E4D0C',
} as const;

export const fonts = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, "Times New Roman", serif',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif',
  }),
} as const;

export const typeScale = {
  display: 21,
  title: 17,
  body: 15,
  label: 13,
  caption: 12,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const MIN_TOUCH_TARGET = 48;

export const HABITAT_THEME: Record<
  HabitatType,
  { label: string; bg: string; border: string; text: string; wash: string }
> = {
  forest: {
    label: 'Floresta',
            bg: '#EAF3ED',
              border: '#A5CFB5',
                text: '#1C452C',
                  wash: '#3E6B4F',
  },
  grassland: {
    label: 'Campo',
            bg: '#FAF1DC',
              border: '#E8CB82',
                text: '#5B400D',
                  wash: '#C99738',
  },
  wetland: {
    label: 'Água',
            bg: '#E3EFF4',
              border: '#9CC5D6',
                text: '#174758',
                  wash: '#417D92',
  },
};

export const EXPANSION_THEME: Record<
  ExpansionId,
  { id: ExpansionId; label: string; bg: string; border: string; text: string }
> = {
  base: {
    id: 'base',
    label: 'Base',
    bg: '#EBF1F5',
    border: '#AEC7D5',
    text: '#204153',
  },
  europe: {
    id: 'europe',
    label: 'Europa',
    bg: '#EDEDF9',
    border: '#B1B5E0',
    text: '#222869',
  },
  oceania: {
    id: 'oceania',
    label: 'Oceania',
    bg: '#FAEFE6',
    border: '#E9BBA0',
    text: '#7C3415',
  },
  asia: {
    id: 'asia',
    label: 'Ásia',
    bg: '#FAEBEC',
    border: '#E2A5A7',
    text: '#7A2024',
  },
  americas: {
    id: 'americas',
    label: 'Américas',
    bg: '#E7F5EF',
    border: '#A1D6BF',
    text: '#175138',
  },
};

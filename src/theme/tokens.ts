import { ExpansionId, HabitatType } from '../types/bird';

/**
 * Nocturnal Ornithological Field Guide Palette & Tokens
 * Designed for low-glare tabletop Wingspan sessions with WCAG AA (>= 4.5:1) contrast.
 */
export const colors = {
  // Surfaces
  canvas: '#0A1410',
  surface: '#11201A',
  surfaceElevated: '#182C24',
  surfaceSubtle: '#1E362C',
  surfaceOverlay: 'rgba(10, 20, 16, 0.90)',

  // Borders
  border: '#29473A',
  borderSubtle: '#1E362C',
  borderFocus: '#52B788',

  // Typography (Warm Parchment / Sage-tinted hierarchy — all >= 4.5:1 on #0A1410 & #11201A)
  textPrimary: '#F6F3EB',    // ~16.5:1
  textSecondary: '#C8D5BB',  // ~10.2:1
  textMuted: '#98B09E',      // ~5.8:1 (passes WCAG AA 4.5:1)
  textTaxonomic: '#8CE0B5',  // ~9.4:1 (for Latin scientific binomial names)

  // Actions
  primary: '#2D6A4F',
  primaryActive: '#40916C',
  primaryBorder: '#52B788',
  onPrimary: '#F6F3EB',

  // Semantic states
  dangerSurface: '#5C1D24',
  dangerBorder: '#E06D75',
  onDanger: '#FFE5E7',

  warningSurface: '#4F3913',
  warningBorder: '#E9C46A',
  onWarning: '#FFF3D1',
} as const;

export const typeScale = {
  display: 20,
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

/**
 * Platform touch target floor (48dp Android Material 3 / 44pt iOS HIG).
 */
export const MIN_TOUCH_TARGET = 48;

export const HABITAT_THEME: Record<
  HabitatType,
  { label: string; bg: string; border: string; text: string }
> = {
  forest: {
    label: 'Floresta',
    bg: '#163326',
    border: '#52B788',
    text: '#A3E4C4',
  },
  grassland: {
    label: 'Campo',
    bg: '#3B2E14',
    border: '#E9C46A',
    text: '#F7DF9C',
  },
  wetland: {
    label: 'Água',
    bg: '#13313D',
    border: '#4EA8DE',
    text: '#A2D6F9',
  },
};

export const EXPANSION_THEME: Record<
  ExpansionId,
  { id: ExpansionId; label: string; bg: string; border: string; text: string }
> = {
  base: {
    id: 'base',
    label: 'Base',
    bg: '#172A3A',
    border: '#64A6BD',
    text: '#B8E1F0',
  },
  europe: {
    id: 'europe',
    label: 'Europa',
    bg: '#2A1E3D',
    border: '#B392F0',
    text: '#E2D4FC',
  },
  oceania: {
    id: 'oceania',
    label: 'Oceania',
    bg: '#3B2814',
    border: '#F4A261',
    text: '#FCD5B5',
  },
  asia: {
    id: 'asia',
    label: 'Ásia',
    bg: '#3D1A20',
    border: '#E76F51',
    text: '#FCC2B6',
  },
  americas: {
    id: 'americas',
    label: 'Américas',
    bg: '#13332C',
    border: '#2EC4B6',
    text: '#A8F0E8',
  },
};


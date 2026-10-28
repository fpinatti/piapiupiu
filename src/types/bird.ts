export type ExpansionId = 'base' | 'europe' | 'oceania' | 'asia';

export type AppLanguage = 'all' | 'pt' | 'en';

export type HabitatType = 'forest' | 'grassland' | 'wetland';

export interface BirdCard {
  /** Unique snake_case identifier (e.g., "blue_jay") */
  id: string;
  /** Official Brazilian Portuguese card title (e.g., "Gaio-azul") */
  name_pt: string;
  /** Official English card title (e.g., "Blue Jay") */
  name_en: string;
  /** Universal binomial scientific name (e.g., "Cyanocitta cristata") */
  scientific: string;
  /** Wingspan expansion identifier */
  expansion: ExpansionId;
  /** Habitats where the bird can be played */
  habitats?: HabitatType[];
  /** Bundled audio filename inside assets/audio/ */
  audio: string;
  /** Optional Xeno-Canto recording attribution or source note */
  source?: string;
}

export interface NormalizedBoundingBox {
  /** Normalized left coordinate [0..1] */
  xMin: number;
  /** Normalized right coordinate [0..1] */
  xMax: number;
  /** Normalized top coordinate [0..1] */
  yMin: number;
  /** Normalized bottom coordinate [0..1] */
  yMax: number;
}

export interface OcrFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrLineItem {
  text: string;
  frame?: OcrFrameRect;
}

export interface OcrBlockItem {
  text?: string;
  frame?: OcrFrameRect;
  lines?: OcrLineItem[];
}

export interface ScanMatchResult {
  bird: BirdCard;
  /** Fuse.js similarity score (0 = exact match, lower is better) */
  score: number;
  /** Raw OCR text line that triggered the match */
  matchedText: string;
  /** Normalized query string used for matching */
  normalizedQuery: string;
}

export interface LastPlayedRecord {
  id: string;
  time: number;
}


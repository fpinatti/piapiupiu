import Fuse from 'fuse.js';
import {
  AppLanguage,
  BirdCard,
  ExpansionId,
  LastPlayedRecord,
  ScanMatchResult,
} from '../types/bird';
import { isCandidateBirdTitle, normalizeBirdText } from '../utils/normalizeText';

interface IndexedBirdCard extends BirdCard {
  norm_pt: string;
  norm_en: string;
  norm_scientific: string;
}

export interface MatcherOptions {
  /** Fuse.js similarity threshold (default: 0.35 as specified in architecture) */
  threshold?: number;
  /** Active expansions to include in search (defaults to all expansions) */
  expansions?: ExpansionId[];
  /** Active language filter ('all' searches both PT-BR and EN; 'pt' or 'en' prioritizes that language) */
  language?: AppLanguage;
}

/**
 * Default anti-spam cooldown in milliseconds (6 seconds).
 * Prevents re-triggering the same bird's call 30 times per second while holding a card.
 */
export const DEFAULT_DEBOUNCE_MS = 6000;

/**
 * Evaluates whether a detected bird ID should trigger audio playback based on
 * the debounce anti-spam rules:
 * - Play immediately if `birdId !== lastPlayed.id`
 * - Play again for the same bird only if `(nowMs - lastPlayed.time) >= cooldownMs`
 */
export function shouldTriggerBirdAudio(
  birdId: string,
  nowMs: number,
  lastPlayed: LastPlayedRecord,
  cooldownMs: number = DEFAULT_DEBOUNCE_MS
): boolean {
  if (!birdId) {
    return false;
  }
  if (lastPlayed.id !== birdId) {
    return true;
  }
  return nowMs - lastPlayed.time >= cooldownMs;
}

/**
 * Stateful & configurable Fuzzy Matcher for Wingspan bird cards using Fuse.js.
 */
export class BirdMatcher {
  private readonly allBirds: IndexedBirdCard[];
  private activeBirds: IndexedBirdCard[] = [];
  private fuse!: Fuse<IndexedBirdCard>;
  private threshold: number;
  private expansions: Set<ExpansionId>;
  private language: AppLanguage;

  constructor(birds: BirdCard[], options: MatcherOptions = {}) {
    this.threshold = options.threshold ?? 0.35;
    this.expansions = new Set<ExpansionId>(
      options.expansions ?? ['base', 'europe', 'oceania', 'asia']
    );
    this.language = options.language ?? 'all';

    this.allBirds = birds.map((bird) => ({
      ...bird,
      norm_pt: normalizeBirdText(bird.name_pt),
      norm_en: normalizeBirdText(bird.name_en),
      norm_scientific: normalizeBirdText(bird.scientific),
    }));

    this.rebuildIndex();
  }

  public setFilters(options: MatcherOptions): void {
    if (options.threshold !== undefined) {
      this.threshold = options.threshold;
    }
    if (options.expansions !== undefined) {
      this.expansions = new Set(options.expansions);
    }
    if (options.language !== undefined) {
      this.language = options.language;
    }
    this.rebuildIndex();
  }

  private rebuildIndex(): void {
    this.activeBirds = this.allBirds.filter((bird) =>
      this.expansions.has(bird.expansion)
    );

    const keys =
      this.language === 'pt'
        ? [
            { name: 'norm_pt', weight: 1.0 },
            { name: 'norm_scientific', weight: 0.6 },
          ]
        : this.language === 'en'
          ? [
              { name: 'norm_en', weight: 1.0 },
              { name: 'norm_scientific', weight: 0.6 },
            ]
          : [
              { name: 'norm_pt', weight: 1.0 },
              { name: 'norm_en', weight: 1.0 },
              { name: 'norm_scientific', weight: 0.7 },
            ];

    this.fuse = new Fuse(this.activeBirds, {
      keys,
      threshold: this.threshold,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }

  /**
   * Matches a single raw OCR line against the active bird dictionary.
   */
  public matchLine(rawText: string): ScanMatchResult | null {
    if (!isCandidateBirdTitle(rawText)) {
      return null;
    }

    const normalizedQuery = normalizeBirdText(rawText);
    if (!normalizedQuery) {
      return null;
    }

    // 1. Check exact normalized match first for instantaneous O(N) zero-ambiguity hit
    for (const bird of this.activeBirds) {
      const matchesPt =
        (this.language === 'all' || this.language === 'pt') &&
        bird.norm_pt === normalizedQuery;
      const matchesEn =
        (this.language === 'all' || this.language === 'en') &&
        bird.norm_en === normalizedQuery;
      const matchesSci = bird.norm_scientific === normalizedQuery;

      if (matchesPt || matchesEn || matchesSci) {
        return {
          bird,
          score: 0,
          matchedText: rawText.trim(),
          normalizedQuery,
        };
      }
    }

    // 2. Fuzzy match via Fuse.js
    const results = this.fuse.search(normalizedQuery);
    if (results.length === 0) {
      return null;
    }

    const best = results[0];
    const score = best.score ?? 1;
    if (score > this.threshold) {
      return null;
    }

    return {
      bird: best.item,
      score,
      matchedText: rawText.trim(),
      normalizedQuery,
    };
  }

  /**
   * Evaluates multiple OCR lines from a single camera frame and returns the
   * highest-confidence bird match.
   */
  public matchBestFromLines(lines: string[]): ScanMatchResult | null {
    let bestMatch: ScanMatchResult | null = null;

    for (const line of lines) {
      const candidate = this.matchLine(line);
      if (candidate) {
        if (!bestMatch || candidate.score < bestMatch.score) {
          bestMatch = candidate;
        }
        if (bestMatch.score === 0) {
          break;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Searches the bird catalog for the manual browse/search UI.
   */
  public searchCatalog(query: string): BirdCard[] {
    const normalized = normalizeBirdText(query);
    if (!normalized) {
      return this.activeBirds;
    }

    const results = this.fuse.search(normalized);
    return results.map((r) => r.item);
  }
}


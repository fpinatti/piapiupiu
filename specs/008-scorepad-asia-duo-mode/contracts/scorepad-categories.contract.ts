/**
 * Contract: Scorepad Categories & Asia Duo Mode Definition
 * Feature: 008-scorepad-asia-duo-mode
 */

import {
  ScoreCategoryDefinition,
  ScoreCategoryIconType,
  ScorepadExpansionId,
  ScorepadState,
  ScorepadEvaluation,
} from '../../../src/types/scorepad';

export interface IScorepadCategoryContract {
  /**
   * The list of default score categories in the unified table.
   * MUST contain exactly 9 categories:
   * 1. birds (base)
   * 2. bonus (base)
   * 3. goals (base)
   * 4. hummingbirds (americas)
   * 5. eggs (base)
   * 6. food (base)
   * 7. tucked (base)
   * 8. nectar (oceania)
   * 9. duo (asia)
   */
  readonly DEFAULT_SCORE_CATEGORIES: readonly ScoreCategoryDefinition[];

  /**
   * Evaluates end-game scores and standings in real-time across all 9 categories.
   */
  evaluateScorepad(
    state: ScorepadState,
    categories?: readonly ScoreCategoryDefinition[]
  ): ScorepadEvaluation;

  /**
   * Calculates total sum for a single player. Blank or omitted duo score defaults to 0.
   */
  calculatePlayerTotal(
    scores: Record<string, string>,
    categories?: readonly ScoreCategoryDefinition[]
  ): number;
}


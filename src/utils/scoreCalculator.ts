import {
  DEFAULT_SCORE_CATEGORIES,
  PlayerScoreState,
  ScoreCategoryDefinition,
  ScorepadEvaluation,
  ScorepadState,
  ScorepadVersionId,
} from '../types/scorepad';

/**
 * Sanitizes user input to non-negative whole numbers (0..999).
 * Removes any non-numeric character and enforces max 3 digits.
 */
export function sanitizeScoreInput(input: string): string {
  if (!input) return '';
  const digitsOnly = input.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  // Avoid leading zeros like "05" -> "5", but preserve single "0"
  const normalized = digitsOnly.replace(/^0+(?=\d)/, '');
  return normalized.slice(0, 3);
}

/**
 * Safely parses a string score into a non-negative integer (returns 0 on empty/NaN).
 */
export function parseScoreNumber(input?: string): number {
  if (!input) return 0;
  const parsed = parseInt(input, 10);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

/**
 * Returns list of category definitions applicable for the specified version.
 */
export function getActiveCategories(
  version: ScorepadVersionId,
  allCategories: readonly ScoreCategoryDefinition[] = DEFAULT_SCORE_CATEGORIES
): ScoreCategoryDefinition[] {
  return allCategories.filter((category) => {
    if (category.expansion === 'base') return true;
    return category.expansion === version;
  });
}

/**
 * Calculates total sum for a player given their scores map and active category set.
 */
export function calculatePlayerTotal(
  scores: Record<string, string>,
  categories: readonly ScoreCategoryDefinition[]
): number {
  if (!scores) return 0;
  return categories.reduce((sum, cat) => {
    return sum + parseScoreNumber(scores[cat.id]);
  }, 0);
}

/**
 * Evaluates end-game standings and winner comparison between both players.
 */
export function evaluateScorepad(state: ScorepadState): ScorepadEvaluation {
  const activeCategories = getActiveCategories(state.version);
  const player1Total = calculatePlayerTotal(state.player1.scores, activeCategories);
  const player2Total = calculatePlayerTotal(state.player2.scores, activeCategories);
  const diff = Math.abs(player1Total - player2Total);

  if (player1Total === 0 && player2Total === 0) {
    return {
      player1Total: 0,
      player2Total: 0,
      diff: 0,
      leader: 'none',
      isTie: false,
    };
  }

  if (player1Total === player2Total) {
    return {
      player1Total,
      player2Total,
      diff: 0,
      leader: 'tie',
      isTie: true,
    };
  }

  return {
    player1Total,
    player2Total,
    diff,
    leader: player1Total > player2Total ? 'player1' : 'player2',
    isTie: false,
  };
}

/**
 * Creates initial blank scorepad state with default player names.
 */
export function createInitialScorepadState(): ScorepadState {
  return {
    version: 'base',
    player1: {
      id: 'player1',
      name: 'Jogador 1',
      scores: {},
    },
    player2: {
      id: 'player2',
      name: 'Jogador 2',
      scores: {},
    },
  };
}


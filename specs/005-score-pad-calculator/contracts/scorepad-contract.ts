/**
 * Interface Contract: Wingspan Score Pad Calculator
 * Feature: 005-score-pad-calculator
 */

export type ScorepadVersionId = 'base' | 'americas' | 'oceania';

export interface ScoreCategoryDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly expansion: 'base' | 'americas' | 'oceania';
  readonly iconType: 'feather' | 'bonus' | 'goal' | 'egg' | 'food' | 'tucked' | 'hummingbird' | 'nectar';
  readonly max?: number;
}

export interface ScorepadVersionDefinition {
  readonly id: ScorepadVersionId;
  readonly label: string;
  readonly subtitle: string;
}

export interface PlayerScoreState {
  readonly id: 'player1' | 'player2';
  name: string;
  scores: Record<string, string>;
}

export interface ScorepadState {
  version: ScorepadVersionId;
  player1: PlayerScoreState;
  player2: PlayerScoreState;
}

export interface ScorepadEvaluation {
  readonly player1Total: number;
  readonly player2Total: number;
  readonly diff: number;
  readonly leader: 'player1' | 'player2' | 'tie' | 'none';
  readonly isTie: boolean;
}

export const SCOREPAD_VERSIONS: readonly ScorepadVersionDefinition[] = [
  {
    id: 'base',
    label: 'Jogo Base',
    subtitle: 'Regras padrão (6 categorias)',
  },
  {
    id: 'americas',
    label: 'Américas',
    subtitle: 'Com pontuação de Beija-flores',
  },
  {
    id: 'oceania',
    label: 'Oceania',
    subtitle: 'Com pontuação de Néctar',
  },
] as const;

export const DEFAULT_SCORE_CATEGORIES: readonly ScoreCategoryDefinition[] = [
  {
    id: 'birds',
    label: 'Pássaros',
    description: 'Pontos das cartas de aves baixadas',
    expansion: 'base',
    iconType: 'feather',
  },
  {
    id: 'bonus',
    label: 'Cartas Bônus',
    description: 'Pontos de objetivos secretos de fim de jogo',
    expansion: 'base',
    iconType: 'bonus',
  },
  {
    id: 'goals',
    label: 'Metas de Rodada',
    description: 'Pontos das 4 metas de fim de rodada',
    expansion: 'base',
    iconType: 'goal',
  },
  {
    id: 'hummingbirds',
    label: 'Beija-flores',
    description: 'Pontos de beija-flores e interações do alimentador (Américas)',
    expansion: 'americas',
    iconType: 'hummingbird',
  },
  {
    id: 'eggs',
    label: 'Ovos',
    description: '1 ponto por ovo nos ninhos das aves',
    expansion: 'base',
    iconType: 'egg',
  },
  {
    id: 'food',
    label: 'Comida Estocada',
    description: '1 ponto por ficha de alimento estocado nas aves',
    expansion: 'base',
    iconType: 'food',
  },
  {
    id: 'tucked',
    label: 'Cartas Sobpostas',
    description: '1 ponto por carta sobposta nas aves (bandos/caça)',
    expansion: 'base',
    iconType: 'tucked',
  },
  {
    id: 'nectar',
    label: 'Néctar',
    description: 'Pontos de maioria de néctar nos habitats (Oceania)',
    expansion: 'oceania',
    iconType: 'nectar',
  },
] as const;

/**
 * Pure helper contracts implemented in src/utils/scoreCalculator.ts
 */
export interface ScoreCalculatorContract {
  /**
   * Sanitizes user input to non-negative whole numbers (0..999).
   */
  sanitizeScoreInput(input: string): string;

  /**
   * Safely parses a string score into a non-negative integer (returns 0 on empty/NaN).
   */
  parseScoreNumber(input: string): number;

  /**
   * Returns list of category definitions applicable for the specified version.
   */
  getActiveCategories(version: ScorepadVersionId): ScoreCategoryDefinition[];

  /**
   * Calculates total sum for a player given their scores map and active category set.
   */
  calculatePlayerTotal(
    scores: Record<string, string>,
    categories: readonly ScoreCategoryDefinition[]
  ): number;

  /**
   * Evaluates end-game standings and winner comparison between both players.
   */
  evaluateScorepad(state: ScorepadState): ScorepadEvaluation;

  /**
   * Creates initial blank scorepad state with default player names.
   */
  createInitialScorepadState(): ScorepadState;
}


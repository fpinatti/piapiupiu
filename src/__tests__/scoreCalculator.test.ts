import {
  DEFAULT_SCORE_CATEGORIES,
  ScorepadState,
} from '../types/scorepad';
import {
  calculatePlayerTotal,
  createInitialScorepadState,
  evaluateScorepad,
  getActiveCategories,
  parseScoreNumber,
  sanitizeScoreInput,
} from '../utils/scoreCalculator';

describe('scoreCalculator', () => {
  describe('sanitizeScoreInput', () => {
    it('strips non-numeric characters', () => {
      expect(sanitizeScoreInput('abc42!')).toBe('42');
      expect(sanitizeScoreInput('  1 5 ')).toBe('15');
      expect(sanitizeScoreInput('-10')).toBe('10');
    });

    it('limits to 3 digits maximum (0-999)', () => {
      expect(sanitizeScoreInput('12345')).toBe('123');
      expect(sanitizeScoreInput('999')).toBe('999');
    });

    it('handles leading zeros properly', () => {
      expect(sanitizeScoreInput('007')).toBe('7');
      expect(sanitizeScoreInput('05')).toBe('5');
      expect(sanitizeScoreInput('0')).toBe('0');
      expect(sanitizeScoreInput('000')).toBe('0');
    });

    it('returns empty string for empty or non-digit input', () => {
      expect(sanitizeScoreInput('')).toBe('');
      expect(sanitizeScoreInput('abc')).toBe('');
    });
  });

  describe('parseScoreNumber', () => {
    it('parses valid numeric strings into integers', () => {
      expect(parseScoreNumber('42')).toBe(42);
      expect(parseScoreNumber('0')).toBe(0);
      expect(parseScoreNumber('125')).toBe(125);
    });

    it('returns 0 for empty, undefined, or invalid inputs', () => {
      expect(parseScoreNumber('')).toBe(0);
      expect(parseScoreNumber(undefined)).toBe(0);
      expect(parseScoreNumber('invalid')).toBe(0);
    });
  });

  describe('getActiveCategories', () => {
    it('returns 6 core categories for base game', () => {
      const baseCats = getActiveCategories('base');
      expect(baseCats).toHaveLength(6);
      expect(baseCats.map((c) => c.id)).toEqual([
        'birds',
        'bonus',
        'goals',
        'eggs',
        'food',
        'tucked',
      ]);
    });

    it('returns 7 categories for americas expansion including hummingbirds', () => {
      const americasCats = getActiveCategories('americas');
      expect(americasCats).toHaveLength(7);
      expect(americasCats.some((c) => c.id === 'hummingbirds')).toBe(true);
      expect(americasCats.some((c) => c.id === 'nectar')).toBe(false);
    });

    it('returns 7 categories for oceania expansion including nectar', () => {
      const oceaniaCats = getActiveCategories('oceania');
      expect(oceaniaCats).toHaveLength(7);
      expect(oceaniaCats.some((c) => c.id === 'nectar')).toBe(true);
      expect(oceaniaCats.some((c) => c.id === 'hummingbirds')).toBe(false);
    });
  });

  describe('calculatePlayerTotal', () => {
    it('sums active category scores correctly', () => {
      const baseCats = getActiveCategories('base');
      const scores = {
        birds: '45',
        bonus: '10',
        goals: '15',
        eggs: '8',
        food: '4',
        tucked: '6',
      };
      // 45 + 10 + 15 + 8 + 4 + 6 = 88
      expect(calculatePlayerTotal(scores, baseCats)).toBe(88);
    });

    it('ignores empty fields and treats them as 0', () => {
      const baseCats = getActiveCategories('base');
      const scores = {
        birds: '30',
        eggs: '5',
      };
      expect(calculatePlayerTotal(scores, baseCats)).toBe(35);
    });

    it('ignores expansion categories if they are not in the active set', () => {
      const baseCats = getActiveCategories('base');
      const scores = {
        birds: '30',
        hummingbirds: '15',
        nectar: '20',
      };
      // baseCats does not include hummingbirds or nectar
      expect(calculatePlayerTotal(scores, baseCats)).toBe(30);
    });

    it('includes expansion categories when active', () => {
      const americasCats = getActiveCategories('americas');
      const scores = {
        birds: '30',
        hummingbirds: '15',
      };
      expect(calculatePlayerTotal(scores, americasCats)).toBe(45);
    });
  });

  describe('evaluateScorepad', () => {
    it('returns leader none when both players have 0 points', () => {
      const state = createInitialScorepadState();
      const evalResult = evaluateScorepad(state);
      expect(evalResult).toEqual({
        player1Total: 0,
        player2Total: 0,
        diff: 0,
        leader: 'none',
        isTie: false,
      });
    });

    it('correctly identifies player1 as leader with difference', () => {
      const state: ScorepadState = {
        version: 'base',
        player1: {
          id: 'player1',
          name: 'Player 1',
          scores: { birds: '50', eggs: '10' }, // 60
        },
        player2: {
          id: 'player2',
          name: 'Player 2',
          scores: { birds: '40', eggs: '12' }, // 52
        },
      };
      const evalResult = evaluateScorepad(state);
      expect(evalResult).toEqual({
        player1Total: 60,
        player2Total: 52,
        diff: 8,
        leader: 'player1',
        isTie: false,
      });
    });

    it('correctly identifies player2 as leader with difference', () => {
      const state: ScorepadState = {
        version: 'base',
        player1: {
          id: 'player1',
          name: 'Player 1',
          scores: { birds: '30' },
        },
        player2: {
          id: 'player2',
          name: 'Player 2',
          scores: { birds: '45' },
        },
      };
      const evalResult = evaluateScorepad(state);
      expect(evalResult.leader).toBe('player2');
      expect(evalResult.diff).toBe(15);
      expect(evalResult.isTie).toBe(false);
    });

    it('correctly identifies a tie when scores are equal and positive', () => {
      const state: ScorepadState = {
        version: 'base',
        player1: {
          id: 'player1',
          name: 'Player 1',
          scores: { birds: '40', bonus: '20' }, // 60
        },
        player2: {
          id: 'player2',
          name: 'Player 2',
          scores: { birds: '50', eggs: '10' }, // 60
        },
      };
      const evalResult = evaluateScorepad(state);
      expect(evalResult.leader).toBe('tie');
      expect(evalResult.diff).toBe(0);
      expect(evalResult.isTie).toBe(true);
    });

    it('dynamically factors expansion points when version is switched', () => {
      const state: ScorepadState = {
        version: 'americas',
        player1: {
          id: 'player1',
          name: 'Player 1',
          scores: { birds: '40', hummingbirds: '15' }, // 55
        },
        player2: {
          id: 'player2',
          name: 'Player 2',
          scores: { birds: '50', hummingbirds: '0' }, // 50
        },
      };
      let evalResult = evaluateScorepad(state);
      expect(evalResult.player1Total).toBe(55);
      expect(evalResult.player2Total).toBe(50);
      expect(evalResult.leader).toBe('player1');

      // Switch to base: hummingbirds ignored, so player2 (50) beats player1 (40)
      const baseState: ScorepadState = {
        ...state,
        version: 'base',
      };
      evalResult = evaluateScorepad(baseState);
      expect(evalResult.player1Total).toBe(40);
      expect(evalResult.player2Total).toBe(50);
      expect(evalResult.leader).toBe('player2');
    });
  });

  describe('Quickstart Scenarios Verification', () => {
    it('Scenario A: Core 2-Player Tallying (Base Game)', () => {
      const state: ScorepadState = {
        version: 'base',
        player1: {
          id: 'player1',
          name: 'Jogador 1',
          scores: { birds: '45', eggs: '12', goals: '18' },
        },
        player2: {
          id: 'player2',
          name: 'Jogador 2',
          scores: { birds: '52', bonus: '14', tucked: '6' },
        },
      };

      const evalResult = evaluateScorepad(state);
      expect(evalResult.player1Total).toBe(75);
      expect(evalResult.player2Total).toBe(72);
      expect(evalResult.diff).toBe(3);
      expect(evalResult.leader).toBe('player1');
      expect(evalResult.isTie).toBe(false);
    });

    it('Scenario B: Expansion Mode (Americas & Oceania)', () => {
      // Start in Americas mode
      const americasState: ScorepadState = {
        version: 'americas',
        player1: {
          id: 'player1',
          name: 'Jogador 1',
          scores: { birds: '45', eggs: '12', goals: '18', hummingbirds: '15' },
        },
        player2: {
          id: 'player2',
          name: 'Jogador 2',
          scores: { birds: '52', bonus: '14', tucked: '6', nectar: '10' },
        },
      };

      let evalResult = evaluateScorepad(americasState);
      // P1: 45 + 12 + 18 + 15 = 90
      expect(evalResult.player1Total).toBe(90);
      // P2: 52 + 14 + 6 = 72 (nectar ignored in Americas)
      expect(evalResult.player2Total).toBe(72);

      // Switch to Oceania mode: hummingbirds ignored, nectar counted
      const oceaniaState: ScorepadState = {
        ...americasState,
        version: 'oceania',
      };

      evalResult = evaluateScorepad(oceaniaState);
      // P1: 45 + 12 + 18 = 75 (hummingbirds ignored in Oceania)
      expect(evalResult.player1Total).toBe(75);
      // P2: 52 + 14 + 6 + 10 = 82
      expect(evalResult.player2Total).toBe(82);
      expect(evalResult.leader).toBe('player2');
      expect(evalResult.diff).toBe(7);

      // Switch back to Americas: 15 points preserved in state
      evalResult = evaluateScorepad(americasState);
      expect(evalResult.player1Total).toBe(90);
    });
  });
});

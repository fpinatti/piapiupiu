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
    it('returns all 8 categories by default for unified table mode', () => {
      const allCats = getActiveCategories();
      expect(allCats).toHaveLength(8);
      expect(allCats.map((c) => c.id)).toEqual([
        'birds',
        'bonus',
        'goals',
        'hummingbirds',
        'eggs',
        'food',
        'tucked',
        'nectar',
      ]);
    });

    it('supports backward-compatible filtering if version is passed', () => {
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
  });

  describe('calculatePlayerTotal', () => {
    it('sums active category scores correctly across unified table', () => {
      const scores = {
        birds: '45',
        bonus: '10',
        goals: '15',
        eggs: '8',
        food: '4',
        tucked: '6',
      };
      // 45 + 10 + 15 + 8 + 4 + 6 = 88
      expect(calculatePlayerTotal(scores)).toBe(88);
    });

    it('ignores empty expansion fields and treats them as 0', () => {
      const scores = {
        birds: '30',
        eggs: '5',
        hummingbirds: '',
        nectar: '',
      };
      expect(calculatePlayerTotal(scores)).toBe(35);
    });

    it('seamlessly includes expansion points in total score when filled', () => {
      const scores = {
        birds: '40',
        eggs: '10',
        hummingbirds: '15',
        nectar: '8',
      };
      // 40 + 10 + 15 + 8 = 73
      expect(calculatePlayerTotal(scores)).toBe(73);
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

    it('calculates totals with multiple expansion categories simultaneously', () => {
      const state: ScorepadState = {
        player1: {
          id: 'player1',
          name: 'Player 1',
          scores: { birds: '40', hummingbirds: '15', nectar: '5' }, // 60
        },
        player2: {
          id: 'player2',
          name: 'Player 2',
          scores: { birds: '50', nectar: '12' }, // 62
        },
      };
      const evalResult = evaluateScorepad(state);
      expect(evalResult.player1Total).toBe(60);
      expect(evalResult.player2Total).toBe(62);
      expect(evalResult.leader).toBe('player2');
      expect(evalResult.diff).toBe(2);
    });
  });

  describe('Quickstart Scenarios Verification', () => {
    it('Scenario B: Base Game Scoring (Leaving Expansion Rows Blank)', () => {
      const state: ScorepadState = {
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

    it('Scenario C: Mixed / Multi-Expansion Scoring', () => {
      const state: ScorepadState = {
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

      let evalResult = evaluateScorepad(state);
      expect(evalResult.player1Total).toBe(90);
      expect(evalResult.player2Total).toBe(82);
      expect(evalResult.leader).toBe('player1');
      expect(evalResult.diff).toBe(8);

      // Add Oceania nectar to player 1 as well
      const multiState: ScorepadState = {
        ...state,
        player1: {
          ...state.player1,
          scores: { ...state.player1.scores, nectar: '5' },
        },
      };

      evalResult = evaluateScorepad(multiState);
      expect(evalResult.player1Total).toBe(95);
      expect(evalResult.player2Total).toBe(82);
      expect(evalResult.diff).toBe(13);
    });
  });
});

import birdsCatalog from '../data/birds.json';
import { BirdMatcher, shouldTriggerBirdAudio } from '../services/birdMatcher';
import { BirdCard } from '../types/bird';

describe('BirdMatcher fuzzy OCR matching', () => {
  const matcher = new BirdMatcher(birdsCatalog as BirdCard[], {
    threshold: 0.35,
  });

  it('matches exact Portuguese and English uppercase card headers', () => {
    const blueJayPt = matcher.matchLine('GAIO-AZUL');
    expect(blueJayPt?.bird.id).toBe('blue_jay');
    expect(blueJayPt?.score).toBe(0);

    const eurasianJayEn = matcher.matchLine('EURASIAN JAY');
    expect(eurasianJayEn?.bird.id).toBe('eurasian_jay');
    expect(eurasianJayEn?.score).toBe(0);
  });

  it('tolerates sleeve glare and OCR typos via normalization + Fuse.js', () => {
    const glitch1 = matcher.matchLine('GA1O-AZUL');
    expect(glitch1?.bird.id).toBe('blue_jay');

    const glitch2 = matcher.matchLine('CORUJA DAS TORRE');
    expect(glitch2?.bird.id).toBe('barn_owl');

    const glitch3 = matcher.matchLine('GROU DA MANCHURIA');
    expect(glitch3?.bird.id).toBe('red_crowned_crane');
  });

  it('selects the highest-confidence bird from multiple OCR lines in a frame', () => {
    const lines = [
      'QUANDO JOGAR: Compre 1 carta',
      'KOOKABURRA-RISONHA',
      'Dacelo novaeguineae',
    ];
    const match = matcher.matchBestFromLines(lines);
    expect(match?.bird.id).toBe('laughing_kookaburra');
  });

  it('respects expansion filters', () => {
    const oceaniaOnly = new BirdMatcher(birdsCatalog as BirdCard[], {
      expansions: ['oceania'],
    });
    expect(oceaniaOnly.matchLine('TUI')?.bird.id).toBe('tui');
    expect(oceaniaOnly.matchLine('GAIO-AZUL')).toBeNull();
  });
});

describe('shouldTriggerBirdAudio debounce & anti-spam', () => {
  it('triggers immediately when a different bird is scanned', () => {
    const lastPlayed = { id: 'blue_jay', time: 1000 };
    expect(shouldTriggerBirdAudio('barn_owl', 1500, lastPlayed, 6000)).toBe(true);
  });

  it('blocks re-triggering the same bird within the 6-second window', () => {
    const lastPlayed = { id: 'blue_jay', time: 1000 };
    expect(shouldTriggerBirdAudio('blue_jay', 3500, lastPlayed, 6000)).toBe(false);
    expect(shouldTriggerBirdAudio('blue_jay', 6999, lastPlayed, 6000)).toBe(false);
  });

  it('allows re-triggering the same bird after 6 seconds have elapsed', () => {
    const lastPlayed = { id: 'blue_jay', time: 1000 };
    expect(shouldTriggerBirdAudio('blue_jay', 7000, lastPlayed, 6000)).toBe(true);
  });
});


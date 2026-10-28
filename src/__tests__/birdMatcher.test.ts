import birdsCatalog from '../data/birds.json';
import { BirdMatcher, shouldTriggerBirdAudio } from '../services/birdMatcher';
import { BirdCard, ExpansionId } from '../types/bird';

describe('Complete Wingspan Catalog & 5-Expansion Coverage', () => {
  const catalog = birdsCatalog as BirdCard[];

  it('contains all 597 official bird cards across Base, Europe, Oceania, Asia, and Americas', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(530);
    expect(catalog.length).toBe(597);

    const counts: Record<ExpansionId, number> = {
      base: 0,
      europe: 0,
      oceania: 0,
      asia: 0,
      americas: 0,
    };

    const ids = new Set<string>();
    for (const bird of catalog) {
      counts[bird.expansion] = (counts[bird.expansion] || 0) + 1;
      expect(bird.id).toMatch(/^[a-z0-9_]+$/);
      expect(ids.has(bird.id)).toBe(false);
      ids.add(bird.id);
      expect(bird.name_pt.trim().length).toBeGreaterThan(0);
      expect(bird.name_en.trim().length).toBeGreaterThan(0);
      expect(bird.scientific.trim().length).toBeGreaterThan(0);
      expect(bird.audio).toBe(`${bird.id}.mp3`);
    }

    expect(counts.base).toBe(180);
    expect(counts.europe).toBe(81);
    expect(counts.oceania).toBe(95);
    expect(counts.asia).toBe(90);
    expect(counts.americas).toBe(151);
  });
});

describe('BirdMatcher fuzzy OCR matching', () => {
  const matcher = new BirdMatcher(birdsCatalog as BirdCard[], {
    threshold: 0.35,
  });

  it('matches exact Portuguese and English uppercase card headers across all 5 expansions', () => {
    const blueJayPt = matcher.matchLine('GAIO-AZUL');
    expect(blueJayPt?.bird.id).toBe('blue_jay');
    expect(blueJayPt?.score).toBe(0);

    const eurasianJayEn = matcher.matchLine('EURASIAN JAY');
    expect(eurasianJayEn?.bird.id).toBe('eurasian_jay');
    expect(eurasianJayEn?.score).toBe(0);

    const andeanCondorEn = matcher.matchLine('ANDEAN CONDOR');
    expect(andeanCondorEn?.bird.id).toBe('andean_condor');
    expect(andeanCondorEn?.bird.expansion).toBe('americas');

    const rubyTopazEn = matcher.matchLine('RUBY-TOPAZ HUMMINGBIRD');
    expect(rubyTopazEn?.bird.id).toBe('ruby_topaz_hummingbird');
    expect(rubyTopazEn?.bird.expansion).toBe('americas');
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

  it('respects expansion filters including americas and completes full-catalog search in <100ms', () => {
    const oceaniaOnly = new BirdMatcher(birdsCatalog as BirdCard[], {
      expansions: ['oceania'],
    });
    expect(oceaniaOnly.matchLine('TUI')?.bird.id).toBe('tui');
    expect(oceaniaOnly.matchLine('GAIO-AZUL')).toBeNull();

    const americasOnly = new BirdMatcher(birdsCatalog as BirdCard[], {
      expansions: ['americas'],
    });
    const americasList = americasOnly.searchCatalog('');
    expect(americasList.length).toBe(151);
    expect(americasOnly.matchLine('ANDEAN CONDOR')?.bird.id).toBe('andean_condor');
    expect(americasOnly.matchLine('GAIO-AZUL')).toBeNull();

    const start = performance.now();
    const filtered = matcher.searchCatalog('beija-flor');
    const elapsedMs = performance.now() - start;
    expect(filtered.length).toBeGreaterThanOrEqual(25);
    expect(elapsedMs).toBeLessThan(100);
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

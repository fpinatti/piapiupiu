import { isCandidateBirdTitle, normalizeBirdText } from '../utils/normalizeText';

describe('normalizeBirdText', () => {
  it('strips diacritics and normalizes hyphens to spaces', () => {
    expect(normalizeBirdText('Grou-da-manchúria')).toBe('grou da manchuria');
    expect(normalizeBirdText('ÁGUIA-CARECA')).toBe('aguia careca');
    expect(normalizeBirdText('Lóris-arco-íris')).toBe('loris arco iris');
  });

  it('corrects common OCR digit confusions inside uppercase words (1 -> i, 0 -> o)', () => {
    expect(normalizeBirdText('GA1O-AZUL')).toBe('gaio azul');
    expect(normalizeBirdText('GA1O AZUL')).toBe('gaio azul');
    expect(normalizeBirdText('C0RUJA-DAS-T0RRES')).toBe('coruja das torres');
  });

  it('handles empty or whitespace inputs gracefully', () => {
    expect(normalizeBirdText('')).toBe('');
    expect(normalizeBirdText('   ')).toBe('');
  });
});

describe('isCandidateBirdTitle', () => {
  it('accepts valid short and long bird names', () => {
    expect(isCandidateBirdTitle('TUI')).toBe(true);
    expect(isCandidateBirdTitle('GAIO-AZUL')).toBe(true);
    expect(isCandidateBirdTitle('RUBY-THROATED HUMMINGBIRD')).toBe(true);
  });

  it('rejects short noise strings and pure numbers', () => {
    expect(isCandidateBirdTitle('A')).toBe(false);
    expect(isCandidateBirdTitle('8')).toBe(false);
    expect(isCandidateBirdTitle('120')).toBe(false);
  });

  it('rejects Wingspan card ability and power text', () => {
    expect(isCandidateBirdTitle('QUANDO ATIVAR: Ganhe 1 trigo')).toBe(false);
    expect(isCandidateBirdTitle('WHEN PLAYED: Draw 2 bonus cards')).toBe(false);
    expect(isCandidateBirdTitle('UMA VEZ ENTRE TURNOS')).toBe(false);
  });
});


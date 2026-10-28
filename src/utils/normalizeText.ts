/**
 * Non-title ability keywords frequently printed on Wingspan cards.
 * Lines starting with or matching these phrases are ignored by the OCR scanner
 * so card power descriptions never trigger false-positive bird matches.
 */
const IGNORED_CARD_PHRASES = [
  'quando jogar',
  'quando ativar',
  'uma vez entre turnos',
  'fim do jogo',
  'fim da rodada',
  'when played',
  'when activated',
  'once between turns',
  'round end',
  'game end',
  'all players',
  'todos os jogadores',
  'ganhe 1',
  'gain 1',
  'compre 1',
  'draw 1',
  'bote 1 ovo',
  'lay 1 egg',
];

/**
 * Normalizes a string for fuzzy bird-name comparison:
 * 1. Fixes common OCR digit-for-letter substitutions when adjacent to letters (e.g., "GA1O" -> "GAIO", "C0RUJA" -> "CORUJA").
 * 2. Strips diacritics/accents via Unicode NFD decomposition.
 * 3. Replaces hyphens and punctuation with spaces.
 * 4. Collapses multiple spaces and converts to lowercase.
 */
export function normalizeBirdText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Replace OCR digit confusions inside word tokens before lowercasing
  const ocrCleaned = input
    .replace(/([A-Za-zÀ-ÿ])1([A-Za-zÀ-ÿ])/g, '$1i$2')
    .replace(/([A-Za-zÀ-ÿ])0([A-Za-zÀ-ÿ])/g, '$1o$2')
    .replace(/^1([A-Za-zÀ-ÿ]{2,})/g, 'i$1')
    .replace(/^0([A-Za-zÀ-ÿ]{2,})/g, 'o$1');

  return ocrCleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_'".,:;!?()/\\[\]{}+*#$%&~`^|<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines whether a raw OCR line is a plausible bird card title rather than
 * numbers, short noise artifacts, or card ability text.
 */
export function isCandidateBirdTitle(rawText: string): boolean {
  const normalized = normalizeBirdText(rawText);
  if (normalized.length < 3 || normalized.length > 48) {
    return false;
  }

  // Reject purely numeric strings
  if (/^\d+$/.test(normalized.replace(/\s+/g, ''))) {
    return false;
  }

  // Reject known Wingspan card ability headers / rule text
  for (const phrase of IGNORED_CARD_PHRASES) {
    if (normalized.startsWith(phrase) || normalized.includes(phrase)) {
      return false;
    }
  }

  return true;
}


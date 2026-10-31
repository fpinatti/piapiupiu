import * as Speech from 'expo-speech';
import { audioService } from '../services/audioService';
import { birdSpeechService } from '../services/birdSpeechService';
import { BirdCard } from '../types/bird';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([
    { identifier: 'pt-br-x-afs-local', name: 'pt-br-x-afs-local', language: 'pt-BR', quality: 'Default' },
  ]),
}));

jest.mock('../services/audioService', () => ({
  audioService: {
    stop: jest.fn().mockResolvedValue(undefined),
    playBirdSound: jest.fn().mockResolvedValue(undefined),
  },
}));

const SAMPLE_BIRD: BirdCard = {
  id: 'quetzal_resplandecente',
  name_pt: 'Quetzal-resplandecente',
  name_en: 'Resplendent Quetzal',
  scientific: 'Pharomachrus mocinno',
  expansion: 'americas',
  habitats: ['forest'],
  audio: 'quetzal.mp3',
};

describe('birdSpeechService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    birdSpeechService.setEnabled(true);
    birdSpeechService.setAutoAnnounce(true);
    await birdSpeechService.stop();
  });

  describe('formatSpeechPhrase', () => {
    it('constructs comedic phrase with "piu! piu!", popular name and scientific name', () => {
      const phrase = birdSpeechService.formatSpeechPhrase(SAMPLE_BIRD);
      expect(phrase).toBe('piu! piu! Quetzal-resplandecente... Pharomachrus mocinno.');
    });

    it('handles hyphenated and accented bird names cleanly', () => {
      const bird = {
        id: 'alcatraz_de_abbott',
        name_pt: 'Alcatraz-de-abbott',
        scientific: 'Papasula abbotti',
      };
      const phrase = birdSpeechService.formatSpeechPhrase(bird);
      expect(phrase).toBe('piu! piu! Alcatraz-de-abbott... Papasula abbotti.');
    });

    it('falls back gracefully when missing popular or scientific name', () => {
      const onlyPt = birdSpeechService.formatSpeechPhrase({
        id: 'coruja',
        name_pt: 'Coruja-buraqueira',
        scientific: '',
      });
      expect(onlyPt).toBe('piu! piu! Coruja-buraqueira.');

      const onlyLatin = birdSpeechService.formatSpeechPhrase({
        id: 'athene',
        name_pt: '',
        scientific: 'Athene cunicularia',
      });
      expect(onlyLatin).toBe('piu! piu! Athene cunicularia.');

      const empty = birdSpeechService.formatSpeechPhrase({
        id: 'none',
        name_pt: '',
        scientific: '',
      });
      expect(empty).toBe('piu! piu!');
    });
  });

  describe('speakBird', () => {
    it('calls audioService.stop to guarantee strict single-player audio exclusivity', async () => {
      await birdSpeechService.speakBird(SAMPLE_BIRD);
      expect(audioService.stop).toHaveBeenCalledTimes(1);
    });

    it('calls Speech.speak with pt-BR locale, resolved pt voice and comedic cadence', async () => {
      await birdSpeechService.speakBird(SAMPLE_BIRD);

      expect(Speech.speak).toHaveBeenCalledWith(
        'piu! piu! Quetzal-resplandecente... Pharomachrus mocinno.',
        expect.objectContaining({
          language: expect.stringMatching(/^pt/),
          voice: 'pt-br-x-afs-local',
          pitch: 1.10,
          rate: 0.95,
        })
      );
    });

    it('updates speech state to isSpeaking=true and tracks currentBirdId', async () => {
      await birdSpeechService.speakBird(SAMPLE_BIRD);

      const state = birdSpeechService.getState();
      expect(state.isSpeaking).toBe(true);
      expect(state.currentBirdId).toBe('quetzal_resplandecente');
      expect(birdSpeechService.isSpeaking()).toBe(true);
    });

    it('updates speech state to isSpeaking=false when utterance completes', async () => {
      let capturedOnDone: (() => void) | undefined;
      (Speech.speak as jest.Mock).mockImplementation((_text, options) => {
        capturedOnDone = options.onDone;
      });

      const onDoneCallback = jest.fn();
      await birdSpeechService.speakBird(SAMPLE_BIRD, { onDone: onDoneCallback });

      expect(birdSpeechService.isSpeaking()).toBe(true);
      expect(capturedOnDone).toBeDefined();

      capturedOnDone!();

      expect(birdSpeechService.isSpeaking()).toBe(false);
      expect(birdSpeechService.getState().currentBirdId).toBeNull();
      expect(onDoneCallback).toHaveBeenCalled();
    });

    it('allows overriding voice or language options explicitly', async () => {
      await birdSpeechService.speakBird(SAMPLE_BIRD, {
        voice: 'custom-pt-voice',
        language: 'pt-BR',
      });

      expect(Speech.speak).toHaveBeenCalledWith(
        'piu! piu! Quetzal-resplandecente... Pharomachrus mocinno.',
        expect.objectContaining({
          voice: 'custom-pt-voice',
          language: expect.stringMatching(/^pt/),
        })
      );
    });

    it('ignores speakBird when speech service is disabled', async () => {
      birdSpeechService.setEnabled(false);
      await birdSpeechService.speakBird(SAMPLE_BIRD);

      expect(Speech.speak).not.toHaveBeenCalled();
      expect(birdSpeechService.isSpeaking()).toBe(false);
    });
  });

  describe('stop', () => {
    it('calls Speech.stop and resets active speech state', async () => {
      await birdSpeechService.speakBird(SAMPLE_BIRD);
      expect(birdSpeechService.isSpeaking()).toBe(true);

      await birdSpeechService.stop();

      expect(Speech.stop).toHaveBeenCalled();
      expect(birdSpeechService.isSpeaking()).toBe(false);
      expect(birdSpeechService.getState().currentBirdId).toBeNull();
    });
  });

  describe('settings and subscriptions', () => {
    it('toggles auto-announce preference', () => {
      expect(birdSpeechService.isAutoAnnounceEnabled()).toBe(true);

      birdSpeechService.setAutoAnnounce(false);
      expect(birdSpeechService.isAutoAnnounceEnabled()).toBe(false);

      birdSpeechService.setAutoAnnounce(true);
      expect(birdSpeechService.isAutoAnnounceEnabled()).toBe(true);
    });

    it('notifies listeners of speech state transitions', async () => {
      const listener = jest.fn();
      const unsubscribe = birdSpeechService.subscribe(listener);

      // Initial state call
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isSpeaking: false, currentBirdId: null })
      );

      await birdSpeechService.speakBird(SAMPLE_BIRD);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isSpeaking: true, currentBirdId: 'quetzal_resplandecente' })
      );

      await birdSpeechService.stop();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isSpeaking: false, currentBirdId: null })
      );

      unsubscribe();
    });
  });

  describe('audio exclusivity integration (US3)', () => {
    it('stops speech when audioService plays a real bird sound', async () => {
      let registeredHook: (() => void) | undefined;
      (audioService.setPrePlayHook as jest.Mock) = jest.fn((hook) => {
        registeredHook = hook;
      });

      // Re-initialize hook
      if (typeof audioService.setPrePlayHook === 'function') {
        audioService.setPrePlayHook(() => {
          birdSpeechService.stop();
        });
      }

      await birdSpeechService.speakBird(SAMPLE_BIRD);
      expect(birdSpeechService.isSpeaking()).toBe(true);

      // Trigger pre-play hook from audioService
      await registeredHook!();

      expect(birdSpeechService.isSpeaking()).toBe(false);
      expect(birdSpeechService.getState().currentBirdId).toBeNull();
    });
  });
});

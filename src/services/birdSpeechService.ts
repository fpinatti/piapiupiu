/**
 * Bird Speech Service (Text-To-Speech).
 * Feature: 007-bird-name-tts
 *
 * Vocalizes bird names with comedic "Piu piu" intro in Brazilian Portuguese.
 * Integrates with audioService to maintain Constitution Principle III (single-player audio exclusivity).
 */

import * as Speech from 'expo-speech';
import { BirdCard } from '../types/bird';
import { BirdSpeechOptions, IBirdSpeechService, SpeechSettings, SpeechState } from '../types/speech';
import { audioService } from './audioService';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

class BirdSpeechService implements IBirdSpeechService {
  private state: SpeechState = {
    isSpeaking: false,
    currentBirdId: null,
    speechRequestId: 0,
  };

  private settings: SpeechSettings = {
    autoAnnounceOnCardOpen: true,
    enabled: true,
  };

  private listeners = new Set<(state: SpeechState) => void>();
  private cachedWebVoice: SpeechSynthesisVoice | null = null;
  private cachedNativeVoice: { voice?: string; language?: string } | null = null;

  constructor() {
    if (audioService && typeof audioService.setPrePlayHook === 'function') {
      audioService.setPrePlayHook(() => {
        this.stop();
      });
    }

    // Warm up voice resolution eagerly to prevent accent/voice fallback
    if (isWeb && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.resolveWebPortugueseVoice().catch(() => {});
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.cachedWebVoice = null;
          this.resolveWebPortugueseVoice().catch(() => {});
        };
      }
    } else {
      this.resolveNativePortugueseVoice().catch(() => {});
    }
  }

  /**
   * Safe platform detection that works across Node (Jest) and React Native runtime.
   */
  private getPlatformOS(): 'web' | 'android' | 'ios' | 'other' {
    if (isWeb) return 'web';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const rn = require('react-native');
      if (rn?.Platform?.OS) return rn.Platform.OS;
    } catch {
      // Node or test environment
    }
    return 'other';
  }

  /**
   * Resolves a Brazilian Portuguese voice for Web Speech API (window.speechSynthesis).
   * Browsers (especially Chrome/Safari) ignore utterance.lang if utterance.voice is not explicitly specified.
   */
  private async resolveWebPortugueseVoice(): Promise<SpeechSynthesisVoice | null> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return null;
    }
    if (this.cachedWebVoice) {
      return this.cachedWebVoice;
    }

    const findVoice = (): SpeechSynthesisVoice | null => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;

      // 1. pt-BR exact
      const ptBr = voices.find((v) => {
        const lang = (v.lang || '').replace('_', '-').toLowerCase();
        return lang === 'pt-br';
      });
      if (ptBr) return ptBr;

      // 2. Any Portuguese (pt-PT, pt)
      const ptAny = voices.find((v) => (v.lang || '').toLowerCase().startsWith('pt'));
      if (ptAny) return ptAny;

      // 3. Name heuristic (e.g., "Google português do Brasil", "Luciana", "Felipe")
      const ptName = voices.find((v) => {
        const n = (v.name || '').toLowerCase();
        return n.includes('portug') || n.includes('brasil') || n.includes('brazil');
      });
      return ptName ?? null;
    };

    const direct = findVoice();
    if (direct) {
      this.cachedWebVoice = direct;
      return direct;
    }

    // Wait for voiceschanged if browser hasn't populated voices yet
    return new Promise<SpeechSynthesisVoice | null>((resolve) => {
      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          const v = findVoice();
          if (v) this.cachedWebVoice = v;
          resolve(v);
        }
      };

      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = finish;
      }
      setTimeout(finish, 300);
    });
  }

  /**
   * Resolves a Brazilian Portuguese voice from expo-speech.
   */
  private async resolveNativePortugueseVoice(): Promise<{ voice?: string; language?: string } | null> {
    if (this.cachedNativeVoice) {
      return this.cachedNativeVoice;
    }

    try {
      if (Speech && typeof Speech.getAvailableVoicesAsync === 'function') {
        const voices = await Speech.getAvailableVoicesAsync();
        if (voices && voices.length > 0) {
          // 1. pt-BR exact
          const ptBr = voices.find((v) => {
            const l = (v.language || '').replace('_', '-').toLowerCase();
            return l === 'pt-br';
          });
          if (ptBr) {
            this.cachedNativeVoice = { voice: ptBr.identifier, language: ptBr.language };
            return this.cachedNativeVoice;
          }

          // 2. Any Portuguese
          const ptAny = voices.find((v) => (v.language || '').toLowerCase().startsWith('pt'));
          if (ptAny) {
            this.cachedNativeVoice = { voice: ptAny.identifier, language: ptAny.language };
            return this.cachedNativeVoice;
          }

          // 3. Name heuristic
          const ptName = voices.find((v) => {
            const n = (v.name || '').toLowerCase();
            return n.includes('portug') || n.includes('brasil') || n.includes('brazil');
          });
          if (ptName) {
            this.cachedNativeVoice = { voice: ptName.identifier, language: ptName.language };
            return this.cachedNativeVoice;
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }

    return null;
  }

  /**
   * Constructs the comedic phrase imitating a bird chirp: "piu! piu! [Nome Popular]... [Nome Científico]."
   * Uses lowercase "piu!" to prevent TTS normalizers from treating "Piu" as an acronym (e.g. PIU)
   * and spelling out the letters "pê-i-u". The exclamation marks create playful bird-chirp prosody.
   */
  public formatSpeechPhrase(bird: Pick<BirdCard, 'id' | 'name_pt' | 'scientific'>): string {
    const popular = (bird?.name_pt ?? '').trim();
    const scientific = (bird?.scientific ?? '').trim();

    if (!popular && !scientific) {
      return 'piu! piu!';
    }
    if (!popular) {
      return `piu! piu! ${scientific}.`;
    }
    if (!scientific) {
      return `piu! piu! ${popular}.`;
    }

    return `piu! piu! ${popular}... ${scientific}.`;
  }

  /**
   * Vocalizes the bird's common and scientific names preceded by comedic "Piu piu".
   * Automatically stops any active biological audio and halts any previous speech utterance.
   */
  public async speakBird(bird: BirdCard, options?: BirdSpeechOptions): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    const currentReqId = ++this.state.speechRequestId;

    // Strict Single-Player Exclusivity (Constitution Principle III)
    try {
      await audioService.stop();
    } catch {
      // Non-blocking
    }

    // Stop any existing speech utterance
    try {
      await this.stopSynthesis();
    } catch {
      // Non-blocking
    }

    if (this.state.speechRequestId !== currentReqId) {
      return;
    }

    const phrase = this.formatSpeechPhrase(bird);
    const language = options?.language ?? 'pt-BR';
    const pitch = options?.pitch ?? 1.10;
    const rate = options?.rate ?? 0.95;

    this.updateState({
      isSpeaking: true,
      currentBirdId: bird.id,
      speechRequestId: currentReqId,
    });

    const handleFinish = () => {
      if (this.state.speechRequestId === currentReqId) {
        this.updateState({
          isSpeaking: false,
          currentBirdId: null,
          speechRequestId: currentReqId,
        });
        if (options?.onDone) options.onDone();
      }
    };

    const handleStopped = () => {
      if (this.state.speechRequestId === currentReqId) {
        this.updateState({
          isSpeaking: false,
          currentBirdId: null,
          speechRequestId: currentReqId,
        });
        if (options?.onStopped) options.onStopped();
      }
    };

    const handleError = (error: any) => {
      if (this.state.speechRequestId === currentReqId) {
        this.updateState({
          isSpeaking: false,
          currentBirdId: null,
          speechRequestId: currentReqId,
        });
        if (options?.onError) options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    try {
      // Web platform native SpeechSynthesis fallback
      if (isWeb && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const ptVoice = await this.resolveWebPortugueseVoice();
        const utterance = new SpeechSynthesisUtterance(phrase);
        if (ptVoice) {
          utterance.voice = ptVoice;
          utterance.lang = ptVoice.lang;
        } else {
          utterance.lang = 'pt-BR';
        }
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.onend = handleFinish;
        utterance.onerror = (e) => handleError(e.error);
        window.speechSynthesis.speak(utterance);
        return;
      }

      // Native iOS / Android expo-speech
      const os = this.getPlatformOS();
      const nativeVoice = await this.resolveNativePortugueseVoice();

      // On Android, passing a hyphenated locale like 'pt-BR' causes Locale.Builder().setLanguage("pt-BR")
      // in expo-speech to throw IllformedLocaleException and silently fall back to default English locale.
      // Passing 'pt' ensures Android sets Portuguese locale properly without throwing.
      const languageCode =
        os === 'android'
          ? (options?.language ? options.language.split('-')[0] : 'pt')
          : (options?.language ?? 'pt-BR');

      Speech.speak(phrase, {
        language: languageCode,
        voice: options?.voice ?? nativeVoice?.voice,
        pitch,
        rate,
        onDone: handleFinish,
        onStopped: handleStopped,
        onError: handleError,
      });
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Immediately halts any active speech output and cancels in-flight announcements.
   */
  public async stop(): Promise<void> {
    this.state.speechRequestId++;
    this.updateState({
      isSpeaking: false,
      currentBirdId: null,
      speechRequestId: this.state.speechRequestId,
    });
    await this.stopSynthesis();
  }

  private async stopSynthesis(): Promise<void> {
    try {
      if (isWeb && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore
    }

    try {
      if (Speech && typeof Speech.stop === 'function') {
        await Speech.stop();
      }
    } catch {
      // Ignore
    }
  }

  public isSpeaking(): boolean {
    return this.state.isSpeaking;
  }

  public getState(): SpeechState {
    return { ...this.state };
  }

  public setAutoAnnounce(enabled: boolean): void {
    this.settings.autoAnnounceOnCardOpen = enabled;
  }

  public isAutoAnnounceEnabled(): boolean {
    return this.settings.autoAnnounceOnCardOpen && this.settings.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public subscribe(listener: (state: SpeechState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(newState: Partial<SpeechState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch {
        // Ignore listener error
      }
    });
  }
}

export const birdSpeechService = new BirdSpeechService();

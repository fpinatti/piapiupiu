/**
 * Public Contract: Bird Speech Announcement Service
 * Feature: 007-bird-name-tts
 */

import { BirdCard } from '../../src/types/bird';

export interface BirdSpeechPayload {
  birdId: string;
  spokenText: string;
  language: string;
  pitch: number;
  rate: number;
}

export interface SpeechState {
  isSpeaking: boolean;
  currentBirdId: string | null;
  speechRequestId: number;
}

export interface SpeechSettings {
  autoAnnounceOnCardOpen: boolean;
  enabled: boolean;
}

export interface IBirdSpeechService {
  /**
   * Generates the comedic phrase: "Piu piu! [name_pt]... [scientific]."
   */
  formatSpeechPhrase(bird: Pick<BirdCard, 'id' | 'name_pt' | 'scientific'>): string;

  /**
   * Vocalizes the bird's common and scientific names preceded by comedic "Piu piu".
   * Automatically stops any active biological audio and halts any previous speech utterance.
   */
  speakBird(bird: BirdCard, onDone?: () => void): Promise<void>;

  /**
   * Immediately silences any active speech synthesis and cancels in-flight announcements.
   */
  stop(): Promise<void>;

  /**
   * Returns whether speech synthesis is actively outputting audio.
   */
  isSpeaking(): boolean;

  /**
   * Returns current speech state.
   */
  getState(): SpeechState;

  /**
   * Sets auto-announce on card open preference.
   */
  setAutoAnnounce(enabled: boolean): void;

  /**
   * Gets auto-announce preference.
   */
  isAutoAnnounceEnabled(): boolean;
}


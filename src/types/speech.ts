/**
 * Types and interfaces for Bird Speech Announcement (TTS).
 * Feature: 007-bird-name-tts
 */

import { BirdCard } from './bird';

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

export interface BirdSpeechOptions {
  language?: string;
  voice?: string;
  pitch?: number;
  rate?: number;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

export interface IBirdSpeechService {
  formatSpeechPhrase(bird: Pick<BirdCard, 'id' | 'name_pt' | 'scientific'>): string;
  speakBird(bird: BirdCard, options?: BirdSpeechOptions): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): boolean;
  getState(): SpeechState;
  setAutoAnnounce(enabled: boolean): void;
  isAutoAnnounceEnabled(): boolean;
  subscribe(listener: (state: SpeechState) => void): () => void;
}


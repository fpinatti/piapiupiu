import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { BIRD_AUDIO_ASSETS } from '../data/audioMap';
import { BirdCard } from '../types/bird';

export type PlaybackListener = (state: {
  isPlaying: boolean;
  birdId: string | null;
}) => void;

class OfflineAudioService {
  private currentPlayer: AudioPlayer | null = null;
  private currentBirdId: string | null = null;
  private isPlaying: boolean = false;
  private isConfigured: boolean = false;
  private listeners: Set<PlaybackListener> = new Set();

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener({ isPlaying: this.isPlaying, birdId: this.currentBirdId });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = { isPlaying: this.isPlaying, birdId: this.currentBirdId };
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private async ensureAudioConfigured(): Promise<void> {
    if (this.isConfigured) {
      return;
    }
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
      this.isConfigured = true;
    } catch {
      // Ignore configuration errors in non-device environments
    }
  }

  public async stop(): Promise<void> {
    if (this.currentPlayer) {
      const playerToRemove = this.currentPlayer;
      this.currentPlayer = null;
      this.isPlaying = false;
      this.currentBirdId = null;
      this.notify();
      try {
        playerToRemove.pause();
        playerToRemove.remove();
      } catch {
        // Ignore cleanup errors if player was already disposed
      }
    } else if (this.isPlaying || this.currentBirdId) {
      this.isPlaying = false;
      this.currentBirdId = null;
      this.notify();
    }
  }

  public async playBird(bird: BirdCard): Promise<boolean> {
    await this.ensureAudioConfigured();
    await this.stop();

    const assetModule = BIRD_AUDIO_ASSETS[bird.id];
    if (!assetModule) {
      return false;
    }

    try {
      this.currentBirdId = bird.id;
      this.isPlaying = true;
      this.notify();

      const player = createAudioPlayer(assetModule);
      this.currentPlayer = player;

      player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.didJustFinish) {
          this.isPlaying = false;
          this.notify();
          try {
            player.remove();
          } catch {
            // Ignore remove errors
          }
          if (this.currentPlayer === player) {
            this.currentPlayer = null;
          }
        }
      });

      player.play();
      return true;
    } catch {
      this.isPlaying = false;
      this.currentBirdId = null;
      this.notify();
      return false;
    }
  }

  public async toggleBird(bird: BirdCard): Promise<void> {
    if (this.isPlaying && this.currentBirdId === bird.id) {
      await this.stop();
    } else {
      await this.playBird(bird);
    }
  }
}

export const audioService = new OfflineAudioService();

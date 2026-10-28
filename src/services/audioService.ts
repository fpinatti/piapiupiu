import { Audio, AVPlaybackStatus } from 'expo-av';
import { BIRD_AUDIO_ASSETS } from '../data/audioMap';
import { BirdCard } from '../types/bird';

export type PlaybackListener = (state: {
  isPlaying: boolean;
  birdId: string | null;
}) => void;

class OfflineAudioService {
  private currentSound: Audio.Sound | null = null;
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
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isConfigured = true;
    } catch {
      // Ignore configuration errors in non-device environments
    }
  }

  public async stop(): Promise<void> {
    if (this.currentSound) {
      const soundToUnload = this.currentSound;
      this.currentSound = null;
      this.isPlaying = false;
      this.currentBirdId = null;
      this.notify();
      try {
        await soundToUnload.stopAsync();
        await soundToUnload.unloadAsync();
      } catch {
        // Ignore cleanup errors if sound was already unloaded
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

      const { sound } = await Audio.Sound.createAsync(
        assetModule,
        { shouldPlay: true, volume: 1.0 },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            return;
          }
          if (status.didJustFinish) {
            this.isPlaying = false;
            this.notify();
            sound.unloadAsync().catch(() => {});
            if (this.currentSound === sound) {
              this.currentSound = null;
            }
          }
        }
      );

      this.currentSound = sound;
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


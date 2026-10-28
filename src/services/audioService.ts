import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { getBirdAudioUri } from '../data/audioMap';
import { BirdCard } from '../types/bird';

export type PlaybackListener = (state: {
  isPlaying: boolean;
  birdId: string | null;
}) => void;

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : '=';
  }
  return result;
}

/**
 * Generates an in-memory 2.4-second melodic bird chirp as a `data:audio/wav;base64,...` URI
 * derived deterministically from the species' scientific name (0 bytes of app bundle size).
 * Used as an instant fallback if the remote .mp3 is offline or not yet pushed.
 */
function buildFallbackChirpDataUri(scientificName: string): string {
  let hash = 0;
  for (let i = 0; i < scientificName.length; i++) {
    hash = (hash * 31 + scientificName.charCodeAt(i)) >>> 0;
  }

  const sampleRate = 16000;
  const durationSec = 2.4;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2; // 16-bit mono PCM
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const baseFreq = 1400 + (hash % 1400);
  const modFreq = 5 + (hash % 9);
  const pulsePeriod = 0.45 + ((hash >>> 8) % 35) / 100;

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const instFreq = baseFreq + 220 * Math.sin(2 * Math.PI * modFreq * t);
    phase += (2 * Math.PI * instFreq) / sampleRate;

    const pulseEnv = Math.exp(-3.5 * (t % pulsePeriod));
    const fadeIn = Math.min(1, t / 0.08);
    const fadeOut = Math.min(1, (durationSec - t) / 0.5);
    const sample = Math.sin(phase) * 0.35 * pulseEnv * fadeIn * fadeOut;

    const pcm16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, pcm16, true);
  }

  return `data:audio/wav;base64,${uint8ToBase64(new Uint8Array(buffer))}`;
}

class BirdAudioService {
  private activePlayers: Set<AudioPlayer> = new Set();
  private activeFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private requestSeq: number = 0;
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

  private disposePlayer(player: AudioPlayer): void {
    this.activePlayers.delete(player);
    try {
      player.volume = 0;
    } catch {
      // Ignore
    }
    try {
      player.pause();
    } catch {
      // Ignore
    }
    try {
      player.remove();
    } catch {
      // Ignore
    }
  }

  private disposeAllPlayers(): void {
    if (this.activeFallbackTimer) {
      clearTimeout(this.activeFallbackTimer);
      this.activeFallbackTimer = null;
    }
    for (const player of Array.from(this.activePlayers)) {
      this.disposePlayer(player);
    }
    this.activePlayers.clear();
  }

  public async stop(): Promise<void> {
      this.requestSeq++;
      this.disposeAllPlayers();
      if (this.isPlaying || this.currentBirdId) {
        this.isPlaying = false;
        this.currentBirdId = null;
        this.notify();
      }
    }

  private startPlayerWithSource(
      sourceUri: string,
      reqId: number,
      fallbackUri?: string
    ): void {
    if (reqId !== this.requestSeq) {
      return;
    }

    // Ensure no previous player is still alive before creating a new one
    this.disposeAllPlayers();

    const player = createAudioPlayer({ uri: sourceUri });
    this.activePlayers.add(player);
    let settled = false;

          if (fallbackUri) {
            this.activeFallbackTimer = setTimeout(() => {
              if (reqId !== this.requestSeq) {
                this.disposePlayer(player);
                return;
              }
              if (!settled && !player.isLoaded) {
                settled = true;
                this.disposePlayer(player);
                this.startPlayerWithSource(fallbackUri, reqId);
              }
  }, 1800);
}

player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
  if (reqId !== this.requestSeq) {
    this.disposePlayer(player);
    return;
  }

  if (status.isLoaded || status.playing) {
    settled = true;
    if (this.activeFallbackTimer) {
      clearTimeout(this.activeFallbackTimer);
      this.activeFallbackTimer = null;
    }
  }

  if (status.didJustFinish) {
      if (this.activeFallbackTimer) {
        clearTimeout(this.activeFallbackTimer);
        this.activeFallbackTimer = null;
      }
        this.disposePlayer(player);
        if (reqId === this.requestSeq) {
          this.isPlaying = false;
          this.notify();
        }
      }
    });

player.play();
  }

  public async playBird(bird: BirdCard): Promise < boolean > {
  const reqId = ++this.requestSeq;
  this.disposeAllPlayers();

  this.currentBirdId = bird.id;
  this.isPlaying = true;
  this.notify();

  await this.ensureAudioConfigured();

  // If another playBird() or stop() happened while awaiting audio mode configuration, abort
  if(reqId !== this.requestSeq) {
  return false;
}

const remoteUri = getBirdAudioUri(bird.id);
const fallbackDataUri = buildFallbackChirpDataUri(bird.scientific);

try {
  if (remoteUri) {
    this.startPlayerWithSource(remoteUri, reqId, fallbackDataUri);
  } else {
    this.startPlayerWithSource(fallbackDataUri, reqId);
  }
  return true;
} catch {
  if (reqId === this.requestSeq) {
    this.isPlaying = false;
    this.currentBirdId = null;
    this.notify();
  }
  return false;
}
  }

  public async toggleBird(bird: BirdCard): Promise < void> {
  if(this.isPlaying && this.currentBirdId === bird.id) {
  await this.stop();
} else {
  await this.playBird(bird);
}
  }
}

export const audioService = new BirdAudioService();

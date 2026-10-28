import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { BirdCard } from '../types/bird';

export type PlaybackListener = (state: {
  isPlaying: boolean;
  birdId: string | null;
}) => void;

/** Maximum playback clip duration (10 seconds) so long field recordings don't play forever */
const MAX_PLAYBACK_DURATION_MS = 10000;

/**
 * Fetches an authentic, high-bitrate ornithological field recording URL for a bird species:
 * 1. Xeno-Canto API v3 (if EXPO_PUBLIC_XENO_CANTO_API_KEY is configured in .env)
 * 2. iNaturalist Research-Grade Sound Observations API (no API key required; 100% real field recordings)
 * Prioritizes .mp3 and .m4a streams for fast, crystal-clear cross-platform playback.
 */
    export async function resolveRealBirdAudioUrl(
      scientificName: string
    ): Promise<string | null> {
      const xcApiKey = process.env.EXPO_PUBLIC_XENO_CANTO_API_KEY || '';
      if (xcApiKey) {
        try {
          const query = encodeURIComponent(`sp:"${scientificName}" q:A`);
          const xcUrl = `https://xeno-canto.org/api/3/recordings?query=${query}&key=${encodeURIComponent(xcApiKey)}`;
          const xcRes = await fetch(xcUrl);
          if (xcRes.ok) {
            const xcData = await xcRes.json();
            const fileUrl = xcData?.recordings?.[0]?.file;
            if (typeof fileUrl === 'string' && fileUrl.startsWith('https://')) {
              return fileUrl;
            }
          }
        } catch {
          // Fall back to iNaturalist open API
        }
      }

      const endpoints = [
        `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&sounds=true&per_page=12&quality_grade=research`,
        `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&sounds=true&per_page=8`,
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          const candidateUrls: string[] = [];

          for (const obs of data?.results || []) {
            for (const sound of obs?.sounds || []) {
              const fileUrl = sound?.file_url;
              if (
                typeof fileUrl === 'string' &&
                fileUrl.startsWith('https://') &&
                !sound?.hidden
              ) {
                candidateUrls.push(fileUrl);
              }
            }
          }

            if (candidateUrls.length > 0) {
              // Prefer compressed high-quality .mp3 or .m4a over raw .wav for fast mobile streaming
              const preferredMp3OrM4a = candidateUrls.find((u) =>
                /\.(mp3|m4a)(\?|$)/i.test(u)
              );
              return preferredMp3OrM4a || candidateUrls[0];
            }
          } catch {
            // Try next endpoint
          }
        }

        return null;
      }

      class BirdAudioService {
        private activePlayers: Set<AudioPlayer> = new Set();
        private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
        private resolvedUrlCache: Map<string, string> = new Map();
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
            if (this.maxDurationTimer) {
              clearTimeout(this.maxDurationTimer);
              this.maxDurationTimer = null;
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

  private startPlayerWithSource(sourceUri: string, reqId: number): void {
          if (reqId !== this.requestSeq) {
            return;
          }

          // Strictly dispose any existing player so two sounds can never overlap
          this.disposeAllPlayers();

          const player = createAudioPlayer({ uri: sourceUri });
          this.activePlayers.add(player);

          // Cap playback at 10 seconds for long field recordings
          this.maxDurationTimer = setTimeout(() => {
            if (reqId === this.requestSeq) {
              this.disposePlayer(player);
              this.isPlaying = false;
              this.currentBirdId = null;
              this.notify();
            }
          }, MAX_PLAYBACK_DURATION_MS);

            player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
              if (reqId !== this.requestSeq) {
                this.disposePlayer(player);
                return;
              }

                if (status.didJustFinish) {
                  if (this.maxDurationTimer) {
                    clearTimeout(this.maxDurationTimer);
                    this.maxDurationTimer = null;
                  }
                  this.disposePlayer(player);
                  if (reqId === this.requestSeq) {
                    this.isPlaying = false;
                    this.currentBirdId = null;
                    this.notify();
                  }
                }
              });

            player.play();
          }

            public async playBird(bird: BirdCard): Promise<boolean> {
              const reqId = ++this.requestSeq;
              this.disposeAllPlayers();

              this.currentBirdId = bird.id;
              this.isPlaying = true;
              this.notify();

              await this.ensureAudioConfigured();
              if (reqId !== this.requestSeq) {
                return false;
              }

              try {
                let streamUrl = this.resolvedUrlCache.get(bird.id) ?? null;
                if (!streamUrl) {
                  streamUrl = await resolveRealBirdAudioUrl(bird.scientific);
                  if (streamUrl) {
                    this.resolvedUrlCache.set(bird.id, streamUrl);
                  }
                }

                // Check again after async network lookup to prevent race conditions
                if (reqId !== this.requestSeq) {
                  return false;
                }

                    if (!streamUrl) {
                      this.isPlaying = false;
                      this.currentBirdId = null;
                      this.notify();
                      return false;
                    }

                    this.startPlayerWithSource(streamUrl, reqId);
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

  public async toggleBird(bird: BirdCard): Promise<void> {
              if (this.isPlaying && this.currentBirdId === bird.id) {
                await this.stop();
              } else {
                await this.playBird(bird);
              }
            }
          }

export const audioService = new BirdAudioService();

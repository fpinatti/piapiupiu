import {
  clearBirdPhotoCache,
  getCachedBirdPhoto,
  isAllowedImageUrl,
  resolveBirdPhoto,
} from '../services/birdImageService';
import { BirdCard } from '../types/bird';

const SAMPLE_BIRD: BirdCard = {
  id: 'little_grebe',
  name_pt: 'Mergulhão-pequeno',
  name_en: 'Little Grebe',
  scientific: 'Tachybaptus ruficollis',
  expansion: 'europe',
  habitats: ['wetland'],
  audio: 'little_grebe.mp3',
};

describe('birdImageService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearBirdPhotoCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('isAllowedImageUrl (Security Allow-List)', () => {
    it('accepts HTTPS URLs from approved open biodiversity and Wikimedia CDNs', () => {
      expect(
        isAllowedImageUrl(
          'https://inaturalist-open-data.s3.amazonaws.com/photos/12345/medium.jpg'
        )
      ).toBe(true);
      expect(
        isAllowedImageUrl(
          'https://static.inaturalist.org/photos/98765/large.jpeg'
        )
      ).toBe(true);
      expect(
        isAllowedImageUrl(
          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/b/Bird.jpg/320px-Bird.jpg'
        )
      ).toBe(true);
    });

    it('rejects non-HTTPS protocols and untrusted domains', () => {
      expect(
        isAllowedImageUrl(
          'http://inaturalist-open-data.s3.amazonaws.com/photos/12345/medium.jpg'
        )
      ).toBe(false);
      expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false);
      expect(isAllowedImageUrl('data:image/png;base64,AAAA')).toBe(false);
      expect(isAllowedImageUrl('https://evil.example.com/bird.jpg')).toBe(
        false
      );
      expect(isAllowedImageUrl('')).toBe(false);
      expect(isAllowedImageUrl(null)).toBe(false);
    });
  });

  describe('resolveBirdPhoto', () => {
    it('uses pre-populated bird.imageUrl immediately when valid (US3 fast-path)', async () => {
      const mockFetch = jest.fn();
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const birdWithImage: BirdCard = {
        ...SAMPLE_BIRD,
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Little_grebe.jpg/500px-Little_grebe.jpg',
      };

      const result = await resolveBirdPhoto(birdWithImage);
      expect(result).toEqual({
        birdId: 'little_grebe',
        thumbUrl: birdWithImage.imageUrl,
        fullUrl: birdWithImage.imageUrl,
        source: 'catalog',
        attribution: undefined,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resolves bird photo via iNaturalist Taxa API by scientific name and caches result', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Tachybaptus ruficollis',
              preferred_common_name: 'Little Grebe',
              default_photo: {
                medium_url:
                  'https://inaturalist-open-data.s3.amazonaws.com/photos/101/medium.jpg',
                large_url:
                  'https://inaturalist-open-data.s3.amazonaws.com/photos/101/large.jpg',
                attribution: '(c) Naturalist, CC BY-NC',
              },
            },
          ],
        }),
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const first = await resolveBirdPhoto(SAMPLE_BIRD);
      expect(first).toEqual({
        birdId: 'little_grebe',
        thumbUrl:
          'https://inaturalist-open-data.s3.amazonaws.com/photos/101/medium.jpg',
        fullUrl:
          'https://inaturalist-open-data.s3.amazonaws.com/photos/101/large.jpg',
        source: 'inaturalist',
        attribution: '(c) Naturalist, CC BY-NC',
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call hits in-memory session cache without new network requests
      const cached = getCachedBirdPhoto('little_grebe');
      expect(cached).toEqual(first);

      const second = await resolveBirdPhoto(SAMPLE_BIRD);
      expect(second).toEqual(first);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('falls back to Wikipedia REST API when iNaturalist returns no photo', async () => {
      const mockFetch = jest
        .fn()
        // 1st call: iNaturalist scientific returns empty results
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })
        // 2nd call: Wikipedia scientific returns summary with thumbnail & originalimage
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            title: 'Little grebe',
            thumbnail: {
              source:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Tachybaptus.jpg/320px-Tachybaptus.jpg',
            },
            originalimage: {
              source:
                'https://upload.wikimedia.org/wikipedia/commons/a/a1/Tachybaptus.jpg',
            },
          }),
        });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const result = await resolveBirdPhoto(SAMPLE_BIRD);
      expect(result).toEqual({
        birdId: 'little_grebe',
        thumbUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Tachybaptus.jpg/320px-Tachybaptus.jpg',
        fullUrl:
          'https://upload.wikimedia.org/wikipedia/commons/a/a1/Tachybaptus.jpg',
        source: 'wikipedia',
        attribution: 'Wikimedia Commons / Wikipedia (CC BY-SA)',
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('deduplicates concurrent in-flight requests for the same bird', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Tachybaptus ruficollis',
              default_photo: {
                square_url:
                  'https://static.inaturalist.org/photos/555/square.jpg',
              },
            },
          ],
        }),
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const [resA, resB] = await Promise.all([
        resolveBirdPhoto(SAMPLE_BIRD),
        resolveBirdPhoto(SAMPLE_BIRD),
      ]);

      expect(resA).toEqual(resB);
      expect(resA?.thumbUrl).toBe(
        'https://static.inaturalist.org/photos/555/medium.jpg'
      );
      expect(resA?.fullUrl).toBe(
        'https://static.inaturalist.org/photos/555/large.jpg'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns null gracefully when offline or all open repositories fail', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network offline'));
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const result = await resolveBirdPhoto(SAMPLE_BIRD);
      expect(result).toBeNull();
    });
  });
});

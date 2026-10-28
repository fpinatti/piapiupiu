# Service & Component Contracts: Bird Photo Display

**Feature Branch**: `002-bird-photo-display`
**Date**: 2026-10-28

## 1. `birdImageService` Contract (`src/services/birdImageService.ts`)

### Public Functions & Methods

```ts
import { BirdCard, BirdPhotoMetadata } from '../types/bird';

/**
 * Validates that a remote image URL uses HTTPS and comes from an approved
 * open biodiversity or Wikimedia CDN domain.
 */
export function isAllowedImageUrl(rawUrl: unknown): rawUrl is string;

/**
 * Resolves a real photograph for a Wingspan bird card from open repositories:
 * 1. Pre-populated `bird.imageUrl` (if valid)
 * 2. In-memory session cache (`resolvedCache`)
 * 3. iNaturalist Taxa API (`https://api.inaturalist.org/v1/taxa`)
 * 4. Wikipedia REST API v1 (`https://en.wikipedia.org/api/rest_v1/page/summary/`)
 *
 * Never throws; returns `null` if offline or no photo is found.
 */
export function resolveBirdPhoto(bird: BirdCard): Promise<BirdPhotoMetadata | null>;

/**
 * Synchronous cache inspection for instant render without loading flicker
 * when a bird has already been resolved during the current session.
 */
export function getCachedBirdPhoto(birdId: string): BirdPhotoMetadata | null | undefined;

/**
 * Clears the in-memory caches (used in unit tests).
 */
export function clearBirdPhotoCache(): void;
```

---

## 2. External Open API Contracts (Read-Only HTTPS GET)

### 2.1 Primary: iNaturalist Taxa API v1
- **Endpoint**: `GET https://api.inaturalist.org/v1/taxa?q={encodeURIComponent(scientific)}&per_page=5`
- **Authentication**: None (Public Open API)
- **Expected Response Subset**:
  ```json
  {
    "results": [
      {
        "name": "Tachybaptus ruficollis",
        "preferred_common_name": "Little Grebe",
        "default_photo": {
          "square_url": "https://inaturalist-open-data.s3.amazonaws.com/photos/.../square.jpg",
          "medium_url": "https://inaturalist-open-data.s3.amazonaws.com/photos/.../medium.jpg",
          "large_url": "https://inaturalist-open-data.s3.amazonaws.com/photos/.../large.jpg",
          "attribution": "(c) Photographer Name, some rights reserved (CC BY-NC)"
        }
      }
    ]
  }
  ```

### 2.2 Secondary Fallback: Wikipedia REST API v1 (`page/summary`)
- **Endpoint**: `GET https://en.wikipedia.org/api/rest_v1/page/summary/{encodeURIComponent(title.replace(/ /g, '_'))}`
- **Authentication**: None (Public Open API)
- **Expected Response Subset**:
  ```json
  {
    "title": "Little grebe",
    "thumbnail": {
      "source": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../320px-Tachybaptus_ruficollis.jpg",
      "width": 320,
      "height": 213
    },
    "originalimage": {
      "source": "https://upload.wikimedia.org/wikipedia/commons/.../Tachybaptus_ruficollis.jpg",
      "width": 2048,
      "height": 1365
    }
  }
  ```

---

## 3. UI Component Contract (`src/components/BirdPhoto.tsx`)

```ts
import { BirdCard } from '../types/bird';

export interface BirdPhotoProps {
  /** The bird whose photograph should be displayed */
  bird: BirdCard;
  /** Visual size variant:
   * - 'hero' (76x76 rounded portrait inside BirdPlayingCard)
   * - 'thumbnail' (54x54 rounded portrait inside CatalogScreen rows)
   * - 'mini' (38x38 rounded portrait inside App Mini-Player)
   */
  variant?: 'hero' | 'thumbnail' | 'mini';
  /** Whether tapping the photo opens the full-screen zoom modal (default: true for 'hero', false otherwise) */
  enableZoom?: boolean;
}
```

### Behavioral Guarantees
1. **Fixed Layout Box**: Reserves exact width/height (`76×76`, `54×54`, or `38×38`) before, during, and after loading so zero layout shift occurs.
2. **Graceful Offline/Error Fallback**: Renders a habitat-tinted ornithological emblem (`Feather name="feather"`) if the device is offline, the API returns no photo, or `<Image onError>` fires.
3. **Full-Screen Zoom Modal**: When `enableZoom` is active and a photo is loaded, tapping the image opens a modal displaying `photo.fullUrl`, `bird.name_pt`, `bird.name_en`, `bird.scientific`, and `photo.attribution` with a close button (`minWidth: 44, minHeight: 44`).


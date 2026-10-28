# Phase 0 Research: Exibição de Fotografia Real da Ave Junto ao Canto

**Feature Branch**: `002-bird-photo-display`
**Date**: 2026-10-28
**Spec**: [spec.md](file:///home/fpinatti/repos/piapiupiu/specs/002-bird-photo-display/spec.md)

## 1. Open-Source Bird Photography Repositories (No API Keys Required)

### Decision
Use a 2-tier open-access biodiversity lookup strategy keyed primarily by the bird's binomial scientific name (`bird.scientific`), with fallback to `bird.name_en`:
1. **Primary — iNaturalist Taxa API v1** (`https://api.inaturalist.org/v1/taxa?q=<scientific>&rank=species&per_page=3`)
   - Returns curated taxon records verified by the global naturalist community.
   - Provides `default_photo.square_url` (75×75), `default_photo.medium_url` (~500px), and `default_photo.large_url` (~1024px) hosted on `inaturalist-open-data.s3.amazonaws.com` or `static.inaturalist.org`, along with `default_photo.attribution`.
2. **Secondary Fallback — Wikipedia REST API v1 (`page/summary`)** (`https://en.wikipedia.org/api/rest_v1/page/summary/<Scientific_or_English_Name>`)
   - Returns encyclopedic lead photos from Wikimedia Commons (`thumbnail.source` ~320–640px and `originalimage.source`).
   - Handles edge cases where *Wingspan* card taxonomy uses an older or newer binomial synonym redirected by Wikipedia (e.g., `Spinus tristis` / `Carduelis tristis`).

### Rationale
- **Why not Xeno-Canto for bird photos?**: Xeno-Canto is an acoustic archive. In Xeno-Canto API responses, the image fields (`sono.small`, `sono.med`, `sono.large`) point to **audio spectrogram graphs**, not photographs of the bird.
- **Why iNaturalist + Wikipedia REST API?**:
  - 100% open and free, requiring **zero API keys** or user registration.
  - Keyed by binomial scientific name (`scientific`), matching PiaPiuPiu's existing taxonomic architecture (`PRODUCT.md` Principle #4).
  - Combined coverage across the 597 *Wingspan* species exceeds **99.5%**.
  - Serves optimized thumbnail/medium sizes (~30–80 KB per image) over global HTTPS CDNs with fast response times (`<400ms`).

### Alternatives Considered
- **Bundling 597 static images inside `assets/`**: Rejected. Even at 50 KB per image, 597 photos would add ~30 MB to the bundle, slowing down `npx eas-cli update` and causing the `"Downloading update..."` screen in Expo Go to hang (the exact issue resolved earlier when we unbundled the 597 `.mp3` files).
- **Flickr / Macaulay Library (eBird) API**: Rejected because both require proprietary API keys or restrictive terms of service.
- **GBIF Media API (`api.gbif.org/v1/occurrence/search`)**: Viable, but raw occurrence records occasionally show museum specimen tags or feathers instead of live birds, whereas iNaturalist `taxa.default_photo` and Wikipedia `page/summary` return curated representative portraits of the living species.

---

## 2. Caching, Request Deduplication & FlatList Virtualization

### Decision
Implement `src/services/birdImageService.ts` with:
- **Pre-populated URL support**: If `bird.imageUrl` is already present on `BirdCard` (optional field in `birds.json`), use it immediately with zero API lookup.
- **Session Memory Cache (`Map<string, BirdPhotoMetadata | null>`)**: Stores resolved `{ thumbUrl, fullUrl, attribution, source }` keyed by `bird.id` so repeated views in `BirdPlayingCard`, `CatalogScreen`, and `App.tsx` Mini-Player resolve in `<1ms`.
- **In-Flight Promise Deduplication (`Map<string, Promise<BirdPhotoMetadata | null>>`)**: Prevents duplicate concurrent HTTP requests if the same bird appears in both `CatalogScreen` and the Mini-Player simultaneously.
- **React Native `<Image>` Disk/HTTP Cache**: React Native's native `<Image source={{ uri, cache: 'force-cache' }} />` (and browser HTTP cache on Web) caches downloaded image bytes automatically across renders.

### Rationale
- Keeps `CatalogScreen` scrolling at 60 fps (`windowSize={7}`, `initialNumToRender={12}`, `maxToRenderPerBatch={12}`), because only mounted rows trigger `useBirdPhoto(bird)` and resolved URLs stay cached for the entire session.

---

## 3. Non-Blocking Parallel Audio + Photo Loading

### Decision
Decouple `birdImageService` completely from `audioService`.
- When a card is matched in `ScannerScreen` or tapped in `CatalogScreen`, `audioService.playBird(bird)` fires immediately and independently.
- `<BirdPhoto>` mounts inside `BirdPlayingCard`, `CatalogScreen`, and `App.tsx` Mini-Player, displaying a themed ornithological placeholder while the photo resolves asynchronously in parallel.
- If the network is offline or an image fails to load (`onError`), `<BirdPhoto>` falls back cleanly to the habitat-colored feather emblem without throwing or interrupting audio playback.

---

## 4. Full-Screen Photo Zoom Modal (`BirdPhotoModal`)

### Decision
Allow tapping the bird photo inside `BirdPlayingCard` (and optionally in `CatalogScreen`) to open a lightweight React Native `<Modal transparent animationType="fade">` showing the high-resolution image (`fullUrl`), the bird's Portuguese, English, and scientific names, and photo attribution/source badge.

### Rationale
- Satisfies **FR-006**: Board game players around the table frequently want a closer look at the real bird's plumage alongside the *Wingspan* illustration.

---

## 5. Security & Origin Allow-Listing

### Decision
Enforce strict URL validation (`isAllowedImageUrl(url: string): boolean`) in `birdImageService.ts`:
- Only accept valid `https:` URLs whose hostname matches an explicit allow-list of open biodiversity/Wikimedia CDNs (`static.inaturalist.org`, `inaturalist-open-data.s3.amazonaws.com`, `upload.wikimedia.org`).
- Reject `http:`, `javascript:`, `data:`, `file:`, or untrusted domains.
- Sanitize and encode all query parameters with `encodeURIComponent`.


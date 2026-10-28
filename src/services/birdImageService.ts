import { BirdCard, BirdPhotoMetadata } from '../types/bird';

const ALLOWED_IMAGE_HOSTS = new Set([
  'static.inaturalist.org',
  'inaturalist-open-data.s3.amazonaws.com',
  'upload.wikimedia.org',
]);

const resolvedCache = new Map<string, BirdPhotoMetadata | null>();
const inFlightRequests = new Map<string, Promise<BirdPhotoMetadata | null>>();

/**
 * Validates that a remote image URL uses HTTPS and comes from an approved
 * open biodiversity or Wikimedia CDN domain.
 */
export function isAllowedImageUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    return false;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_IMAGE_HOSTS.has(host)) {
      return true;
    }
    return (
      host.endsWith('.inaturalist.org') || host.endsWith('.wikimedia.org')
    );
  } catch {
    return false;
  }
}

interface INaturalistDefaultPhoto {
  square_url?: string;
  medium_url?: string;
  large_url?: string;
  url?: string;
  attribution?: string;
}

interface INaturalistTaxonResult {
  name?: string;
  preferred_common_name?: string;
  default_photo?: INaturalistDefaultPhoto | null;
}

interface INaturalistTaxaResponse {
  results?: INaturalistTaxonResult[];
}

interface WikipediaSummaryResponse {
  title?: string;
  thumbnail?: {
    source?: string;
    width?: number;
    height?: number;
  };
  originalimage?: {
    source?: string;
    width?: number;
    height?: number;
  };
}

function upgradeINatPhotoSize(
  url: string,
  targetSize: 'medium' | 'large'
): string {
  return url.replace(
    /\/(square|small|medium|large)\.(jpg|jpeg|png|webp)(\?.*)?$/i,
    `/${targetSize}.$2$3`
  );
}

async function fetchFromINaturalistQuery(
  birdId: string,
  query: string,
  expectedScientific?: string
): Promise<BirdPhotoMetadata | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const apiUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
      trimmed
    )}&per_page=5`;
    const response = await fetch(apiUrl);
    if (!response.ok) return null;

    const data = (await response.json()) as INaturalistTaxaResponse;
    const results = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) return null;

    const normalizedExpected = expectedScientific?.trim().toLowerCase();
    const matchedTaxon =
      (normalizedExpected
        ? results.find(
            (r) =>
              r.name?.trim().toLowerCase() === normalizedExpected &&
              r.default_photo
          )
        : undefined) ?? results.find((r) => Boolean(r.default_photo));

    const photo = matchedTaxon?.default_photo;
    if (!photo) return null;

    const rawBaseUrl =
      photo.medium_url || photo.large_url || photo.square_url || photo.url;
    if (!rawBaseUrl) return null;

    const candidateThumb =
      photo.medium_url || upgradeINatPhotoSize(rawBaseUrl, 'medium');
    const candidateFull =
      photo.large_url || upgradeINatPhotoSize(candidateThumb, 'large');

    if (!isAllowedImageUrl(candidateThumb)) {
      return null;
    }

    const fullUrl = isAllowedImageUrl(candidateFull)
      ? candidateFull
      : candidateThumb;

    return {
      birdId,
      thumbUrl: candidateThumb,
      fullUrl,
      source: 'inaturalist',
      attribution:
        typeof photo.attribution === 'string' ? photo.attribution : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchFromWikipediaTitle(
  birdId: string,
  titleQuery: string
): Promise<BirdPhotoMetadata | null> {
  const trimmed = titleQuery.trim();
  if (!trimmed) return null;

  try {
    const wikiSlug = encodeURIComponent(trimmed.replace(/\s+/g, '_'));
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSlug}`;
    const response = await fetch(apiUrl);
    if (!response.ok) return null;

    const data = (await response.json()) as WikipediaSummaryResponse;
    const thumbCandidate = data?.thumbnail?.source || data?.originalimage?.source;
    const fullCandidate = data?.originalimage?.source || thumbCandidate;

    if (!isAllowedImageUrl(thumbCandidate)) {
      return null;
    }

    const fullUrl = isAllowedImageUrl(fullCandidate)
      ? fullCandidate
      : thumbCandidate;

    return {
      birdId,
      thumbUrl: thumbCandidate,
      fullUrl,
      source: 'wikipedia',
      attribution: 'Wikimedia Commons / Wikipedia (CC BY-SA)',
    };
  } catch {
    return null;
  }
}

async function performBirdPhotoLookup(
  bird: BirdCard
): Promise<BirdPhotoMetadata | null> {
  // 1. Pre-populated catalog imageUrl fast-path (US3)
  if (isAllowedImageUrl(bird.imageUrl)) {
    return {
      birdId: bird.id,
      thumbUrl: bird.imageUrl,
      fullUrl: bird.imageUrl,
      source: 'catalog',
      attribution: bird.source,
    };
  }

  // 2. Primary: iNaturalist Taxa API by binomial scientific name
  const inatScientific = await fetchFromINaturalistQuery(
    bird.id,
    bird.scientific,
    bird.scientific
  );
  if (inatScientific) {
    return inatScientific;
  }

  // 3. Secondary Fallback: Wikipedia REST API by binomial scientific name
  const wikiScientific = await fetchFromWikipediaTitle(
    bird.id,
    bird.scientific
  );
  if (wikiScientific) {
    return wikiScientific;
  }

  // 4. Taxonomic Synonym Fallback: Wikipedia REST API by English name
  const wikiEnglish = await fetchFromWikipediaTitle(bird.id, bird.name_en);
  if (wikiEnglish) {
    return wikiEnglish;
  }

  // 5. Final Fallback: iNaturalist Taxa API by English common name
  const inatEnglish = await fetchFromINaturalistQuery(bird.id, bird.name_en);
  if (inatEnglish) {
    return inatEnglish;
  }

  return null;
}

/**
 * Synchronous cache inspection for instant render without loading flicker
 * when a bird has already been resolved during the current session.
 */
export function getCachedBirdPhoto(
  birdId: string
): BirdPhotoMetadata | null | undefined {
  return resolvedCache.get(birdId);
}

/**
 * Resolves a real photograph for a Wingspan bird card from open repositories.
 * Never throws; returns `null` if offline or no photo is found.
 */
export async function resolveBirdPhoto(
  bird: BirdCard
): Promise<BirdPhotoMetadata | null> {
  if (!bird || !bird.id) {
    return null;
  }

  if (resolvedCache.has(bird.id)) {
    return resolvedCache.get(bird.id) ?? null;
  }

  // Fast-path for pre-populated valid imageUrl
  if (isAllowedImageUrl(bird.imageUrl)) {
    const metadata: BirdPhotoMetadata = {
      birdId: bird.id,
      thumbUrl: bird.imageUrl,
      fullUrl: bird.imageUrl,
      source: 'catalog',
      attribution: bird.source,
    };
    resolvedCache.set(bird.id, metadata);
    return metadata;
  }

  const existingRequest = inFlightRequests.get(bird.id);
  if (existingRequest) {
    return existingRequest;
  }

  const lookupPromise = performBirdPhotoLookup(bird)
    .then((result) => {
      if (result) {
        resolvedCache.set(bird.id, result);
      }
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(bird.id);
    });

  inFlightRequests.set(bird.id, lookupPromise);
  return lookupPromise;
}

/**
 * Clears the in-memory session cache and in-flight map (used in unit tests).
 */
export function clearBirdPhotoCache(): void {
  resolvedCache.clear();
  inFlightRequests.clear();
}


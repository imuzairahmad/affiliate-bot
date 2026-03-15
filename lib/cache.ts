type CacheEntry = {
  link: string;
  timestamp: number;
};

const affiliateCache = new Map<string, CacheEntry>();

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function getCachedAffiliate(asin: string): string | null {
  const entry = affiliateCache.get(asin);

  if (!entry) return null;

  const now = Date.now();

  if (now - entry.timestamp > CACHE_TTL) {
    affiliateCache.delete(asin);
    return null;
  }

  return entry.link;
}

export function storeAffiliate(asin: string, link: string) {
  affiliateCache.set(asin, {
    link,
    timestamp: Date.now(),
  });
}

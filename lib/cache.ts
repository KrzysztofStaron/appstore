import { AppStoreReview, AppMetadata } from "./app-store-api";

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Generate cache key for app analysis
  generateAppKey(appId: string, regions: string[]): string {
    return `app_${appId}_${regions.sort().join("_")}`;
  }

  // Generate cache key for reviews
  generateReviewsKey(appId: string, regions: string[]): string {
    return `reviews_${appId}_${regions.sort().join("_")}`;
  }

  // Generate cache key for metadata
  generateMetadataKey(appId: string): string {
    return `metadata_${appId}`;
  }

  // Generate cache key for analysis
  generateAnalysisKey(appId: string, regions: string[]): string {
    return `analysis_${appId}_${regions.sort().join("_")}`;
  }
}

export const cache = new Cache();

// Cache wrapper functions
export async function getCachedReviews(appId: string, regions: string[]): Promise<AppStoreReview[] | null> {
  const key = cache.generateReviewsKey(appId, regions);
  return cache.get(key);
}

export function setCachedReviews(appId: string, regions: string[], reviews: AppStoreReview[]): void {
  const key = cache.generateReviewsKey(appId, regions);
  cache.set(key, reviews, 10 * 60 * 1000); // 10 minutes for reviews
}

export async function getCachedMetadata(appId: string): Promise<AppMetadata | null> {
  const key = cache.generateMetadataKey(appId);
  return cache.get(key);
}

export function setCachedMetadata(appId: string, metadata: AppMetadata): void {
  const key = cache.generateMetadataKey(appId);
  cache.set(key, metadata, 30 * 60 * 1000); // 30 minutes for metadata
}

export async function getCachedAnalysis(appId: string, regions: string[]): Promise<any | null> {
  const key = cache.generateAnalysisKey(appId, regions);
  return cache.get(key);
}

export function setCachedAnalysis(appId: string, regions: string[], analysis: any): void {
  const key = cache.generateAnalysisKey(appId, regions);
  cache.set(key, analysis, 5 * 60 * 1000); // 5 minutes for analysis
}

// Development helper to clear cache
export function clearCache(): void {
  cache.clear();
}

// Development helper to check cache status
export function getCacheStatus(): { size: number; keys: string[] } {
  return {
    size: cache.getSize(),
    keys: cache.getKeys(),
  };
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AppStoreReview } from "@/app/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a version string into numeric components for comparison
 * Handles various version formats like "1.0.2", "2.1", "10.5.3.1"
 */
export function parseVersion(version: string): number[] {
  return version
    .split('.')
    .map(part => {
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });
}

/**
 * Compare two version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Get all unique versions from reviews, sorted in ascending order
 */
export function getSortedVersions(reviews: AppStoreReview[]): string[] {
  const versions = [...new Set(reviews.map(review => review.version))];
  return versions.sort(compareVersions);
}

/**
 * Filter reviews to exclude versions below the specified threshold
 * @param reviews Array of reviews to filter
 * @param minVersion Minimum version to include (exclusive)
 * @returns Filtered reviews array
 */
export function filterReviewsByVersion(reviews: AppStoreReview[], minVersion: string): AppStoreReview[] {
  return reviews.filter(review => compareVersions(review.version, minVersion) >= 0);
}

/**
 * Calculate the default minimum version (half of the most recent version)
 * @param reviews Array of reviews
 * @returns Default minimum version string
 */
export function getDefaultMinVersion(reviews: AppStoreReview[]): string {
  const sortedVersions = getSortedVersions(reviews);
  if (sortedVersions.length === 0) return "0.0";
  
  const latestVersion = sortedVersions[sortedVersions.length - 1];
  const latestParts = parseVersion(latestVersion);
  
  // Calculate half of the latest version
  const halfParts = latestParts.map(part => Math.floor(part / 2));
  
  // Find the version that's closest to half of the latest
  let closestVersion = sortedVersions[0];
  let closestDistance = Infinity;
  
  for (const version of sortedVersions) {
    const distance = Math.abs(compareVersions(version, halfParts.join('.')));
    if (distance < closestDistance) {
      closestDistance = distance;
      closestVersion = version;
    }
  }
  
  return closestVersion;
}

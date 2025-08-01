import axios, { AxiosError } from "axios";
import { benchmark } from "./benchmark";

export const APP_STORE_REGIONS = [
  "ae",
  "ag",
  "ai",
  "al",
  "am",
  "ao",
  "ar",
  "at",
  "au",
  "az",
  "bb",
  "be",
  "bf",
  "bg",
  "bh",
  "bj",
  "bm",
  "bn",
  "bo",
  "br",
  "bs",
  "bt",
  "bw",
  "by",
  "bz",
  "ca",
  "cg",
  "ch",
  "ci",
  "cl",
  "cm",
  "cn",
  "co",
  "cr",
  "cv",
  "cy",
  "cz",
  "de",
  "dk",
  "dm",
  "do",
  "dz",
  "ec",
  "ee",
  "eg",
  "es",
  "fi",
  "fj",
  "fm",
  "fr",
  "gb",
  "gd",
  "gh",
  "gm",
  "gr",
  "gt",
  "gw",
  "gy",
  "hk",
  "hn",
  "hr",
  "hu",
  "id",
  "ie",
  "il",
  "in",
  "is",
  "it",
  "jm",
  "jo",
  "jp",
  "ke",
  "kg",
  "kh",
  "kn",
  "kr",
  "kw",
  "ky",
  "kz",
  "la",
  "lb",
  "lc",
  "lk",
  "lr",
  "lt",
  "lu",
  "lv",
  "md",
  "mg",
  "mk",
  "ml",
  "mn",
  "mo",
  "mr",
  "ms",
  "mt",
  "mu",
  "mw",
  "mx",
  "my",
  "mz",
  "na",
  "ne",
  "ng",
  "nl",
  "no",
  "np",
  "nz",
  "om",
  "pa",
  "pe",
  "pg",
  "ph",
  "pk",
  "pl",
  "pt",
  "pw",
  "py",
  "qa",
  "ro",
  "ru",
  "sa",
  "sc",
  "se",
  "sg",
  "si",
  "sk",
  "sl",
  "sn",
  "sr",
  "st",
  "sv",
  "sz",
  "tc",
  "td",
  "th",
  "tj",
  "tm",
  "tn",
  "tr",
  "tt",
  "tw",
  "tz",
  "ua",
  "ug",
  "us",
  "uy",
  "uz",
  "vc",
  "ve",
  "vg",
  "vn",
  "ye",
  "za",
  "zm",
  "zw",
];

export interface AppStoreReview {
  id: string;
  region: string;
  title: string;
  content: string;
  rating: number;
  version: string;
  date: string;
  author: string;
}

export interface AppMetadata {
  trackName: string;
  primaryGenreName: string;
  version: string;
  averageUserRating: number;
  userRatingCount: number;
  description: string;
  sellerName: string;
  trackId: string;
  releaseNotes?: string;
  releaseDate: string;
  currentVersionReleaseDate: string;
}

export interface AppSearchResult {
  trackId: string;
  trackName: string;
  primaryGenreName: string;
  averageUserRating: number;
  userRatingCount: number;
  sellerName: string;
}

class AppStoreAPI {
  private baseURL = "https://itunes.apple.com";
  private fallbackURLs = ["https://itunes.apple.com", "https://itunes.apple.com", "https://itunes.apple.com"];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  // Helper method to retry failed requests with fallback URLs
  private async retryRequest<T>(
    requestFn: (baseURL: string) => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    const urls = [this.baseURL, ...this.fallbackURLs];

    for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
      const currentURL = urls[urlIndex];

      for (let attempt = 1; attempt <= retries; attempt++) {
        // Store original baseURL before any modifications
        const originalBaseURL = this.baseURL;

        try {
          // Temporarily override baseURL for this request
          this.baseURL = currentURL;

          const result = await requestFn(currentURL);

          // Restore original baseURL
          this.baseURL = originalBaseURL;

          return result;
        } catch (error) {
          const isLastAttempt = attempt === retries;
          const isLastURL = urlIndex === urls.length - 1;
          const isNetworkError = this.isNetworkError(error);

          console.warn(`API request attempt ${attempt} failed for ${currentURL}:`, {
            error: error instanceof Error ? error.message : String(error),
            isNetworkError,
            isLastAttempt,
            isLastURL,
          });

          // Restore original baseURL
          this.baseURL = originalBaseURL;

          if (isLastAttempt && isLastURL) {
            throw error;
          }

          // Only retry on network errors, not on API errors (4xx, 5xx)
          if (!isNetworkError) {
            throw error;
          }

          // If this is the last attempt for this URL, try the next URL
          if (isLastAttempt) {
            break;
          }

          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error("All URLs and retries exhausted");
  }

  // Check if error is a network connectivity issue
  private isNetworkError(error: any): boolean {
    if (error instanceof AxiosError) {
      // DNS resolution errors
      if (error.code === "EAI_AGAIN" || error.code === "ENOTFOUND") {
        return true;
      }

      // Network timeout
      if (error.code === "ECONNABORTED") {
        return true;
      }

      // Connection refused
      if (error.code === "ECONNREFUSED") {
        return true;
      }

      // Network unreachable
      if (error.code === "ENETUNREACH") {
        return true;
      }
    }

    // Check error message for network-related keywords
    const errorMessage = error?.message?.toLowerCase() || "";
    const networkKeywords = ["network", "dns", "timeout", "connection", "unreachable", "refused"];
    return networkKeywords.some(keyword => errorMessage.includes(keyword));
  }

  async fetchReviews(
    appId: string,
    regions: string[] = ["us", "gb", "ca"],
    maxPages: number = 3
  ): Promise<AppStoreReview[]> {
    return benchmark.measure(
      "fetchReviews",
      async () => {
        const allReviews: AppStoreReview[] = [];

        for (const region of regions) {
          const regionReviews = await benchmark.measure(
            `fetchReviews_${region}`,
            async () => {
              const reviews: AppStoreReview[] = [];

              for (let page = 1; page <= maxPages; page++) {
                const pageReviews = await benchmark.measure(
                  `fetchReviews_${region}_page_${page}`,
                  async () => {
                    return this.retryRequest(async baseURL => {
                      const url = `${baseURL}/${region}/rss/customerreviews/id=${appId}/sortby=mostrecent/json`;
                      const response = await axios.get(url, { timeout: 10000 }); // Increased timeout

                      const entries = response.data?.feed?.entry || [];
                      if (!entries || entries.length === 0) {
                        return [];
                      }

                      return entries.map((entry: any) => ({
                        id: entry.id?.label || "",
                        region,
                        title: entry.title?.label || "",
                        content: entry.content?.label || "",
                        rating: parseInt(entry["im:rating"]?.label || "0"),
                        version: entry["im:version"]?.label || "",
                        date: entry.updated?.label || "",
                        author: entry.author?.name?.label || "",
                      }));
                    });
                  },
                  { region, page, appId }
                );

                reviews.push(...pageReviews);

                // Stop if no more reviews
                if (pageReviews.length === 0) break;

                // Rate limiting
                if (page < maxPages) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }

              return reviews;
            },
            { region, maxPages, appId }
          );

          allReviews.push(...regionReviews);
        }

        return allReviews;
      },
      { regions, maxPages, appId }
    );
  }

  async fetchAppMetadata(appId: string, region: string = "us"): Promise<AppMetadata | null> {
    return benchmark.measure(
      "fetchAppMetadata",
      async () => {
        return this.retryRequest(async baseURL => {
          const url = `${baseURL}/lookup?id=${appId}&country=${region}`;
          const response = await axios.get(url, { timeout: 10000 }); // Increased timeout

          const results = response.data?.results;
          if (!results || results.length === 0) {
            return null;
          }

          const app = results[0];
          return {
            trackName: app.trackName || "",
            primaryGenreName: app.primaryGenreName || "",
            version: app.version || "",
            averageUserRating: app.averageUserRating || 0,
            userRatingCount: app.userRatingCount || 0,
            description: app.description || "",
            sellerName: app.sellerName || "",
            trackId: app.trackId || "",
            releaseNotes: app.releaseNotes,
            releaseDate: app.releaseDate || "",
            currentVersionReleaseDate: app.currentVersionReleaseDate || "",
          };
        });
      },
      { appId, region }
    );
  }

  async searchApps(keyword: string, region: string = "us", limit: number = 20): Promise<AppSearchResult[]> {
    return benchmark.measure(
      "searchApps",
      async () => {
        return this.retryRequest(async baseURL => {
          const url = `${baseURL}/search?term=${encodeURIComponent(
            keyword
          )}&country=${region}&entity=software&limit=${limit}`;
          const response = await axios.get(url, { timeout: 10000 }); // Increased timeout

          const results = response.data?.results || [];
          return results.map((app: any) => ({
            trackId: app.trackId || "",
            trackName: app.trackName || "",
            primaryGenreName: app.primaryGenreName || "",
            averageUserRating: app.averageUserRating || 0,
            userRatingCount: app.userRatingCount || 0,
            sellerName: app.sellerName || "",
          }));
        });
      },
      { keyword, region, limit }
    );
  }

  async findCompetitors(appId: string, region: string = "us", limit: number = 10): Promise<AppSearchResult[]> {
    return benchmark.measure(
      "findCompetitors",
      async () => {
        // First get the app metadata to find its category
        const appMetadata = await this.fetchAppMetadata(appId, region);
        if (!appMetadata) {
          return [];
        }

        // Search for apps in the same category
        const competitors = await this.searchApps(appMetadata.primaryGenreName, region, limit);

        // Filter out the app itself
        return competitors.filter(app => app.trackId !== appId);
      },
      { appId, region, limit }
    );
  }
}

export const appStoreAPI = new AppStoreAPI();

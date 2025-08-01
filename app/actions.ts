"use server";

import { appStoreAPI, type AppStoreReview, type AppMetadata } from "@/lib/app-store-api";
import { ReviewAnalyzer, type FilteredAnalysis } from "@/lib/analysis";
import { ReviewFilter } from "@/lib/review-filter";
import { benchmark } from "@/lib/benchmark";
import {
  getCachedReviews,
  setCachedReviews,
  getCachedMetadata,
  setCachedMetadata,
  getCachedAnalysis,
  setCachedAnalysis,
  clearCache,
  getCacheStatus,
} from "@/lib/cache";
import { CompetitorAnalyzer } from "@/lib/competitor-analysis";

export interface FetchDataResult {
  reviews: AppStoreReview[];
  metadata: AppMetadata | null;
  error?: string;
}

export async function fetchAppStoreData(appId: string, regions: string[]): Promise<FetchDataResult> {
  return benchmark.measure(
    "fetchAppStoreData",
    async () => {
      try {
        // Validate input
        if (!appId.trim()) {
          return {
            reviews: [],
            metadata: null,
            error: "App ID is required",
          };
        }

        if (!regions.length) {
          return {
            reviews: [],
            metadata: null,
            error: "At least one region must be selected",
          };
        }

        // Check cache first
        const cachedReviews = await getCachedReviews(appId, regions);
        const cachedMetadata = await getCachedMetadata(appId);

        if (cachedReviews && cachedMetadata) {
          console.log("📦 Using cached data for faster response");
          return {
            reviews: cachedReviews,
            metadata: cachedMetadata,
          };
        }

        // Fetch app metadata
        const metadata = await appStoreAPI.fetchAppMetadata(appId);

        if (!metadata) {
          return {
            reviews: [],
            metadata: null,
            error: "App not found. Please check the App Store ID.",
          };
        }

        // Cache metadata
        setCachedMetadata(appId, metadata);

        // Fetch reviews from all selected regions
        const allReviews: AppStoreReview[] = [];

        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          try {
            const regionReviews = await appStoreAPI.fetchReviews(appId, [region], 3);
            allReviews.push(...regionReviews);

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error fetching reviews for region ${region}:`, error);
            // Continue with other regions even if one fails
          }
        }

        // Cache reviews
        setCachedReviews(appId, regions, allReviews);

        return {
          reviews: allReviews,
          metadata,
        };
      } catch (error) {
        console.error("Error in fetchAppStoreData:", error);

        // Provide more specific error messages based on the error type
        let errorMessage = "Failed to fetch data. Please try again.";

        if (error instanceof Error) {
          if (error.message.includes("EAI_AGAIN") || error.message.includes("ENOTFOUND")) {
            errorMessage = "Network connectivity issue. Please check your internet connection and try again.";
          } else if (error.message.includes("timeout") || error.message.includes("ECONNABORTED")) {
            errorMessage = "Request timed out. The App Store servers might be slow. Please try again.";
          } else if (error.message.includes("ECONNREFUSED")) {
            errorMessage = "Connection refused. Please check your network settings and try again.";
          } else if (error.message.includes("ENETUNREACH")) {
            errorMessage = "Network unreachable. Please check your internet connection and try again.";
          }
        }

        return {
          reviews: [],
          metadata: null,
          error: errorMessage,
        };
      }
    },
    { appId, regions, regionsCount: regions.length }
  );
}

export interface AnalysisResult {
  basicStats: any;
  sentimentAnalysis: any;
  trendData: any;
  versionAnalysis: any;
  regionalAnalysis: any;
  keywordAnalysis: any;
  topReviews: any;
  filteredAnalysis: FilteredAnalysis;
}

export async function analyzeReviews(reviews: AppStoreReview[], metadata?: AppMetadata): Promise<AnalysisResult> {
  return benchmark.measure(
    "analyzeReviews",
    async () => {
      try {
        // Check cache first
        const appId = reviews[0]?.id?.split("-")[0] || "unknown";
        const regions = [...new Set(reviews.map(r => r.region))];
        const cachedAnalysis = await getCachedAnalysis(appId, regions);

        if (cachedAnalysis) {
          console.log("📦 Using cached analysis for faster response");
          return cachedAnalysis;
        }

        if (!reviews || reviews.length === 0) {
          throw new Error("No reviews provided for analysis");
        }

        console.log(`🔍 Starting analysis of ${reviews.length} reviews`);

        const analyzer = new ReviewAnalyzer(reviews, metadata);

        // Test basic analysis first
        console.log("🧪 Testing basic analysis...");
        const testBasicStats = analyzer.getBasicStats();
        const testKeywordAnalysis = analyzer.getKeywordAnalysis();
        const testTopReviews = analyzer.getTopReviews(3);

        console.log("🧪 Test results:");
        console.log("- Basic stats:", testBasicStats);
        console.log("- Keyword analysis length:", testKeywordAnalysis?.length);
        console.log("- Top reviews positive:", testTopReviews?.positive?.length);
        console.log("- Top reviews negative:", testTopReviews?.negative?.length);

        // Filter reviews first
        console.log("📊 Filtering reviews...");
        const filteredAnalysis = await analyzer.filterReviews(true); // Use LLM if available

        console.log("📈 Generating analysis...");
        const analysis = {
          basicStats: analyzer.getBasicStats(),
          sentimentAnalysis: analyzer.getSentimentAnalysis(),
          trendData: analyzer.getTrendAnalysis(),
          versionAnalysis: analyzer.getVersionAnalysis(),
          regionalAnalysis: analyzer.getRegionalAnalysis(),
          keywordAnalysis: analyzer.getKeywordAnalysis(),
          topReviews: analyzer.getTopReviews(3),
          filteredAnalysis,
        };

        console.log("✅ Analysis completed:", {
          basicStats: analysis.basicStats,
          sentimentAnalysis: analysis.sentimentAnalysis,
          filteredAnalysis: analysis.filteredAnalysis,
          keywordAnalysis: analysis.keywordAnalysis,
          topReviews: analysis.topReviews,
        });

        console.log("📊 Analysis details:");
        console.log("- Keyword analysis length:", analysis.keywordAnalysis?.length);
        console.log("- Top reviews positive:", analysis.topReviews?.positive?.length);
        console.log("- Top reviews negative:", analysis.topReviews?.negative?.length);
        console.log("- Basic stats total reviews:", analysis.basicStats?.totalReviews);

        // Cache analysis
        setCachedAnalysis(appId, regions, analysis);

        return analysis;
      } catch (error) {
        console.error("Error analyzing reviews:", error);
        throw new Error("Failed to analyze reviews");
      }
    },
    { totalReviews: reviews.length }
  );
}

export async function searchApps(keyword: string, region: string = "us"): Promise<any[]> {
  return benchmark.measure(
    "searchApps",
    async () => {
      try {
        return await appStoreAPI.searchApps(keyword, region, 10);
      } catch (error) {
        console.error("Error searching apps:", error);
        return [];
      }
    },
    { keyword, region }
  );
}

export async function findCompetitors(appId: string, region: string = "us"): Promise<any[]> {
  return benchmark.measure(
    "findCompetitors",
    async () => {
      try {
        return await appStoreAPI.findCompetitors(appId, region, 10);
      } catch (error) {
        console.error("Error finding competitors:", error);
        return [];
      }
    },
    { appId, region }
  );
}

export async function analyzeCompetitors(
  appId: string,
  appName: string,
  appGenre: string,
  regions: string[] = ["us", "gb", "ca", "au"]
): Promise<any> {
  return benchmark.measure(
    "analyze_competitors",
    async () => {
      const competitorAnalyzer = new CompetitorAnalyzer();
      const result = await competitorAnalyzer.analyzeCompetitors(appId, appName, appGenre, regions);
      return result;
    },
    { appId, appName, appGenre, regions: regions.length }
  );
}

// Function to get benchmark results
export async function getBenchmarkResults() {
  return benchmark.getResults();
}

// Function to get benchmark summary
export async function getBenchmarkSummary() {
  return benchmark.getSummary();
}

// Function to print benchmark summary
export async function printBenchmarkSummary() {
  benchmark.printSummary();
}

// Function to clear benchmark results
export async function clearBenchmarkResults() {
  benchmark.clear();
}

// Cache management functions
export async function clearAnalysisCache() {
  clearCache();
}

export async function getCacheInfo() {
  return getCacheStatus();
}

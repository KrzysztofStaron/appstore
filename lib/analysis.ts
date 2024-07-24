import { AppStoreReview, AppMetadata } from "./app-store-api";
import { ReviewFilter, ReviewFilterResult } from "./review-filter";
import { benchmark } from "./benchmark";

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface TrendData {
  date: string;
  averageRating: number;
  reviewCount: number;
}

export interface VersionAnalysis {
  version: string;
  averageRating: number;
  reviewCount: number;
  sentimentBreakdown: SentimentAnalysis;
}

export interface RegionalAnalysis {
  region: string;
  averageRating: number;
  reviewCount: number;
  sentimentBreakdown: SentimentAnalysis;
}

export interface KeywordAnalysis {
  keyword: string;
  count: number;
  averageRating: number;
  sentiment: "positive" | "negative" | "neutral";
}

export interface FilteredAnalysis {
  totalReviews: number;
  informativeReviews: number;
  nonInformativeReviews: number;
  informativePercentage: number;
  categoryBreakdown: Record<string, number>;
}

// New advanced metrics interfaces
export interface ReviewLengthAnalysis {
  shortReviews: number; // < 50 chars
  mediumReviews: number; // 50-200 chars
  longReviews: number; // > 200 chars
  averageLength: number;
  lengthDistribution: Record<string, number>;
}

export interface EngagementMetrics {
  responseRate: number; // % of reviews with developer responses
  averageResponseTime: number; // in days
  responseQuality: number; // average rating of reviews with responses
}

export interface SentimentTrends {
  weeklyTrends: TrendData[];
  monthlyTrends: TrendData[];
  sentimentVolatility: number; // standard deviation of ratings
  sentimentMomentum: number; // recent vs historical sentiment
}

export interface PerformanceMetrics {
  crashReports: number;
  performanceIssues: number;
  bugReports: number;
  featureRequests: number;
  uiIssues: number;
  categoryBreakdown: Record<string, number>;
}

export interface UserBehaviorMetrics {
  ratingDistribution: Record<number, number>;
  reviewFrequency: number; // reviews per day
  peakReviewTimes: string[]; // days with most reviews
  seasonalPatterns: Record<string, number>;
}

export interface AdvancedAnalysisResult {
  basicStats: any;
  sentimentAnalysis: SentimentAnalysis;
  trendData: TrendData[];
  versionAnalysis: VersionAnalysis[];
  regionalAnalysis: RegionalAnalysis[];
  keywordAnalysis: KeywordAnalysis[];
  topReviews: any;
  filteredAnalysis: FilteredAnalysis;
  // New advanced metrics
  reviewLengthAnalysis: ReviewLengthAnalysis;
  engagementMetrics: EngagementMetrics;
  sentimentTrends: SentimentTrends;
  performanceMetrics: PerformanceMetrics;
  userBehaviorMetrics: UserBehaviorMetrics;
}

export class ReviewAnalyzer {
  private reviews: AppStoreReview[];
  private metadata: AppMetadata | null;
  private reviewFilter: ReviewFilter;
  private filteredReviews: AppStoreReview[] = [];
  private filterResults: ReviewFilterResult[] = [];

  constructor(reviews: AppStoreReview[], metadata?: AppMetadata) {
    this.reviews = reviews;
    this.metadata = metadata || null;
    this.reviewFilter = new ReviewFilter();

    console.log(`🔍 ReviewAnalyzer initialized with ${reviews.length} reviews`);
    if (reviews.length > 0) {
      console.log("Sample review:", {
        id: reviews[0].id,
        title: reviews[0].title,
        content: reviews[0].content?.substring(0, 50) + "...",
        rating: reviews[0].rating,
        region: reviews[0].region,
      });
    }
  }

  // Get overall app rating from metadata or fallback to reviews average
  private getOverallRating(): number {
    if (this.metadata && this.metadata.averageUserRating) {
      return this.metadata.averageUserRating;
    }
    // Fallback to reviews average if no metadata
    const reviewsToAnalyze = this.getReviewsToAnalyze();
    if (reviewsToAnalyze.length === 0) return 0;
    return reviewsToAnalyze.reduce((sum, r) => sum + r.rating, 0) / reviewsToAnalyze.length;
  }

  // Helper function to compare semantic versions
  private compareVersions(a: string, b: string): number {
    const normalize = (version: string) => {
      return version.split(".").map(part => {
        const num = parseInt(part, 10);
        return isNaN(num) ? 0 : num;
      });
    };

    const aParts = normalize(a);
    const bParts = normalize(b);

    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart !== bPart) {
        return aPart - bPart;
      }
    }

    return 0;
  }

  // Filter reviews using LLM
  async filterReviews(useLLM: boolean = true): Promise<FilteredAnalysis> {
    return benchmark.measure(
      "filterReviews",
      async () => {
        if (useLLM && process.env.OPENROUTER_API_KEY) {
          try {
            const filterResults = await this.reviewFilter.filterReviews(
              this.reviews.map(review => ({ title: review.title, content: review.content }))
            );

            // Map the filtered results back to the original reviews
            // We need to find the original reviews that match the filtered results
            this.filteredReviews = filterResults.informative
              .map(item => {
                // Find the original review that matches this filtered review
                const originalReview = this.reviews.find(
                  review => review.title === item.review.title && review.content === item.review.content
                );
                return originalReview!;
              })
              .filter(Boolean); // Remove any undefined results

            this.filterResults = filterResults.informative.map(item => item.filterResult);

            // If LLM filtering resulted in no reviews, fall back to heuristic
            if (this.filteredReviews.length === 0) {
              console.log("⚠️ LLM filtering returned no reviews, falling back to heuristic");
              return this.filterReviewsHeuristic();
            }

            const categoryBreakdown = this.filterResults.reduce((acc, result) => {
              const category = result.category || "unknown";
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return {
              totalReviews: this.reviews.length,
              informativeReviews: this.filteredReviews.length,
              nonInformativeReviews: this.reviews.length - this.filteredReviews.length,
              informativePercentage: Math.round((this.filteredReviews.length / this.reviews.length) * 100),
              categoryBreakdown,
            };
          } catch (error) {
            console.error("LLM filtering failed, falling back to heuristic:", error);
            return this.filterReviewsHeuristic();
          }
        } else {
          return this.filterReviewsHeuristic();
        }
      },
      { useLLM, totalReviews: this.reviews.length }
    );
  }

  // Heuristic-based filtering as fallback
  private filterReviewsHeuristic(): FilteredAnalysis {
    return benchmark.measureSync(
      "filterReviewsHeuristic",
      () => {
        const filterResults = this.reviewFilter.filterReviewsHeuristic(
          this.reviews.map(review => ({ title: review.title, content: review.content }))
        );

        // Map the filtered results back to the original reviews
        this.filteredReviews = filterResults.informative
          .map(item => {
            // Find the original review that matches this filtered review
            const originalReview = this.reviews.find(
              review => review.title === item.review.title && review.content === item.review.content
            );
            return originalReview!;
          })
          .filter(Boolean); // Remove any undefined results

        this.filterResults = filterResults.informative.map(item => item.filterResult);

        const categoryBreakdown = this.filterResults.reduce((acc, result) => {
          const category = result.category || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalReviews: this.reviews.length,
          informativeReviews: this.filteredReviews.length,
          nonInformativeReviews: this.reviews.length - this.filteredReviews.length,
          informativePercentage: Math.round((this.filteredReviews.length / this.reviews.length) * 100),
          categoryBreakdown,
        };
      },
      { totalReviews: this.reviews.length }
    );
  }

  // Get the reviews to analyze (filtered or all)
  private getReviewsToAnalyze(): AppStoreReview[] {
    // If we have filtered reviews, use them. Otherwise, use all reviews.
    // This ensures we always have data to analyze, even if LLM filtering fails.
    const reviewsToUse = this.filteredReviews.length > 0 ? this.filteredReviews : this.reviews;

    // Final fallback: if somehow we have no reviews, return the original reviews
    const finalReviews = reviewsToUse.length > 0 ? reviewsToUse : this.reviews;

    console.log(
      `📊 Analyzing ${finalReviews.length} reviews (${this.filteredReviews.length} filtered, ${this.reviews.length} total)`
    );

    if (finalReviews.length === 0) {
      console.warn("⚠️ No reviews available for analysis!");
    }

    return finalReviews;
  }

  // Basic statistics
  getBasicStats() {
    return benchmark.measureSync(
      "getBasicStats",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const totalReviews = reviewsToAnalyze.length;
        const averageRating =
          totalReviews > 0 ? reviewsToAnalyze.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

        const ratingDistribution = {
          1: reviewsToAnalyze.filter(r => r.rating === 1).length,
          2: reviewsToAnalyze.filter(r => r.rating === 2).length,
          3: reviewsToAnalyze.filter(r => r.rating === 3).length,
          4: reviewsToAnalyze.filter(r => r.rating === 4).length,
          5: reviewsToAnalyze.filter(r => r.rating === 5).length,
        };

        return {
          totalReviews,
          averageRating: Math.round(averageRating * 100) / 100,
          ratingDistribution,
          totalRatings: reviewsToAnalyze.reduce((sum, review) => sum + review.rating, 0),
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Sentiment analysis based on ratings
  getSentimentAnalysis(): SentimentAnalysis {
    return benchmark.measureSync(
      "getSentimentAnalysis",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const positive = reviewsToAnalyze.filter(r => r.rating >= 4).length;
        const negative = reviewsToAnalyze.filter(r => r.rating <= 2).length;
        const neutral = reviewsToAnalyze.filter(r => r.rating === 3).length;
        const total = reviewsToAnalyze.length;

        return {
          positive,
          negative,
          neutral,
          total,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Trend analysis by date
  getTrendAnalysis(): TrendData[] {
    return benchmark.measureSync(
      "getTrendAnalysis",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const reviewsByDate = reviewsToAnalyze.reduce((acc, review) => {
          try {
            const reviewDate = new Date(review.date);

            // Check if the date is valid
            if (isNaN(reviewDate.getTime())) {
              console.warn(`Invalid date found: ${review.date}, skipping review ${review.id}`);
              return acc;
            }

            const date = reviewDate.toISOString().split("T")[0];
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(review);
          } catch (error) {
            console.warn(`Error processing date for review ${review.id}: ${review.date}`, error);
            // Skip this review if date processing fails
          }
          return acc;
        }, {} as Record<string, AppStoreReview[]>);

        return Object.entries(reviewsByDate)
          .map(([date, reviews]) => ({
            date,
            averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length, // Use written reviews average
            reviewCount: reviews.length,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Version analysis with proper semantic sorting
  getVersionAnalysis(): VersionAnalysis[] {
    return benchmark.measureSync(
      "getVersionAnalysis",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const reviewsByVersion = reviewsToAnalyze.reduce((acc, review) => {
          if (!acc[review.version]) {
            acc[review.version] = [];
          }
          acc[review.version].push(review);
          return acc;
        }, {} as Record<string, AppStoreReview[]>);

        return Object.entries(reviewsByVersion)
          .map(([version, reviews]) => {
            const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            const positive = reviews.filter(r => r.rating >= 4).length;
            const negative = reviews.filter(r => r.rating <= 2).length;
            const neutral = reviews.filter(r => r.rating === 3).length;

            return {
              version,
              averageRating: Math.round(averageRating * 100) / 100, // Use written reviews average
              reviewCount: reviews.length,
              sentimentBreakdown: {
                positive,
                negative,
                neutral,
                total: reviews.length,
              },
            };
          })
          .sort((a, b) => this.compareVersions(a.version, b.version));
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Regional analysis
  getRegionalAnalysis(): RegionalAnalysis[] {
    return benchmark.measureSync(
      "getRegionalAnalysis",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const reviewsByRegion = reviewsToAnalyze.reduce((acc, review) => {
          if (!acc[review.region]) {
            acc[review.region] = [];
          }
          acc[review.region].push(review);
          return acc;
        }, {} as Record<string, AppStoreReview[]>);

        return Object.entries(reviewsByRegion)
          .map(([region, reviews]) => {
            const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            const positive = reviews.filter(r => r.rating >= 4).length;
            const negative = reviews.filter(r => r.rating <= 2).length;
            const neutral = reviews.filter(r => r.rating === 3).length;

            return {
              region: region.toUpperCase(),
              averageRating: Math.round(averageRating * 100) / 100,
              reviewCount: reviews.length,
              sentimentBreakdown: {
                positive,
                negative,
                neutral,
                total: reviews.length,
              },
            };
          })
          .sort((a, b) => b.reviewCount - a.reviewCount);
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Keyword analysis
  getKeywordAnalysis(): KeywordAnalysis[] {
    return benchmark.measureSync(
      "getKeywordAnalysis",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        console.log(`🔍 Keyword analysis: analyzing ${reviewsToAnalyze.length} reviews`);

        if (reviewsToAnalyze.length === 0) {
          console.warn("⚠️ No reviews available for keyword analysis");
          return [];
        }

        const keywords = [
          "bug",
          "crash",
          "error",
          "problem",
          "issue",
          "broken",
          "not working",
          "great",
          "awesome",
          "excellent",
          "amazing",
          "love",
          "perfect",
          "best",
          "slow",
          "lag",
          "freeze",
          "unresponsive",
          "performance",
          "update",
          "new",
          "feature",
          "improvement",
          "better",
          "interface",
          "ui",
          "ux",
          "design",
          "layout",
          "user friendly",
          "price",
          "cost",
          "expensive",
          "cheap",
          "free",
          "money",
          "support",
          "help",
          "customer service",
          "response",
        ];

        const keywordStats = keywords
          .map(keyword => {
            const matchingReviews = reviewsToAnalyze.filter(
              review =>
                review.content.toLowerCase().includes(keyword.toLowerCase()) ||
                review.title.toLowerCase().includes(keyword.toLowerCase())
            );

            if (matchingReviews.length === 0) {
              return null;
            }

            const averageRating = matchingReviews.reduce((sum, r) => sum + r.rating, 0) / matchingReviews.length;
            const sentiment = averageRating >= 4 ? "positive" : averageRating <= 2 ? "negative" : "neutral";

            return {
              keyword,
              count: matchingReviews.length,
              averageRating: Math.round(averageRating * 100) / 100,
              sentiment,
            };
          })
          .filter(Boolean) as KeywordAnalysis[];

        const result = keywordStats.sort((a, b) => b.count - a.count);
        console.log(`✅ Keyword analysis completed: found ${result.length} keywords`);
        return result;
      },
      { totalReviews: this.getReviewsToAnalyze().length, keywordsCount: 40 }
    );
  }

  // Get filtered reviews
  getFilteredReviews(): AppStoreReview[] {
    return this.filteredReviews;
  }

  // Get filter results
  getFilterResults(): ReviewFilterResult[] {
    return this.filterResults;
  }

  // Filter reviews by criteria
  filterReviewsByCriteria(criteria: {
    minRating?: number;
    maxRating?: number;
    regions?: string[];
    versions?: string[];
    dateRange?: { start: string; end: string };
  }): AppStoreReview[] {
    return benchmark.measureSync(
      "filterReviewsByCriteria",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        return reviewsToAnalyze.filter(review => {
          if (criteria.minRating && review.rating < criteria.minRating) return false;
          if (criteria.maxRating && review.rating > criteria.maxRating) return false;
          if (criteria.regions && !criteria.regions.includes(review.region)) return false;
          if (criteria.versions && !criteria.versions.includes(review.version)) return false;
          if (criteria.dateRange) {
            try {
              const reviewDate = new Date(review.date);

              // Check if the date is valid
              if (isNaN(reviewDate.getTime())) {
                console.warn(`Invalid date found: ${review.date}, skipping review ${review.id}`);
                return false;
              }

              const startDate = new Date(criteria.dateRange.start);
              const endDate = new Date(criteria.dateRange.end);

              if (reviewDate < startDate || reviewDate > endDate) return false;
            } catch (error) {
              console.warn(`Error processing date for review ${review.id}: ${review.date}`, error);
              return false;
            }
          }
          return true;
        });
      },
      { criteria, totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Get recent reviews
  getRecentReviews(days: number = 30): AppStoreReview[] {
    return benchmark.measureSync(
      "getRecentReviews",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return reviewsToAnalyze.filter(review => {
          try {
            const reviewDate = new Date(review.date);

            // Check if the date is valid
            if (isNaN(reviewDate.getTime())) {
              console.warn(`Invalid date found: ${review.date}, skipping review ${review.id}`);
              return false;
            }

            return reviewDate >= cutoffDate;
          } catch (error) {
            console.warn(`Error processing date for review ${review.id}: ${review.date}`, error);
            return false;
          }
        });
      },
      { days, totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Get top positive and negative reviews
  getTopReviews(count: number = 10): {
    positive: AppStoreReview[];
    negative: AppStoreReview[];
  } {
    return benchmark.measureSync(
      "getTopReviews",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        console.log(`🔍 Top reviews: analyzing ${reviewsToAnalyze.length} reviews`);

        if (reviewsToAnalyze.length === 0) {
          console.warn("⚠️ No reviews available for top reviews analysis");
          return { positive: [], negative: [] };
        }

        const positive = reviewsToAnalyze
          .filter(r => r.rating >= 4)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, count);

        const negative = reviewsToAnalyze
          .filter(r => r.rating <= 2)
          .sort((a, b) => a.rating - b.rating)
          .slice(0, count);

        console.log(`✅ Top reviews: found ${positive.length} positive, ${negative.length} negative`);
        return { positive, negative };
      },
      { count, totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Advanced metrics methods

  // Review length analysis
  getReviewLengthAnalysis(): ReviewLengthAnalysis {
    return benchmark.measureSync(
      "getReviewLengthAnalysis",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const lengths = reviewsToAnalyze.map(review => {
          const totalLength = (review.title + review.content).length;
          return totalLength;
        });

        const averageLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
        const shortReviews = lengths.filter(length => length < 50).length;
        const mediumReviews = lengths.filter(length => length >= 50 && length <= 200).length;
        const longReviews = lengths.filter(length => length > 200).length;

        // Create length distribution buckets
        const lengthDistribution = {
          "0-25": lengths.filter(l => l <= 25).length,
          "26-50": lengths.filter(l => l > 25 && l <= 50).length,
          "51-100": lengths.filter(l => l > 50 && l <= 100).length,
          "101-200": lengths.filter(l => l > 100 && l <= 200).length,
          "201-500": lengths.filter(l => l > 200 && l <= 500).length,
          "500+": lengths.filter(l => l > 500).length,
        };

        return {
          shortReviews,
          mediumReviews,
          longReviews,
          averageLength: Math.round(averageLength * 100) / 100,
          lengthDistribution,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Engagement metrics (simulated since App Store API doesn't provide response data)
  getEngagementMetrics(): EngagementMetrics {
    return benchmark.measureSync(
      "getEngagementMetrics",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();

        // Simulate engagement metrics based on review characteristics
        const detailedReviews = reviewsToAnalyze.filter(review => (review.title + review.content).length > 100);

        const responseRate = Math.min(15, (detailedReviews.length / reviewsToAnalyze.length) * 100);
        const averageResponseTime = 2.5; // Simulated average response time in days
        const responseQuality = 4.2; // Simulated average rating for reviews with responses

        return {
          responseRate: Math.round(responseRate * 100) / 100,
          averageResponseTime,
          responseQuality,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Sentiment trends with volatility and momentum
  getSentimentTrends(): SentimentTrends {
    return benchmark.measureSync(
      "getSentimentTrends",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();

        // Group by week and month
        const weeklyData = this.groupReviewsByTimeframe(reviewsToAnalyze, "week");
        const monthlyData = this.groupReviewsByTimeframe(reviewsToAnalyze, "month");

        // Calculate sentiment volatility (standard deviation of ratings)
        const ratings = reviewsToAnalyze.map(r => r.rating);
        const meanRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - meanRating, 2), 0) / ratings.length;
        const sentimentVolatility = Math.sqrt(variance);

        // Calculate sentiment momentum (recent vs historical)
        const recentReviews = reviewsToAnalyze.slice(0, Math.floor(reviewsToAnalyze.length * 0.3));
        const historicalReviews = reviewsToAnalyze.slice(Math.floor(reviewsToAnalyze.length * 0.3));

        const recentAvg =
          recentReviews.length > 0 ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length : 0;
        const historicalAvg =
          historicalReviews.length > 0
            ? historicalReviews.reduce((sum, r) => sum + r.rating, 0) / historicalReviews.length
            : 0;

        const sentimentMomentum = recentAvg - historicalAvg;

        return {
          weeklyTrends: weeklyData,
          monthlyTrends: monthlyData,
          sentimentVolatility: Math.round(sentimentVolatility * 100) / 100,
          sentimentMomentum: Math.round(sentimentMomentum * 100) / 100,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Performance metrics based on keyword analysis
  getPerformanceMetrics(): PerformanceMetrics {
    return benchmark.measureSync(
      "getPerformanceMetrics",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();

        const crashKeywords = ["crash", "crashes", "crashed", "freeze", "frozen", "freezes", "error", "errors"];
        const performanceKeywords = ["slow", "lag", "lags", "laggy", "unresponsive", "performance", "speed"];
        const bugKeywords = ["bug", "bugs", "broken", "not working", "doesn't work", "issue", "issues"];
        const featureKeywords = ["feature", "features", "add", "missing", "want", "need", "suggestion"];
        const uiKeywords = ["ui", "ux", "interface", "design", "layout", "user interface", "user experience"];

        const crashReports = this.countKeywordOccurrences(reviewsToAnalyze, crashKeywords);
        const performanceIssues = this.countKeywordOccurrences(reviewsToAnalyze, performanceKeywords);
        const bugReports = this.countKeywordOccurrences(reviewsToAnalyze, bugKeywords);
        const featureRequests = this.countKeywordOccurrences(reviewsToAnalyze, featureKeywords);
        const uiIssues = this.countKeywordOccurrences(reviewsToAnalyze, uiKeywords);

        const categoryBreakdown = {
          "Crashes & Errors": crashReports,
          "Performance Issues": performanceIssues,
          "Bugs & Issues": bugReports,
          "Feature Requests": featureRequests,
          "UI/UX Issues": uiIssues,
        };

        return {
          crashReports,
          performanceIssues,
          bugReports,
          featureRequests,
          uiIssues,
          categoryBreakdown,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // User behavior metrics
  getUserBehaviorMetrics(): UserBehaviorMetrics {
    return benchmark.measureSync(
      "getUserBehaviorMetrics",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();

        // Rating distribution
        const ratingDistribution = {
          1: reviewsToAnalyze.filter(r => r.rating === 1).length,
          2: reviewsToAnalyze.filter(r => r.rating === 2).length,
          3: reviewsToAnalyze.filter(r => r.rating === 3).length,
          4: reviewsToAnalyze.filter(r => r.rating === 4).length,
          5: reviewsToAnalyze.filter(r => r.rating === 5).length,
        };

        // Review frequency (reviews per day)
        const validDates = reviewsToAnalyze.filter(review => {
          try {
            const date = new Date(review.date);
            return !isNaN(date.getTime());
          } catch {
            return false;
          }
        });

        if (validDates.length === 0) {
          return {
            ratingDistribution,
            reviewFrequency: 0,
            peakReviewTimes: [],
            seasonalPatterns: {},
          };
        }

        const dates = validDates.map(review => new Date(review.date));
        const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const daysDiff = (latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24);
        const reviewFrequency = daysDiff > 0 ? validDates.length / daysDiff : 0;

        // Peak review times (days with most reviews)
        const reviewsByDay = validDates.reduce((acc, review) => {
          const date = new Date(review.date);
          const dayKey = date.toISOString().split("T")[0];
          acc[dayKey] = (acc[dayKey] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const peakReviewTimes = Object.entries(reviewsByDay)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([date]) => date);

        // Seasonal patterns
        const seasonalPatterns = validDates.reduce((acc, review) => {
          const date = new Date(review.date);
          const month = date.getMonth();
          const season = this.getSeason(month);
          acc[season] = (acc[season] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          ratingDistribution,
          reviewFrequency: Math.round(reviewFrequency * 100) / 100,
          peakReviewTimes,
          seasonalPatterns,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Helper methods for advanced metrics
  private groupReviewsByTimeframe(reviews: AppStoreReview[], timeframe: "week" | "month"): TrendData[] {
    const reviewsByTimeframe = reviews.reduce((acc, review) => {
      try {
        const date = new Date(review.date);
        if (isNaN(date.getTime())) return acc;

        let key: string;
        if (timeframe === "week") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }

        if (!acc[key]) acc[key] = [];
        acc[key].push(review);
      } catch (error) {
        // Skip invalid dates
      }
      return acc;
    }, {} as Record<string, AppStoreReview[]>);

    return Object.entries(reviewsByTimeframe)
      .map(([timeframe, reviews]) => {
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        return {
          date: timeframe,
          averageRating: Math.round(averageRating * 100) / 100,
          reviewCount: reviews.length,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private countKeywordOccurrences(reviews: AppStoreReview[], keywords: string[]): number {
    return reviews.filter(review => {
      const text = `${review.title} ${review.content}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword.toLowerCase()));
    }).length;
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  }
}

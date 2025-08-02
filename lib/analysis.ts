import { AppStoreReview, AppMetadata } from "./app-store-api";
import { ReviewFilter, ReviewFilterResult } from "./review-filter";
import { benchmark } from "./benchmark";
import { ActionableStepsGenerator, ActionableStepsResult } from "./actionable-steps";
import { getConfig } from "./config";

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

export interface AdvancedAnalysisResult {
  basicStats: any;
  sentimentAnalysis: SentimentAnalysis;
  trendData: TrendData[];
  versionAnalysis: VersionAnalysis[];
  regionalAnalysis: RegionalAnalysis[];
  keywordAnalysis: KeywordAnalysis[];
  topReviews: any;
  filteredAnalysis: FilteredAnalysis;
  actionableSteps: ActionableStepsResult;
  dynamicMetrics: {
    ratingTrend: {
      weeklyChange: number;
      monthlyChange: number;
      trendDirection: "up" | "down" | "stable";
      trendDescription: string;
    };
    userComplaints: {
      crashReports: number;
      performanceIssues: number;
      bugReports: number;
      totalIssues: number;
    };
    performanceMetrics: {
      speedComplaints: number;
      speedComplaintChange: number;
      lagComplaints: number;
      freezeComplaints: number;
    };
    keywordTrends: {
      topPositiveKeywords: Array<{ keyword: string; count: number; trend: number }>;
      topNegativeKeywords: Array<{ keyword: string; count: number; trend: number }>;
    };
    timeBasedStats: {
      weeksTracked: number;
      daysTracked: number;
      averageReviewsPerDay: number;
      recentActivity: {
        last7Days: number;
        last30Days: number;
        last90Days: number;
      };
    };
    impactAssessment: {
      criticalIssues: number;
      highPriorityIssues: number;
      mediumPriorityIssues: number;
      lowPriorityIssues: number;
    };
  };
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

    const config = getConfig();
    this.reviewFilter = new ReviewFilter(undefined, config);

    console.log(`🔍 ReviewAnalyzer initialized with ${reviews.length} reviews`);
    console.log(`⚙️ LLM filtering: ${config.llm.enabled ? "enabled" : "disabled"}`);
    if (config.llm.enabled) {
      console.log(`📊 Max reviews for LLM: ${config.llm.maxReviews}`);
      console.log(`📦 Batch size: ${config.llm.batchSize}`);
      console.log(`🔄 Max concurrent batches: ${config.llm.maxConcurrentBatches}`);
    }

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
        const config = getConfig();

        // Check if we should use LLM filtering
        const shouldUseLLM =
          useLLM && config.llm.enabled && this.reviews.length > 0 && this.reviews.length <= config.llm.maxReviews;

        if (shouldUseLLM) {
          try {
            console.log(`🔍 Starting LLM filtering for ${this.reviews.length} reviews...`);

            const filterResults = await this.reviewFilter.filterReviews(
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

            console.log(`✅ LLM filtering completed: ${this.filteredReviews.length} informative reviews found`);

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
          } catch (error: any) {
            console.error("❌ LLM filtering failed, falling back to heuristic:", error.message || error);

            // Log specific error details for debugging
            if (error.code) {
              console.error(`Error code: ${error.code}`);
            }
            if (error.status) {
              console.error(`HTTP status: ${error.status}`);
            }

            return this.filterReviewsHeuristic();
          }
        } else {
          if (!config.llm.enabled) {
            console.log("ℹ️ LLM filtering disabled in configuration, using heuristic filtering");
          } else if (this.reviews.length === 0) {
            console.log("ℹ️ No reviews to filter, using heuristic filtering");
          } else if (this.reviews.length > config.llm.maxReviews) {
            console.log(
              `ℹ️ Too many reviews (${this.reviews.length} > ${config.llm.maxReviews}), using heuristic filtering for performance`
            );
          } else {
            console.log("ℹ️ LLM filtering disabled, using heuristic filtering");
          }
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

  // Enhanced sentiment analysis using AI model
  async getSentimentAnalysis(): Promise<SentimentAnalysis> {
    return benchmark.measure(
      "getSentimentAnalysis",
      async () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();

        console.log(`🎯 getSentimentAnalysis called with ${reviewsToAnalyze.length} reviews`);

        // If no reviews, return empty result
        if (reviewsToAnalyze.length === 0) {
          console.warn("⚠️ No reviews to analyze for sentiment");
          return {
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0,
          };
        }

        try {
          // Use AI sentiment analysis if available
          const { sentimentAnalyzer, analyzeSentimentFallback } = await import("./sentiment-analysis");

          const reviewsForAnalysis = reviewsToAnalyze.map(review => ({
            id: review.id,
            title: review.title,
            content: review.content,
          }));

          console.log(`🤖 Calling AI sentiment analysis for ${reviewsForAnalysis.length} reviews`);

          const sentimentResult = await sentimentAnalyzer.analyzeReviews(reviewsForAnalysis);

          console.log(`✅ AI sentiment analysis completed:`, sentimentResult);

          // Convert percentages to counts based on total reviews
          const total = reviewsToAnalyze.length;
          const positive = Math.round((sentimentResult.positive / 100) * total);
          const negative = Math.round((sentimentResult.negative / 100) * total);
          const neutral = total - positive - negative; // Ensure they add up to total

          const result = {
            positive,
            negative,
            neutral,
            total,
          };

          console.log(`📊 Final sentiment analysis result:`, result);

          return result;
        } catch (error) {
          console.warn("AI sentiment analysis failed, falling back to rating-based analysis:", error);

          // Fallback to rating-based sentiment analysis
          const positive = reviewsToAnalyze.filter(r => r.rating >= 4).length;
          const negative = reviewsToAnalyze.filter(r => r.rating <= 2).length;
          const neutral = reviewsToAnalyze.filter(r => r.rating === 3).length;

          const fallbackResult = {
            positive,
            negative,
            neutral,
            total: reviewsToAnalyze.length,
          };

          console.log(`🔄 Fallback sentiment analysis result:`, fallbackResult);

          return fallbackResult;
        }
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

  // Get dynamic metrics for dashboard
  getDynamicMetrics() {
    return benchmark.measureSync(
      "getDynamicMetrics",
      () => {
        const reviewsToAnalyze = this.getReviewsToAnalyze();
        const trendData = this.getTrendAnalysis();

        // Calculate rating trends
        const ratingTrend = this.calculateRatingTrend(trendData);

        // Calculate user complaints
        const userComplaints = this.calculateUserComplaints(reviewsToAnalyze);

        // Calculate performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(reviewsToAnalyze);

        // Calculate keyword trends
        const keywordTrends = this.calculateKeywordTrends(reviewsToAnalyze);

        // Calculate time-based stats
        const timeBasedStats = this.calculateTimeBasedStats(reviewsToAnalyze);

        // Calculate impact assessment
        const impactAssessment = this.calculateImpactAssessment(userComplaints, performanceMetrics);

        return {
          ratingTrend,
          userComplaints,
          performanceMetrics,
          keywordTrends,
          timeBasedStats,
          impactAssessment,
        };
      },
      { totalReviews: this.getReviewsToAnalyze().length }
    );
  }

  // Calculate rating trend over time
  private calculateRatingTrend(trendData: TrendData[]) {
    if (trendData.length < 2) {
      return {
        weeklyChange: 0,
        monthlyChange: 0,
        trendDirection: "stable" as const,
        trendDescription: "Insufficient data for trend analysis",
      };
    }

    // Sort by date
    const sortedData = [...trendData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate weekly change (last 7 days vs previous 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentWeek = sortedData.filter(d => new Date(d.date) >= weekAgo);
    const previousWeek = sortedData.filter(d => new Date(d.date) >= twoWeeksAgo && new Date(d.date) < weekAgo);

    const recentAvg =
      recentWeek.length > 0 ? recentWeek.reduce((sum, d) => sum + d.averageRating, 0) / recentWeek.length : 0;
    const previousAvg =
      previousWeek.length > 0 ? previousWeek.reduce((sum, d) => sum + d.averageRating, 0) / previousWeek.length : 0;

    const weeklyChange = recentAvg - previousAvg;

    // Calculate monthly change (last 30 days vs previous 30 days)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentMonth = sortedData.filter(d => new Date(d.date) >= monthAgo);
    const previousMonth = sortedData.filter(d => new Date(d.date) >= twoMonthsAgo && new Date(d.date) < monthAgo);

    const recentMonthAvg =
      recentMonth.length > 0 ? recentMonth.reduce((sum, d) => sum + d.averageRating, 0) / recentMonth.length : 0;
    const previousMonthAvg =
      previousMonth.length > 0 ? previousMonth.reduce((sum, d) => sum + d.averageRating, 0) / previousMonth.length : 0;

    const monthlyChange = recentMonthAvg - previousMonthAvg;

    // Determine trend direction
    let trendDirection: "up" | "down" | "stable";
    let trendDescription: string;

    if (monthlyChange > 0.1) {
      trendDirection = "up";
      trendDescription = `Rating improved by ${Math.abs(monthlyChange).toFixed(1)} points over the last month`;
    } else if (monthlyChange < -0.1) {
      trendDirection = "down";
      trendDescription = `Rating decreased by ${Math.abs(monthlyChange).toFixed(1)} points over the last month`;
    } else {
      trendDirection = "stable";
      trendDescription = "Rating has remained stable over the last month";
    }

    return {
      weeklyChange: Math.round(weeklyChange * 100) / 100,
      monthlyChange: Math.round(monthlyChange * 100) / 100,
      trendDirection,
      trendDescription,
    };
  }

  // Calculate user complaints from reviews
  private calculateUserComplaints(reviews: AppStoreReview[]) {
    const crashKeywords = ["crash", "crashes", "crashed", "crashing", "error", "errors", "failed", "failure"];
    const performanceKeywords = ["slow", "lag", "laggy", "freeze", "frozen", "freezing", "unresponsive", "performance"];
    const bugKeywords = [
      "bug",
      "bugs",
      "glitch",
      "glitches",
      "broken",
      "not working",
      "doesn't work",
      "issue",
      "issues",
    ];

    const crashReports = reviews.filter(review =>
      crashKeywords.some(
        keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
      )
    ).length;

    const performanceIssues = reviews.filter(review =>
      performanceKeywords.some(
        keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
      )
    ).length;

    const bugReports = reviews.filter(review =>
      bugKeywords.some(
        keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
      )
    ).length;

    return {
      crashReports,
      performanceIssues,
      bugReports,
      totalIssues: crashReports + performanceIssues + bugReports,
    };
  }

  // Calculate performance metrics
  private calculatePerformanceMetrics(reviews: AppStoreReview[]) {
    const speedKeywords = ["slow", "speed", "fast", "quick", "loading", "load time"];
    const lagKeywords = ["lag", "laggy", "stutter", "jitter"];
    const freezeKeywords = ["freeze", "frozen", "freezing", "unresponsive", "hangs"];

    const speedComplaints = reviews.filter(
      review =>
        speedKeywords.some(
          keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
        ) && review.rating <= 3
    ).length;

    const lagComplaints = reviews.filter(review =>
      lagKeywords.some(
        keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
      )
    ).length;

    const freezeComplaints = reviews.filter(review =>
      freezeKeywords.some(
        keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
      )
    ).length;

    // Calculate change in speed complaints (comparing recent vs older reviews)
    const recentReviews = this.getRecentReviews(30);
    const olderReviews = reviews.filter(review => {
      const reviewDate = new Date(review.date);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return reviewDate < monthAgo;
    });

    const recentSpeedComplaints = recentReviews.filter(
      review =>
        speedKeywords.some(
          keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
        ) && review.rating <= 3
    ).length;

    const olderSpeedComplaints = olderReviews.filter(
      review =>
        speedKeywords.some(
          keyword => review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)
        ) && review.rating <= 3
    ).length;

    const speedComplaintChange = recentSpeedComplaints - olderSpeedComplaints;

    return {
      speedComplaints,
      speedComplaintChange,
      lagComplaints,
      freezeComplaints,
    };
  }

  // Calculate keyword trends
  private calculateKeywordTrends(reviews: AppStoreReview[]) {
    const positiveKeywords = [
      "great",
      "awesome",
      "excellent",
      "amazing",
      "love",
      "perfect",
      "best",
      "fast",
      "useful",
      "helpful",
    ];
    const negativeKeywords = ["bad", "terrible", "awful", "hate", "worst", "slow", "broken", "useless", "waste"];

    const recentReviews = this.getRecentReviews(30);
    const olderReviews = reviews.filter(review => {
      const reviewDate = new Date(review.date);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return reviewDate < monthAgo;
    });

    const topPositiveKeywords = positiveKeywords
      .map(keyword => {
        const recentCount = recentReviews.filter(
          review =>
            (review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)) &&
            review.rating >= 4
        ).length;

        const olderCount = olderReviews.filter(
          review =>
            (review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)) &&
            review.rating >= 4
        ).length;

        const trend = recentCount - olderCount;

        return { keyword, count: recentCount, trend };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topNegativeKeywords = negativeKeywords
      .map(keyword => {
        const recentCount = recentReviews.filter(
          review =>
            (review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)) &&
            review.rating <= 2
        ).length;

        const olderCount = olderReviews.filter(
          review =>
            (review.content.toLowerCase().includes(keyword) || review.title.toLowerCase().includes(keyword)) &&
            review.rating <= 2
        ).length;

        const trend = recentCount - olderCount;

        return { keyword, count: recentCount, trend };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      topPositiveKeywords,
      topNegativeKeywords,
    };
  }

  // Calculate time-based statistics
  private calculateTimeBasedStats(reviews: AppStoreReview[]) {
    if (reviews.length === 0) {
      return {
        weeksTracked: 0,
        daysTracked: 0,
        averageReviewsPerDay: 0,
        recentActivity: {
          last7Days: 0,
          last30Days: 0,
          last90Days: 0,
        },
      };
    }

    const dates = reviews.map(review => new Date(review.date)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const daysTracked = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksTracked = Math.ceil(daysTracked / 7);
    const averageReviewsPerDay = reviews.length / Math.max(daysTracked, 1);

    const now = new Date();
    const last7Days = this.getRecentReviews(7).length;
    const last30Days = this.getRecentReviews(30).length;
    const last90Days = this.getRecentReviews(90).length;

    return {
      weeksTracked,
      daysTracked,
      averageReviewsPerDay: Math.round(averageReviewsPerDay * 100) / 100,
      recentActivity: {
        last7Days,
        last30Days,
        last90Days,
      },
    };
  }

  // Calculate impact assessment
  private calculateImpactAssessment(userComplaints: any, performanceMetrics: any) {
    const criticalIssues = userComplaints.crashReports;
    const highPriorityIssues = userComplaints.performanceIssues;
    const mediumPriorityIssues = performanceMetrics.lagComplaints + performanceMetrics.freezeComplaints;
    const lowPriorityIssues = userComplaints.bugReports - criticalIssues; // Exclude crashes from bugs

    return {
      criticalIssues,
      highPriorityIssues,
      mediumPriorityIssues,
      lowPriorityIssues,
    };
  }

  // Generate actionable steps using AI
  async generateActionableSteps(minVersion?: string): Promise<ActionableStepsResult> {
    return benchmark.measure(
      "generateActionableSteps",
      async () => {
        const generator = new ActionableStepsGenerator(this.reviews, this.metadata || undefined, minVersion);
        return await generator.generateActionableSteps();
      },
      { totalReviews: this.reviews.length }
    );
  }
}

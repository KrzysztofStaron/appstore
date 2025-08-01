import { appStoreAPI } from "./app-store-api";
import { ReviewAnalyzer } from "./analysis";
import { benchmark } from "./benchmark";

export interface CompetitorApp {
  trackId: string;
  trackName: string;
  sellerName: string;
  primaryGenreName: string;
  averageUserRating: number;
  userRatingCount: number;
  version: string;
  description: string;
  releaseDate: string;
  currentVersionReleaseDate: string;
  price: number;
  currency: string;
  artworkUrl100: string;
  artworkUrl512: string;
}

export interface CompetitorAnalysis {
  competitor: CompetitorApp;
  reviews: any[];
  analysis: {
    basicStats: any;
    sentimentAnalysis: any;
    trendData: any;
    versionAnalysis: any;
    keywordAnalysis: any;
  };
  comparison: {
    ratingComparison: number; // difference from main app
    reviewCountComparison: number;
    sentimentComparison: number;
    performanceComparison: number;
    keywordOverlap: string[];
    strengths: string[];
    weaknesses: string[];
    competitiveAdvantage: string;
  };
}

export interface CompetitorComparisonResult {
  mainApp: {
    trackId: string;
    trackName: string;
    averageUserRating: number;
    userRatingCount: number;
  };
  competitors: CompetitorAnalysis[];
  marketAnalysis: {
    averageMarketRating: number;
    marketLeader: CompetitorApp | null;
    marketPosition: "leader" | "challenger" | "follower" | "niche";
    competitiveGap: number;
    marketShare: number;
  };
  insights: {
    topStrengths: string[];
    topWeaknesses: string[];
    opportunities: string[];
    threats: string[];
    recommendations: string[];
  };
}

export class CompetitorAnalyzer {
  private appStoreAPI: typeof appStoreAPI;

  constructor() {
    this.appStoreAPI = appStoreAPI;
  }

  async analyzeCompetitors(
    mainAppId: string,
    mainAppName: string,
    mainAppGenre: string,
    regions: string[] = ["us", "gb", "ca", "au"]
  ): Promise<CompetitorComparisonResult> {
    return benchmark.measure(
      "competitor_analysis_full",
      async () => {
        // Step 1: Find competitors
        const competitors = await this.findCompetitors(mainAppName, mainAppGenre, regions);

        // Step 2: Get main app metadata
        const mainAppMetadata = await this.appStoreAPI.fetchAppMetadata(mainAppId);

        if (!mainAppMetadata) {
          throw new Error(`Could not fetch metadata for app ${mainAppId}`);
        }

        // Step 3: Analyze each competitor
        const competitorAnalyses = await this.analyzeCompetitorApps(competitors, regions);

        // Step 4: Perform market analysis
        const marketAnalysis = this.performMarketAnalysis(mainAppMetadata, competitors);

        // Step 5: Generate insights
        const insights = this.generateInsights(mainAppMetadata, competitorAnalyses);

        return {
          mainApp: {
            trackId: mainAppId,
            trackName: mainAppMetadata.trackName,
            averageUserRating: mainAppMetadata.averageUserRating,
            userRatingCount: mainAppMetadata.userRatingCount,
          },
          competitors: competitorAnalyses,
          marketAnalysis,
          insights,
        };
      },
      { mainAppId, mainAppName, regions: regions.length }
    );
  }

  private async findCompetitors(appName: string, genre: string, regions: string[]): Promise<CompetitorApp[]> {
    return benchmark.measure(
      "find_competitors",
      async () => {
        const competitors: CompetitorApp[] = [];
        const seenIds = new Set<string>();

        // Search for competitors using different strategies
        const searchTerms = [
          appName, // Direct app name
          ...this.generateSearchTerms(appName), // Related terms
          genre, // Genre-based search
        ];

        for (const searchTerm of searchTerms) {
          for (const region of regions) {
            try {
              const searchResults = await this.appStoreAPI.searchApps(searchTerm, region);

              for (const result of searchResults) {
                if (!seenIds.has(result.trackId) && result.trackName !== appName) {
                  seenIds.add(result.trackId);

                  // Get detailed metadata for each potential competitor
                  const metadata = await this.appStoreAPI.fetchAppMetadata(result.trackId);
                  if (metadata && this.isRelevantCompetitor(metadata, appName, genre)) {
                    competitors.push({
                      trackId: metadata.trackId,
                      trackName: metadata.trackName,
                      sellerName: metadata.sellerName,
                      primaryGenreName: metadata.primaryGenreName,
                      averageUserRating: metadata.averageUserRating,
                      userRatingCount: metadata.userRatingCount,
                      version: metadata.version,
                      description: metadata.description,
                      releaseDate: metadata.releaseDate,
                      currentVersionReleaseDate: metadata.currentVersionReleaseDate,
                      price: 0, // App Store API doesn't provide price
                      currency: "USD",
                      artworkUrl100: "",
                      artworkUrl512: "",
                    });
                  }
                }
              }
            } catch (error) {
              console.warn(`Error searching for competitors with term "${searchTerm}" in region "${region}":`, error);
            }
          }
        }

        // Sort by relevance and rating count, limit to top 10
        return competitors
          .sort((a, b) => {
            // Prioritize apps with more reviews and higher ratings
            const scoreA = a.averageUserRating * Math.log(a.userRatingCount + 1);
            const scoreB = b.averageUserRating * Math.log(b.userRatingCount + 1);
            return scoreB - scoreA;
          })
          .slice(0, 10);
      },
      { appName, genre, regions: regions.length }
    );
  }

  private async analyzeCompetitorApps(competitors: CompetitorApp[], regions: string[]): Promise<CompetitorAnalysis[]> {
    return benchmark.measure(
      "analyze_competitor_apps",
      async () => {
        const analyses: CompetitorAnalysis[] = [];

        for (const competitor of competitors) {
          try {
            // Fetch reviews for the competitor
            const reviews = await this.appStoreAPI.fetchReviews(competitor.trackId, regions);

            // Analyze the reviews
            const analyzer = new ReviewAnalyzer(reviews);
            const analysis = {
              basicStats: analyzer.getBasicStats(),
              sentimentAnalysis: analyzer.getSentimentAnalysis(),
              trendData: analyzer.getTrendAnalysis(),
              versionAnalysis: analyzer.getVersionAnalysis(),
              keywordAnalysis: analyzer.getKeywordAnalysis(),
            };

            analyses.push({
              competitor,
              reviews,
              analysis,
              comparison: {
                ratingComparison: 0, // Will be calculated later
                reviewCountComparison: 0,
                sentimentComparison: 0,
                performanceComparison: 0,
                keywordOverlap: [],
                strengths: [],
                weaknesses: [],
                competitiveAdvantage: "",
              },
            });
          } catch (error) {
            console.warn(`Error analyzing competitor ${competitor.trackName}:`, error);
          }
        }

        return analyses;
      },
      { competitorsCount: competitors.length, regions: regions.length }
    );
  }

  private performMarketAnalysis(
    mainApp: any,
    competitors: CompetitorApp[]
  ): CompetitorComparisonResult["marketAnalysis"] {
    return benchmark.measureSync(
      "perform_market_analysis",
      () => {
        const allApps = [mainApp, ...competitors];

        // Calculate market averages
        const totalRating = allApps.reduce((sum, app) => sum + app.averageUserRating, 0);
        const averageMarketRating = totalRating / allApps.length;

        // Find market leader
        const marketLeader = allApps.reduce((leader, app) =>
          app.averageUserRating > leader.averageUserRating ? app : leader
        );

        // Determine market position
        const mainAppRating = mainApp.averageUserRating;
        let marketPosition: "leader" | "challenger" | "follower" | "niche";

        if (mainAppRating >= averageMarketRating + 0.5) {
          marketPosition = "leader";
        } else if (mainAppRating >= averageMarketRating) {
          marketPosition = "challenger";
        } else if (mainAppRating >= averageMarketRating - 0.5) {
          marketPosition = "follower";
        } else {
          marketPosition = "niche";
        }

        // Calculate competitive gap
        const competitiveGap = mainAppRating - averageMarketRating;

        // Estimate market share (based on rating count)
        const totalReviews = allApps.reduce((sum, app) => sum + app.userRatingCount, 0);
        const marketShare = (mainApp.userRatingCount / totalReviews) * 100;

        return {
          averageMarketRating: Math.round(averageMarketRating * 100) / 100,
          marketLeader: marketLeader === mainApp ? null : marketLeader,
          marketPosition,
          competitiveGap: Math.round(competitiveGap * 100) / 100,
          marketShare: Math.round(marketShare * 100) / 100,
        };
      },
      { competitorsCount: competitors.length }
    );
  }

  private generateInsights(
    mainApp: any,
    competitorAnalyses: CompetitorAnalysis[]
  ): CompetitorComparisonResult["insights"] {
    return benchmark.measureSync(
      "generate_insights",
      () => {
        const insights = {
          topStrengths: [] as string[],
          topWeaknesses: [] as string[],
          opportunities: [] as string[],
          threats: [] as string[],
          recommendations: [] as string[],
        };

        // Analyze strengths and weaknesses
        const mainAppRating = mainApp.averageUserRating;
        const mainAppReviews = mainApp.userRatingCount;

        competitorAnalyses.forEach(competitor => {
          const compRating = competitor.competitor.averageUserRating;
          const compReviews = competitor.competitor.userRatingCount;

          // Strengths
          if (mainAppRating > compRating) {
            insights.topStrengths.push(`Higher rating than ${competitor.competitor.trackName}`);
          }
          if (mainAppReviews > compReviews) {
            insights.topStrengths.push(`More user reviews than ${competitor.competitor.trackName}`);
          }

          // Weaknesses
          if (compRating > mainAppRating) {
            insights.topWeaknesses.push(`Lower rating than ${competitor.competitor.trackName}`);
          }
          if (compReviews > mainAppReviews) {
            insights.topWeaknesses.push(`Fewer reviews than ${competitor.competitor.trackName}`);
          }
        });

        // Generate opportunities and threats
        const lowRatedCompetitors = competitorAnalyses.filter(c => c.competitor.averageUserRating < mainAppRating);
        const highRatedCompetitors = competitorAnalyses.filter(c => c.competitor.averageUserRating > mainAppRating);

        if (lowRatedCompetitors.length > 0) {
          insights.opportunities.push(
            `Market opportunity: ${lowRatedCompetitors.length} competitors have lower ratings`
          );
        }

        if (highRatedCompetitors.length > 0) {
          insights.threats.push(`Competitive threat: ${highRatedCompetitors.length} competitors have higher ratings`);
        }

        // Generate recommendations
        if (insights.topWeaknesses.length > 0) {
          insights.recommendations.push("Focus on improving user experience to match top competitors");
        }
        if (mainAppReviews < 1000) {
          insights.recommendations.push("Increase user engagement to generate more reviews");
        }
        if (insights.topStrengths.length > 0) {
          insights.recommendations.push("Leverage competitive advantages in marketing materials");
        }

        return insights;
      },
      { competitorsCount: competitorAnalyses.length }
    );
  }

  private generateSearchTerms(appName: string): string[] {
    // Generate related search terms based on app name
    const terms = [];

    // Remove common words and generate variations
    const words = appName.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => !["app", "the", "and", "or", "for", "with", "by"].includes(word));

    if (filteredWords.length > 0) {
      terms.push(filteredWords[0]); // First word
      if (filteredWords.length > 1) {
        terms.push(filteredWords.slice(0, 2).join(" ")); // First two words
      }
    }

    return terms;
  }

  private isRelevantCompetitor(metadata: any, mainAppName: string, mainGenre: string): boolean {
    // Filter out irrelevant apps
    if (metadata.trackName.toLowerCase() === mainAppName.toLowerCase()) {
      return false; // Same app
    }

    if (metadata.userRatingCount < 10) {
      return false; // Too few reviews
    }

    if (metadata.averageUserRating < 2.0) {
      return false; // Very low rating
    }

    // Check if it's in the same genre or has similar keywords
    const isSameGenre = metadata.primaryGenreName.toLowerCase() === mainGenre.toLowerCase();
    const hasSimilarKeywords = this.hasSimilarKeywords(metadata.description, mainAppName);

    return isSameGenre || hasSimilarKeywords;
  }

  private hasSimilarKeywords(description: string, appName: string): boolean {
    const desc = description.toLowerCase();
    const name = appName.toLowerCase();

    // Check for keyword overlap
    const nameWords = name.split(/\s+/).filter(word => word.length > 2);
    const matchingWords = nameWords.filter(word => desc.includes(word));

    return matchingWords.length >= Math.ceil(nameWords.length * 0.3); // 30% overlap
  }
}

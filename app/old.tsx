"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  Search,
  TrendingUp,
  Star,
  Globe,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Filter,
  Brain,
  Clock,
  Zap,
  Hash,
} from "lucide-react";
import {
  fetchAppStoreData,
  analyzeReviews,
  analyzeCompetitors,
  type FetchDataResult,
  type AnalysisResult,
  printBenchmarkSummary,
  clearAnalysisCache,
  getCacheInfo,
} from "@/app/actions";
import { type AppStoreReview, type AppMetadata, APP_STORE_REGIONS } from "@/lib/app-store-api";

interface ActionableTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "bug" | "performance" | "ui" | "feature" | "general";
  version: string;
  affectedUsers: number;
  estimatedImpact: string;
  reviews: AppStoreReview[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function AppStoreAnalyzer() {
  const [appId, setAppId] = useState("6670324846"); // Default to Grok
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["us", "gb", "ca"]);
  const [reviews, setReviews] = useState<AppStoreReview[]>([]);
  const [appMetadata, setAppMetadata] = useState<AppMetadata | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [selectedPerformanceCategory, setSelectedPerformanceCategory] = useState<string | null>(null);
  const [filteredReviews, setFilteredReviews] = useState<AppStoreReview[]>([]);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);
  const [regionProgress, setRegionProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("");

  const handleAnalyze = () => {
    if (!appId.trim()) return;

    setError(null);
    setProgress(0);
    setRegionProgress(null);

    startTransition(async () => {
      try {
        // Handle "all" regions option
        const regionsToFetch = selectedRegions.includes("all") ? APP_STORE_REGIONS : selectedRegions;

        // Set region progress for "all" regions
        if (selectedRegions.includes("all")) {
          setRegionProgress({ current: 0, total: regionsToFetch.length });
        }

        // Use streaming API for real progress updates
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appId,
            regions: regionsToFetch,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start analysis");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "complete") {
                  // Analysis complete
                  setProgress(100);
                  setReviews(data.reviews);
                  setAppMetadata(data.metadata);

                  // Analyze the reviews using streaming API
                  if (data.reviews.length > 0) {
                    console.log("📊 Starting review analysis...");
                    console.log("Reviews received:", data.reviews.length);
                    console.log("Sample review:", data.reviews[0]);

                    try {
                      // Use streaming analysis API to avoid body size limits
                      const analysisResponse = await fetch("/api/analyze", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          reviews: data.reviews,
                          metadata: data.metadata,
                        }),
                      });

                      if (!analysisResponse.ok) {
                        throw new Error("Failed to start analysis");
                      }

                      const analysisReader = analysisResponse.body?.getReader();
                      if (!analysisReader) {
                        throw new Error("No analysis response body");
                      }

                      const analysisDecoder = new TextDecoder();
                      let analysisBuffer = "";

                      while (true) {
                        const { done, value } = await analysisReader.read();

                        if (done) break;

                        analysisBuffer += analysisDecoder.decode(value, { stream: true });
                        const analysisLines = analysisBuffer.split("\n");
                        analysisBuffer = analysisLines.pop() || "";

                        for (const line of analysisLines) {
                          if (line.startsWith("data: ")) {
                            try {
                              const analysisData = JSON.parse(line.slice(6));

                              if (analysisData.type === "complete") {
                                console.log("Analysis result received:", analysisData.analysis);
                                console.log("Analysis keys:", Object.keys(analysisData.analysis || {}));
                                console.log("Keyword analysis length:", analysisData.analysis?.keywordAnalysis?.length);
                                console.log(
                                  "Top reviews positive length:",
                                  analysisData.analysis?.topReviews?.positive?.length
                                );
                                console.log(
                                  "Top reviews negative length:",
                                  analysisData.analysis?.topReviews?.negative?.length
                                );
                                setAnalysisResult(analysisData.analysis);
                                break;
                              } else if (analysisData.type === "error") {
                                throw new Error(analysisData.error);
                              } else {
                                // Update analysis progress
                                setProgress(analysisData.percentage || 0);
                                setCurrentStage(analysisData.stage || "");
                              }
                            } catch (parseError) {
                              console.error("Error parsing analysis data:", parseError);
                            }
                          }
                        }
                      }
                    } catch (analysisError) {
                      console.error("Analysis failed:", analysisError);
                      setError("Analysis failed: " + (analysisError as Error).message);
                    }
                  } else {
                    console.warn("No reviews received for analysis");
                  }

                  // Print benchmark summary to console
                  printBenchmarkSummary();
                  break;
                } else if (data.type === "error") {
                  setError(data.error);
                  break;
                } else {
                  // Update progress
                  setProgress(data.percentage || 0);
                  setRegionProgress({
                    current: data.current || 0,
                    total: data.total || regionsToFetch.length,
                  });
                  setCurrentStage(data.stage || "");
                }
              } catch (parseError) {
                console.error("Error parsing progress data:", parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setProgress(0);
        setRegionProgress(null);
        setCurrentStage("");
      }
    });
  };

  const exportData = () => {
    if (!reviews.length) return;

    const csvContent = [
      "ID,Region,Title,Content,Rating,Version,Date,Author",
      ...reviews.map(
        review =>
          `"${review.id}","${review.region}","${review.title.replace(/"/g, '""')}","${review.content.replace(
            /"/g,
            '""'
          )}",${review.rating},"${review.version}","${review.date}","${review.author}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-store-reviews-${appId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePerformanceCategoryClick = (category: string) => {
    if (!analysisResult?.filteredAnalysis?.categoryBreakdown) return;

    // Mapuj kategorie do słów kluczowych
    const categoryKeywords: Record<string, string[]> = {
      crashes: ["crash", "error", "freeze", "stop", "broken", "not working", "fail"],
      performance: ["slow", "lag", "performance", "speed", "loading", "delay"],
      bugs: ["bug", "issue", "problem", "glitch", "broken", "fix"],
      features: ["feature", "add", "missing", "need", "want", "request"],
      ui: ["ui", "ux", "interface", "design", "layout", "button", "screen"],
    };

    const keywords = categoryKeywords[category] || [];
    const filtered = reviews.filter(review => {
      const content = (review.content + " " + review.title).toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });

    setFilteredReviews(filtered);
    setSelectedPerformanceCategory(category);
  };

  const closeFilteredReviews = () => {
    setSelectedPerformanceCategory(null);
    setFilteredReviews([]);
  };

  const formatRating = (rating: number, showDetails: boolean = false): string => {
    if (showDetails) {
      return rating.toFixed(2);
    }
    return rating.toFixed(1);
  };

  // Helper function to get most relevant reviews for a specific problem
  const getMostRelevantReviews = (
    reviews: AppStoreReview[],
    keywords: string[],
    maxCount: number = 3
  ): AppStoreReview[] => {
    return reviews
      .map(review => {
        const content = (review.content + " " + review.title).toLowerCase();
        const relevanceScore = keywords.reduce((score, keyword) => {
          if (content.includes(keyword)) {
            // Higher score for exact matches and multiple occurrences
            const occurrences = (content.match(new RegExp(keyword, "g")) || []).length;
            return score + occurrences * 2;
          }
          return score;
        }, 0);

        // Bonus for low ratings (more urgent issues)
        const ratingBonus = review.rating <= 2 ? 3 : review.rating <= 3 ? 1 : 0;

        return { review, relevanceScore: relevanceScore + ratingBonus };
      })
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxCount)
      .map(item => item.review);
  };

  const generateActionableFeedback = () => {
    if (!analysisResult || !reviews.length) return [];

    const tasks: ActionableTask[] = [];
    const usedReviewIds = new Set<string>(); // Track used review IDs to avoid duplicates

    // Analiza crashów i błędów
    const crashKeywords = ["crash", "error", "freeze", "stop", "broken", "not working", "fail"];
    const crashReviews = reviews.filter(review => {
      const content = (review.content + " " + review.title).toLowerCase();
      return crashKeywords.some(keyword => content.includes(keyword));
    });

    if (crashReviews.length > 0) {
      const relevantCrashReviews = getMostRelevantReviews(crashReviews, crashKeywords, 3)
        .filter(review => !usedReviewIds.has(review.id))
        .slice(0, 3);

      // Mark these reviews as used
      relevantCrashReviews.forEach(review => usedReviewIds.add(review.id));

      tasks.push({
        id: "crashes",
        title: "Fix App Crashes",
        description: `${crashReviews.length} users reported crashes and errors. Investigate and fix stability issues.`,
        priority: "high",
        category: "bug",
        version: "all",
        affectedUsers: crashReviews.length,
        estimatedImpact: "Critical - affects user experience",
        reviews: relevantCrashReviews,
      });
    }

    // Analiza problemów z wydajnością
    const performanceKeywords = ["slow", "lag", "performance", "speed", "loading", "delay"];
    const performanceReviews = reviews.filter(review => {
      const content = (review.content + " " + review.title).toLowerCase();
      return performanceKeywords.some(keyword => content.includes(keyword));
    });

    if (performanceReviews.length > 0) {
      const relevantPerformanceReviews = getMostRelevantReviews(performanceReviews, performanceKeywords, 3)
        .filter(review => !usedReviewIds.has(review.id))
        .slice(0, 3);

      // Mark these reviews as used
      relevantPerformanceReviews.forEach(review => usedReviewIds.add(review.id));

      tasks.push({
        id: "performance",
        title: "Improve App Performance",
        description: `${performanceReviews.length} users reported performance issues. Optimize app speed and responsiveness.`,
        priority: "high",
        category: "performance",
        version: "all",
        affectedUsers: performanceReviews.length,
        estimatedImpact: "High - affects user satisfaction",
        reviews: relevantPerformanceReviews,
      });
    }

    // Analiza problemów z UI/UX
    const uiKeywords = ["ui", "ux", "interface", "design", "layout", "button", "screen"];
    const uiReviews = reviews.filter(review => {
      const content = (review.content + " " + review.title).toLowerCase();
      return uiKeywords.some(keyword => content.includes(keyword));
    });

    if (uiReviews.length > 0) {
      const relevantUiReviews = getMostRelevantReviews(uiReviews, uiKeywords, 3)
        .filter(review => !usedReviewIds.has(review.id))
        .slice(0, 3);

      // Mark these reviews as used
      relevantUiReviews.forEach(review => usedReviewIds.add(review.id));

      tasks.push({
        id: "ui",
        title: "Enhance User Interface",
        description: `${uiReviews.length} users reported UI/UX issues. Improve design and user experience.`,
        priority: "medium",
        category: "ui",
        version: "all",
        affectedUsers: uiReviews.length,
        estimatedImpact: "Medium - affects usability",
        reviews: relevantUiReviews,
      });
    }

    // Analiza feature requests
    const featureKeywords = ["feature", "add", "missing", "need", "want", "request"];
    const featureReviews = reviews.filter(review => {
      const content = (review.content + " " + review.title).toLowerCase();
      return featureKeywords.some(keyword => content.includes(keyword));
    });

    if (featureReviews.length > 0) {
      const relevantFeatureReviews = getMostRelevantReviews(featureReviews, featureKeywords, 3)
        .filter(review => !usedReviewIds.has(review.id))
        .slice(0, 3);

      // Mark these reviews as used
      relevantFeatureReviews.forEach(review => usedReviewIds.add(review.id));

      tasks.push({
        id: "features",
        title: "Add Requested Features",
        description: `${featureReviews.length} users requested new features. Consider implementing most requested features.`,
        priority: "medium",
        category: "feature",
        version: "future",
        affectedUsers: featureReviews.length,
        estimatedImpact: "Medium - improves user satisfaction",
        reviews: relevantFeatureReviews,
      });
    }

    // Analiza ratingów
    const lowRatingReviews = reviews.filter(review => review.rating <= 2);
    if (lowRatingReviews.length > 0) {
      // For low ratings, sort by most recent and most detailed reviews
      const mostRelevantLowRatings = lowRatingReviews
        .map(review => ({
          review,
          relevanceScore: review.content.length + review.title.length * 2, // Longer content = more detailed feedback
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .filter(item => !usedReviewIds.has(item.review.id))
        .slice(0, 3)
        .map(item => item.review);

      // Mark these reviews as used
      mostRelevantLowRatings.forEach(review => usedReviewIds.add(review.id));

      tasks.push({
        id: "ratings",
        title: "Address Low Ratings",
        description: `${lowRatingReviews.length} users gave low ratings (1-2 stars). Investigate and address their concerns.`,
        priority: "high",
        category: "general",
        version: "all",
        affectedUsers: lowRatingReviews.length,
        estimatedImpact: "Critical - affects app store ranking",
        reviews: mostRelevantLowRatings,
      });
    }

    // Analiza wersji
    const versionGroups = reviews.reduce((acc, review) => {
      const version = review.version;
      if (!acc[version]) acc[version] = [];
      acc[version].push(review);
      return acc;
    }, {} as Record<string, AppStoreReview[]>);

    Object.entries(versionGroups).forEach(([version, versionReviews]) => {
      const avgRating = versionReviews.reduce((sum, r) => sum + r.rating, 0) / versionReviews.length;
      if (avgRating < 3.5 && versionReviews.length >= 3) {
        // For version issues, prioritize low ratings and recent reviews
        const mostRelevantVersionReviews = versionReviews
          .map(review => ({
            review,
            relevanceScore:
              (5 - review.rating) * 2 + // Lower rating = higher priority
              new Date(review.date).getTime() / (1000 * 60 * 60 * 24), // More recent = higher priority
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .filter(item => !usedReviewIds.has(item.review.id))
          .slice(0, 3)
          .map(item => item.review);

        // Mark these reviews as used
        mostRelevantVersionReviews.forEach(review => usedReviewIds.add(review.id));

        tasks.push({
          id: `version-${version}`,
          title: `Fix Issues in Version ${version}`,
          description: `Version ${version} has average rating of ${formatRating(
            avgRating,
            showDetailedRatings
          )} stars. Investigate version-specific issues.`,
          priority: "high",
          category: "bug",
          version: version,
          affectedUsers: versionReviews.length,
          estimatedImpact: "High - version-specific problems",
          reviews: mostRelevantVersionReviews,
        });
      }
    });

    return tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        priorityOrder[b.priority as keyof typeof priorityOrder] -
        priorityOrder[a.priority as keyof typeof priorityOrder]
      );
    });
  };

  const handleCompetitorAnalysis = () => {
    if (!appId.trim() || !appMetadata) return;

    setError(null);
    setProgress(0);

    startTransition(async () => {
      try {
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90));
        }, 1000);

        // Handle "all" regions option for competitor analysis
        const regionsForCompetitors = selectedRegions.includes("all") ? APP_STORE_REGIONS : selectedRegions;

        const result = await analyzeCompetitors(
          appId,
          appMetadata.trackName,
          appMetadata.primaryGenreName,
          regionsForCompetitors
        );

        clearInterval(progressInterval);
        setProgress(100);

        setCompetitorAnalysis(result);
        printBenchmarkSummary();
      } catch (error) {
        console.error("Competitor analysis error:", error);
        setError("Failed to analyze competitors. Please try again.");
      }
    });
  };

  const sentimentChartData = analysisResult?.sentimentAnalysis
    ? [
        { name: "Positive", value: analysisResult.sentimentAnalysis.positive, color: "#10B981" },
        { name: "Neutral", value: analysisResult.sentimentAnalysis.neutral, color: "#F59E0B" },
        { name: "Negative", value: analysisResult.sentimentAnalysis.negative, color: "#EF4444" },
      ]
    : [];

  const categoryChartData = analysisResult?.filteredAnalysis?.categoryBreakdown
    ? Object.entries(analysisResult.filteredAnalysis.categoryBreakdown).map(([category, count]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count,
        color: COLORS[Object.keys(analysisResult.filteredAnalysis.categoryBreakdown).indexOf(category) % COLORS.length],
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">App Store Review Analyzer</h1>
          <p className="text-gray-600">Analyze user reviews and gain insights from the Apple App Store</p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>App Configuration</CardTitle>
            <CardDescription>Enter the App Store ID and select regions to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appId">App Store ID</Label>
                <Input
                  id="appId"
                  value={appId}
                  onChange={e => setAppId(e.target.value)}
                  placeholder="e.g., 6670324846 (Grok)"
                />
              </div>
              <div>
                <Label>Regions</Label>
                <Select value={selectedRegions.join(",")} onValueChange={value => setSelectedRegions(value.split(","))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 All Regions (175 countries)</SelectItem>
                    <SelectItem value="us,gb,ca">🇺🇸🇬🇧🇨🇦 US, UK, Canada</SelectItem>
                    <SelectItem value="us,gb,ca,au,de,fr">🌍 Major Markets</SelectItem>
                    <SelectItem value="us,gb,ca,au,de,fr,jp,cn,kr">🌏 Top Markets</SelectItem>
                    <SelectItem value="us">🇺🇸 US Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedRegions.includes("all") && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">All Regions Selected</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This will fetch reviews from all 175 App Store regions. This may take several minutes and make many
                  API calls.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={isPending || !appId.trim()} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {isPending ? "Analyzing..." : "Analyze Reviews"}
              </Button>

              {reviews.length > 0 && (
                <Button variant="outline" onClick={exportData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}

              {appMetadata && (
                <Button
                  variant="outline"
                  onClick={handleCompetitorAnalysis}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  {isPending ? "Analyzing Competitors..." : "Analyze Competitors"}
                </Button>
              )}

              {analysisResult && (
                <Button
                  variant="outline"
                  onClick={() => setShowBenchmarks(!showBenchmarks)}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {showBenchmarks ? "Hide" : "Show"} Performance
                </Button>
              )}

              <Button
                variant="outline"
                onClick={async () => {
                  await clearAnalysisCache();
                  alert("Cache cleared!");
                }}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Clear Cache
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {currentStage ||
                      (regionProgress
                        ? `Fetching reviews from ${regionProgress.current}/${regionProgress.total} regions...`
                        : "Fetching reviews...")}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                {regionProgress && (
                  <div className="mt-2 text-xs text-gray-500">
                    Processing region {regionProgress.current} of {regionProgress.total} (
                    {Math.round((regionProgress.current / regionProgress.total) * 100)}%)
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Benchmarks */}
        {showBenchmarks && analysisResult && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Benchmarks
              </CardTitle>
              <CardDescription>Detailed timing information for each operation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                <p>📊 Check the browser console for detailed benchmark results</p>
                <p>💡 Performance data shows how long each operation takes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
                  <div className="text-sm text-gray-600">Reviews Processed</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysisResult.filteredAnalysis?.informativeReviews || 0}
                  </div>
                  <div className="text-sm text-gray-600">Informative Reviews</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedRegions.includes("all") ? APP_STORE_REGIONS.length : selectedRegions.length}
                  </div>
                  <div className="text-sm text-gray-600">Regions Analyzed</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Performance Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• LLM filtering is the most time-consuming operation</li>
                  <li>• API calls to App Store have built-in rate limiting</li>
                  <li>• Analysis operations are optimized for speed</li>
                  <li>• Consider using fewer regions for faster results</li>
                  {selectedRegions.includes("all") && (
                    <li>
                      • <strong>All Regions:</strong> This will take 5-10 minutes and make ~175 API calls
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* App Info */}
        {appMetadata && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {appMetadata.trackName}
              </CardTitle>
              <CardDescription>
                {appMetadata.sellerName} • {appMetadata.primaryGenreName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                    onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                    title="Click to toggle detailed rating"
                  >
                    {formatRating(appMetadata.averageUserRating, showDetailedRatings)}★
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                  <div className="text-xs text-gray-400 mt-1">Click to toggle details</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {appMetadata.userRatingCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Ratings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{appMetadata.version}</div>
                  <div className="text-sm text-gray-600">Current Version</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{reviews.length}</div>
                  <div className="text-sm text-gray-600">Reviews Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Section */}
        {analysisResult && false && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div>
                  <strong>Basic Stats:</strong> {JSON.stringify(analysisResult?.basicStats, null, 2)}
                </div>
                <div>
                  <strong>Sentiment Analysis:</strong> {JSON.stringify(analysisResult?.sentimentAnalysis, null, 2)}
                </div>
                <div>
                  <strong>Filtered Analysis:</strong> {JSON.stringify(analysisResult?.filteredAnalysis, null, 2)}
                </div>
                <div>
                  <strong>Keyword Analysis:</strong> {JSON.stringify(analysisResult?.keywordAnalysis, null, 2)}
                </div>
                <div>
                  <strong>Top Reviews:</strong> {JSON.stringify(analysisResult?.topReviews, null, 2)}
                </div>
                <div>
                  <strong>Reviews Count:</strong> {reviews.length}
                </div>
                <div>
                  <strong>App Metadata:</strong> {appMetadata ? "Available" : "Missing"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-13">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="filtering">Filtering</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="regions">Regions</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              {/* <TabsTrigger value="reviews">Reviews</TabsTrigger> */}
              <TabsTrigger value="actionable">Actionable</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sentiment Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sentimentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Rating Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            const ratingData = analysisResult.basicStats?.ratingDistribution;

                            if (ratingData) {
                              return Object.entries(ratingData)
                                .filter(([rating, count]) => (count as number) > 0) // Only show ratings with reviews
                                .map(([rating, count]) => ({
                                  rating: `${rating}★`,
                                  count: count as number,
                                }))
                                .sort((a, b) => parseInt(a.rating) - parseInt(b.rating)); // Sort by rating
                            }
                            return [];
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip formatter={value => [`${value} reviews`, "Count"]} />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {(() => {
                      const ratingData = analysisResult.basicStats?.ratingDistribution;
                      return !ratingData || Object.values(ratingData).every(count => (count as number) === 0);
                    })() && <div className="text-center text-gray-500 mt-4">No rating distribution data available</div>}
                  </CardContent>
                </Card>
              </div>

              {/* Keyword Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  <CardDescription>Most mentioned keywords in reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.keywordAnalysis && analysisResult.keywordAnalysis.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {analysisResult.keywordAnalysis.slice(0, 8).map((keyword: any) => (
                        <div key={keyword.keyword} className="text-center p-4 border rounded-lg">
                          <div className="text-lg font-semibold">{keyword.keyword}</div>
                          <div className="text-sm text-gray-600">{keyword.count} mentions</div>
                          <div
                            className={`text-sm ${
                              keyword.sentiment === "positive"
                                ? "text-green-600"
                                : keyword.sentiment === "negative"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {keyword.averageRating?.toFixed(1) || "0.0"}★ avg
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-lg font-semibold mb-2">No Keywords Found</div>
                      <div className="text-sm">No keywords were extracted from the reviews.</div>
                      <div className="text-xs mt-2 text-gray-400">
                        Debug: keywordAnalysis = {JSON.stringify(analysisResult.keywordAnalysis)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="filtering" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtering Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Review Filtering
                    </CardTitle>
                    <CardDescription>LLM-powered filtering of non-informative reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {analysisResult.filteredAnalysis?.informativeReviews || 0}
                          </div>
                          <div className="text-sm text-gray-600">Informative</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {analysisResult.filteredAnalysis?.nonInformativeReviews || 0}
                          </div>
                          <div className="text-sm text-gray-600">Non-Informative</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {analysisResult.filteredAnalysis?.informativePercentage || 0}% Informative
                        </div>
                        <div className="text-sm text-gray-600">
                          of {analysisResult.filteredAnalysis?.totalReviews || 0} total reviews
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Review Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtering Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtering Insights</CardTitle>
                  <CardDescription>What the AI identified as informative vs non-informative</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Informative Reviews Include:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Specific bug reports with details</li>
                        <li>• Feature requests and suggestions</li>
                        <li>• Performance issues (slow, crashes)</li>
                        <li>• UI/UX feedback with context</li>
                        <li>• Detailed user experience feedback</li>
                        <li>• Technical problems with specifics</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Non-Informative Reviews Include:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Generic praise ("love it", "great app")</li>
                        <li>• Generic complaints ("hate it", "terrible")</li>
                        <li>• Spam or irrelevant content</li>
                        <li>• Very short responses</li>
                        <li>• Emotional reactions without details</li>
                        <li>• No actionable feedback</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Rating Trends Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysisResult.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="averageRating" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version Performance</CardTitle>
                  <CardDescription>Average ratings by app version</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisResult.versionAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="version" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Bar dataKey="averageRating" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Regional Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysisResult.regionalAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="region" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Bar dataKey="averageRating" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Keyword Analysis
                  </CardTitle>
                  <CardDescription>Most mentioned keywords and their sentiment analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.keywordAnalysis && analysisResult.keywordAnalysis.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {analysisResult.keywordAnalysis.map((keyword: any) => (
                        <div key={keyword.keyword} className="text-center p-4 border rounded-lg">
                          <div className="text-lg font-semibold">{keyword.keyword}</div>
                          <div className="text-sm text-gray-600">{keyword.count} mentions</div>
                          <div
                            className={`text-sm ${
                              keyword.sentiment === "positive"
                                ? "text-green-600"
                                : keyword.sentiment === "negative"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {keyword.averageRating?.toFixed(1) || "0.0"}★ avg
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-lg font-semibold mb-2">No Keywords Found</div>
                      <div className="text-sm">No keywords were extracted from the reviews.</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Top Positive Reviews
                    </CardTitle>
                    <CardDescription>Best-rated reviews from users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResult.topReviews?.positive && analysisResult.topReviews.positive.length > 0 ? (
                        analysisResult.topReviews.positive.map((review: AppStoreReview, index: number) => (
                          <div key={`${review.id}-${review.region}-${index}`} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                              <span className="text-sm text-gray-500">{review.region.toUpperCase()}</span>
                              <span className="text-xs text-gray-400">v{review.version}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="font-medium text-sm mb-1">{review.title}</div>
                            <div className="text-sm text-gray-600 mb-2">{review.content}</div>
                            <div className="text-xs text-gray-500">
                              By: {review.author} • {new Date(review.date).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <div className="text-sm">No positive reviews found</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Top Negative Reviews
                    </CardTitle>
                    <CardDescription>Lowest-rated reviews from users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResult.topReviews?.negative && analysisResult.topReviews.negative.length > 0 ? (
                        analysisResult.topReviews.negative.map((review: AppStoreReview, index: number) => (
                          <div key={`${review.id}-${review.region}-${index}`} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                              <span className="text-sm text-gray-500">{review.region.toUpperCase()}</span>
                              <span className="text-xs text-gray-400">v{review.version}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="font-medium text-sm mb-1">{review.title}</div>
                            <div className="text-sm text-gray-600 mb-2">{review.content}</div>
                            <div className="text-xs text-gray-500">
                              By: {review.author} • {new Date(review.date).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <div className="text-sm">No negative reviews found</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actionable" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Actionable Feedback
                  </CardTitle>
                  <CardDescription>Prioritized tasks to improve your app based on user feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const tasks = generateActionableFeedback();
                    return tasks.length > 0 ? (
                      <div className="space-y-4">
                        {tasks.map(task => (
                          <div key={task.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{task.title}</h3>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      task.priority === "high"
                                        ? "bg-red-100 text-red-800"
                                        : task.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {task.priority.toUpperCase()}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      task.category === "bug"
                                        ? "bg-red-100 text-red-800"
                                        : task.category === "performance"
                                        ? "bg-orange-100 text-orange-800"
                                        : task.category === "ui"
                                        ? "bg-purple-100 text-purple-800"
                                        : task.category === "feature"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {task.category.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-2">{task.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Version: {task.version}</span>
                                  <span>Affected Users: {task.affectedUsers}</span>
                                  <span>Impact: {task.estimatedImpact}</span>
                                </div>
                              </div>
                            </div>

                            {/* Sample Reviews */}
                            {task.reviews.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium text-sm text-gray-700 mb-2">Sample Reviews:</h4>
                                <div className="space-y-2">
                                  {task.reviews.map((review, index) => (
                                    <div
                                      key={`${review.id}-${review.region}-${index}`}
                                      className="p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                                        <span className="text-xs text-gray-500">{review.region.toUpperCase()}</span>
                                        <span className="text-xs text-gray-400">v{review.version}</span>
                                        <span className="text-xs text-gray-400">
                                          {new Date(review.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="font-medium text-sm mb-1">{review.title}</div>
                                      <div className="text-sm text-gray-600 mb-2">{review.content}</div>
                                      <div className="text-xs text-gray-500">
                                        By: {review.author} • {new Date(review.date).toLocaleString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-lg font-semibold mb-2">No Actionable Tasks Found</div>
                        <div className="text-sm">
                          No specific improvement tasks identified from the current reviews.
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              {competitorAnalysis ? (
                <>
                  {/* Market Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Market Analysis
                      </CardTitle>
                      <CardDescription>Your app's position in the competitive landscape</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {competitorAnalysis.marketAnalysis?.averageMarketRating || 0}
                          </div>
                          <div className="text-sm text-gray-600">Market Average Rating</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {competitorAnalysis.marketAnalysis?.marketPosition || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-600">Market Position</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {competitorAnalysis.marketAnalysis?.competitiveGap || 0}
                          </div>
                          <div className="text-sm text-gray-600">Competitive Gap</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {competitorAnalysis.marketAnalysis?.marketShare || 0}%
                          </div>
                          <div className="text-sm text-gray-600">Market Share</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Competitor List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Competitor Analysis</CardTitle>
                      <CardDescription>Detailed comparison with top competitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {competitorAnalysis.competitors?.map((competitor: any, index: number) => (
                          <div key={competitor.competitor.trackId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{competitor.competitor.trackName}</h3>
                                <p className="text-sm text-gray-600">{competitor.competitor.sellerName}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-yellow-500">
                                  {formatRating(competitor.competitor.averageUserRating, showDetailedRatings)}★
                                </div>
                                <div className="text-sm text-gray-600">
                                  {competitor.competitor.userRatingCount} reviews
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Genre:</span> {competitor.competitor.primaryGenreName}
                              </div>
                              <div>
                                <span className="font-medium">Version:</span> {competitor.competitor.version}
                              </div>
                              <div>
                                <span className="font-medium">Rating vs Yours:</span>
                                <span
                                  className={
                                    competitor.competitor.averageUserRating >
                                    (analysisResult?.basicStats?.averageRating || 0)
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {competitor.competitor.averageUserRating >
                                  (analysisResult?.basicStats?.averageRating || 0)
                                    ? "Higher"
                                    : "Lower"}{" "}
                                  ({formatRating(competitor.competitor.averageUserRating, showDetailedRatings)} vs{" "}
                                  {formatRating(analysisResult?.basicStats?.averageRating || 0, showDetailedRatings)})
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Reviews vs Yours:</span>
                                <span
                                  className={
                                    competitor.competitor.userRatingCount >
                                    (analysisResult?.basicStats?.totalReviews || 0)
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {competitor.competitor.userRatingCount >
                                  (analysisResult?.basicStats?.totalReviews || 0)
                                    ? "More"
                                    : "Fewer"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategic Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Strategic Insights</CardTitle>
                      <CardDescription>Actionable recommendations based on competitive analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-600 mb-3">Strengths</h4>
                          <ul className="space-y-2">
                            {competitorAnalysis.insights?.topStrengths
                              ?.slice(0, 5)
                              .map((strength: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{strength}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-600 mb-3">Areas for Improvement</h4>
                          <ul className="space-y-2">
                            {competitorAnalysis.insights?.topWeaknesses
                              ?.slice(0, 5)
                              .map((weakness: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{weakness}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h4 className="font-semibold text-blue-600 mb-3">Recommendations</h4>
                        <ul className="space-y-2">
                          {competitorAnalysis.insights?.recommendations
                            ?.slice(0, 5)
                            .map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{rec}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Competitor Analysis Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Click "Analyze Competitors" to discover and compare with similar apps in the App Store.
                    </p>
                    <Button onClick={handleCompetitorAnalysis} disabled={isPending || !appMetadata}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyze Competitors
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Sample Reviews */}
        {analysisResult?.topReviews && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Sample Reviews</CardTitle>
              <CardDescription>Recent positive and negative reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Top Positive Reviews
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.topReviews.positive && analysisResult.topReviews.positive.length > 0 ? (
                      analysisResult.topReviews.positive.map((review: AppStoreReview, index: number) => (
                        <div key={`${review.id}-${review.region}-${index}`} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                            <span className="text-sm text-gray-500">{review.region.toUpperCase()}</span>
                            <span className="text-xs text-gray-400">v{review.version}</span>
                            <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                          </div>
                          <div className="font-medium text-sm mb-1">{review.title}</div>
                          <div className="text-sm text-gray-600 mb-2">{review.content}</div>
                          <div className="text-xs text-gray-500">
                            By: {review.author} • {new Date(review.date).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <div className="text-sm">No positive reviews found</div>
                        <div className="text-xs mt-1 text-gray-400">
                          Debug: positive reviews = {JSON.stringify(analysisResult.topReviews.positive)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Top Negative Reviews
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.topReviews.negative && analysisResult.topReviews.negative.length > 0 ? (
                      analysisResult.topReviews.negative.map((review: AppStoreReview, index: number) => (
                        <div key={`${review.id}-${review.region}-${index}`} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                            <span className="text-sm text-gray-500">{review.region.toUpperCase()}</span>
                            <span className="text-xs text-gray-400">v{review.version}</span>
                            <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                          </div>
                          <div className="font-medium text-sm mb-1">{review.title}</div>
                          <div className="text-sm text-gray-600 mb-2">{review.content}</div>
                          <div className="text-xs text-gray-500">
                            By: {review.author} • {new Date(review.date).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <div className="text-sm">No negative reviews found</div>
                        <div className="text-xs mt-1 text-gray-400">
                          Debug: negative reviews = {JSON.stringify(analysisResult.topReviews.negative)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Bug,
  Zap,
  Monitor,
  Users,
  Settings,
  ArrowLeft,
  Clock,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Brain,
} from "lucide-react";
import { AnalysisResult, AppStoreReview, AppMetadata } from "@/app/types";
import { filterReviewsByVersion } from "@/lib/utils";
import { VersionSlider } from "@/components/ui/version-slider";

interface IssueCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  reviews: AppStoreReview[];
  count: number;
  severity: "critical" | "high" | "medium" | "low";
}

interface IssuesViewProps {
  analysisResult: AnalysisResult;
  reviews: AppStoreReview[];
  appMetadata?: AppMetadata | null;
}

export function IssuesView({ analysisResult, reviews, appMetadata }: IssuesViewProps) {
  const [issueCategories, setIssueCategories] = useState<IssueCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);

  // Version filter state
  const [minVersion, setMinVersion] = useState<string>("0.0");

  // LLM categorization state
  const [isCategorizingWithLLM, setIsCategorizingWithLLM] = useState<boolean>(false);
  const [categorizationProgress, setCategorizationProgress] = useState<{
    stage: string;
    percentage: number;
    totalReviews?: number;
    categorizedReviews?: number;
    errors?: number;
  }>({ stage: "", percentage: 0 });
  const [categorizationMethod, setCategorizationMethod] = useState<"keyword" | "llm" | "keyword_fallback">("keyword");

  // Generate issues from stored analysis results
  useEffect(() => {
    if (analysisResult && reviews.length > 0) {
      generateIssueAnalysis();
    }
  }, [analysisResult, reviews, minVersion]);

  // Define category definitions
  const getCategoryDefinitions = () => [
    {
      id: "crashes_errors",
      name: "Crashes and Errors",
      description: "App crashes, freezes, fatal errors, and application not responding",
      icon: AlertTriangle,
      color: "text-red-400",
      severity: "critical" as const,
    },
    {
      id: "feature_requests",
      name: "Feature Requests",
      description: "Missing functionality, new feature requests, and enhancement suggestions",
      icon: Settings,
      color: "text-blue-400",
      severity: "medium" as const,
    },
    {
      id: "performance",
      name: "Performance Issues",
      description: "Slow loading, lag, speed issues, memory problems, and battery drain",
      icon: Zap,
      color: "text-orange-400",
      severity: "high" as const,
    },
    {
      id: "ui_ux",
      name: "UI/UX Issues",
      description: "User interface problems, design issues, confusing navigation, and usability problems",
      icon: Users,
      color: "text-yellow-400",
      severity: "medium" as const,
    },
    {
      id: "bugs_issues",
      name: "Bugs and Issues",
      description: "Non-fatal bugs, glitches, minor technical issues, and broken features",
      icon: Bug,
      color: "text-purple-400",
      severity: "medium" as const,
    },
  ];

  const generateIssueAnalysis = () => {
    // Filter reviews by version first, then apply Issues view specific filtering
    const versionFilteredReviews = filterReviewsByVersion(reviews, minVersion);

    // Apply Issues view specific filtering: rating ≤3, ≥60 characters, ≥4 words
    const issuesFilteredReviews = versionFilteredReviews.filter(review => {
      if (review.rating > 3) return false;

      const combinedText = `${review.title} ${review.content}`.trim();

      // Check minimum length (60 characters)
      if (combinedText.length < 60) return false;

      // Check minimum word count (4 words)
      const wordCount = combinedText.split(/\s+/).length;
      if (wordCount < 4) return false;

      return true;
    });

    if (issuesFilteredReviews.length === 0) {
      setIssueCategories([]);
      return;
    }

    // Use keyword-based categorization as fallback
    generateKeywordBasedCategories(issuesFilteredReviews);
  };

  const generateKeywordBasedCategories = (filteredReviews: AppStoreReview[]) => {
    const categoryDefinitions = getCategoryDefinitions();
    const keywordMap = {
      crashes_errors: [
        "crash",
        "crashes",
        "crashed",
        "freeze",
        "freezes",
        "fatal error",
        "not responding",
        "force close",
      ],
      feature_requests: [
        "feature",
        "missing",
        "need",
        "want",
        "should have",
        "request",
        "add",
        "enhancement",
        "suggestion",
      ],
      performance: ["slow", "lag", "loading", "performance", "speed", "battery", "memory", "hang", "stutter"],
      ui_ux: [
        "interface",
        "design",
        "layout",
        "confusing",
        "difficult",
        "hard to use",
        "unintuitive",
        "ugly",
        "navigation",
      ],
      bugs_issues: ["bug", "glitch", "error", "broken", "stuck", "not working", "fails", "issue", "problem"],
    };

    // Categorize reviews with priority-based assignment (no duplicates)
    const categorizedReviews = new Set<string>();
    const categories: IssueCategory[] = categoryDefinitions.map(def => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      color: def.color,
      reviews: [],
      count: 0,
      severity: def.severity,
    }));

    // Sort reviews by priority (highest priority category gets first pick)
    for (const category of categories) {
      const keywords = keywordMap[category.id as keyof typeof keywordMap] || [];

      const matchingReviews = filteredReviews.filter(review => {
        // Skip if already categorized
        if (categorizedReviews.has(review.id)) return false;

        // Check if review matches this category's keywords
        const reviewText = review.content.toLowerCase() + " " + review.title.toLowerCase();
        return keywords.some(keyword => reviewText.includes(keyword));
      });

      // Add matching reviews to this category
      category.reviews = matchingReviews;
      category.count = matchingReviews.length;

      // Mark these reviews as categorized
      matchingReviews.forEach(review => categorizedReviews.add(review.id));
    }

    // Add uncategorized reviews to "other" category
    const uncategorizedReviews = filteredReviews.filter(review => !categorizedReviews.has(review.id));
    if (uncategorizedReviews.length > 0) {
      categories.push({
        id: "other",
        name: "Other Issues",
        description: "Miscellaneous complaints and feedback",
        icon: AlertTriangle,
        color: "text-gray-400",
        reviews: uncategorizedReviews,
        count: uncategorizedReviews.length,
        severity: "low",
      });
    }

    // Filter out empty categories
    const nonEmptyCategories = categories.filter(category => category.count > 0);
    setIssueCategories(nonEmptyCategories);
    setCategorizationMethod("keyword");
  };

  const generateLLMBasedCategories = async () => {
    // Filter reviews by version first, then apply Issues view specific filtering
    const versionFilteredReviews = filterReviewsByVersion(reviews, minVersion);

    // Apply Issues view specific filtering: rating ≤3, ≥60 characters, ≥4 words
    const issuesFilteredReviews = versionFilteredReviews.filter(review => {
      if (review.rating > 3) return false;

      const combinedText = `${review.title} ${review.content}`.trim();

      // Check minimum length (60 characters)
      if (combinedText.length < 60) return false;

      // Check minimum word count (4 words)
      const wordCount = combinedText.split(/\s+/).length;
      if (wordCount < 4) return false;

      return true;
    });

    if (issuesFilteredReviews.length === 0) {
      setIssueCategories([]);
      return;
    }

    setIsCategorizingWithLLM(true);
    setCategorizationProgress({ stage: "Initializing...", percentage: 0 });

    try {
      const response = await fetch("/api/categorize-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviews: issuesFilteredReviews, // Send filtered reviews for Issues view
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "complete") {
                // Process the final categorization result
                const categoryDefinitions = getCategoryDefinitions();
                const categories: IssueCategory[] = categoryDefinitions.map(def => ({
                  id: def.id,
                  name: def.name,
                  description: def.description,
                  icon: def.icon,
                  color: def.color,
                  reviews: [],
                  count: 0,
                  severity: def.severity,
                }));

                // Group reviews by category
                const reviewsByCategory: Record<string, AppStoreReview[]> = {};

                for (const categoryResult of data.result.categories) {
                  const review = issuesFilteredReviews.find(r => r.id === categoryResult.reviewId);
                  if (review) {
                    if (!reviewsByCategory[categoryResult.category]) {
                      reviewsByCategory[categoryResult.category] = [];
                    }
                    reviewsByCategory[categoryResult.category].push(review);
                  }
                }

                // Update categories with reviews
                for (const category of categories) {
                  category.reviews = reviewsByCategory[category.id] || [];
                  category.count = category.reviews.length;
                }

                // Add "other" category if there are uncategorized reviews
                const categorizedReviewIds = new Set(data.result.categories.map((c: any) => c.reviewId));
                const uncategorizedReviews = issuesFilteredReviews.filter(
                  review => !categorizedReviewIds.has(review.id)
                );

                if (uncategorizedReviews.length > 0) {
                  categories.push({
                    id: "other",
                    name: "Other Issues",
                    description: "Miscellaneous complaints and feedback",
                    icon: AlertTriangle,
                    color: "text-gray-400",
                    reviews: uncategorizedReviews,
                    count: uncategorizedReviews.length,
                    severity: "low",
                  });
                }

                const nonEmptyCategories = categories.filter(category => category.count > 0);
                setIssueCategories(nonEmptyCategories);
                setCategorizationMethod(data.result.method || "llm");

                console.log(`✅ LLM categorization complete: ${data.result.categorizedReviews} reviews categorized`);
                break;
              } else if (data.type === "error") {
                throw new Error(data.error);
              } else {
                // Progress update
                setCategorizationProgress({
                  stage: data.stage || "Processing...",
                  percentage: data.percentage || 0,
                  totalReviews: data.totalReviews,
                  categorizedReviews: data.categorizedReviews,
                  errors: data.errors,
                });
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ LLM categorization failed:", error);

      // Fallback to keyword-based categorization
      setCategorizationProgress({ stage: "Falling back to keyword categorization...", percentage: 50 });
      generateKeywordBasedCategories(issuesFilteredReviews);
      setCategorizationMethod("keyword_fallback");
    } finally {
      setIsCategorizingWithLLM(false);
      setCategorizationProgress({ stage: "", percentage: 0 });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "high":
        return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case "low":
        return "bg-gray-500/20 border-gray-500/30 text-gray-400";
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-400";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "⚪";
      default:
        return "⚪";
    }
  };

  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${selectedCategory.color.replace("text-", "bg-").replace("-400", "-500/20")}`}
            >
              <selectedCategory.icon className={`h-5 w-5 ${selectedCategory.color}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedCategory.name}</h2>
              <p className="text-zinc-400">{selectedCategory.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Review display cards with improved structure */}
          {selectedCategory.reviews.map(review => (
            <Card
              key={review.id}
              className="bg-black/40 border-zinc-800/60 backdrop-blur-sm hover:bg-black/50 transition-all duration-200 group"
            >
              <CardContent className="p-0">
                {/* Header section with rating and metadata */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800/30">
                  <div className="flex items-center gap-3">
                    {/* Rating with visual emphasis */}
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        review.rating >= 4
                          ? "bg-green-500/20 text-green-400"
                          : review.rating >= 3
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      <span>{"★".repeat(review.rating)}</span>
                      <span className="ml-1">{review.rating}</span>
                    </div>

                    {/* Metadata badges */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:bg-zinc-700/30"
                      >
                        {review.region.toUpperCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:bg-zinc-700/30"
                      >
                        v{review.version}
                      </Badge>
                    </div>
                  </div>

                  {/* Date and time info */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(review.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Content section */}
                <div className="p-4 space-y-3">
                  {/* Review title */}
                  {review.title && (
                    <h4 className="font-semibold text-white text-base leading-tight group-hover:text-zinc-100 transition-colors">
                      {review.title}
                    </h4>
                  )}

                  {/* Review content */}
                  <div className="space-y-2">
                    <p className="text-zinc-300 text-sm leading-relaxed group-hover:text-zinc-200 transition-colors">
                      {review.content}
                    </p>
                  </div>
                </div>

                {/* Footer with author info */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 border-t border-zinc-800/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{review.author.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{review.author}</span>
                  </div>

                  {/* Severity indicator based on rating */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        review.rating <= 2 ? "bg-red-500" : review.rating <= 3 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-500/20 rounded-xl">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Issue Analysis</h2>
          <p className="text-zinc-400">Categorized negative reviews and user complaints</p>
        </div>
      </div>

      {/* Version Filter */}
      <VersionSlider reviews={reviews} appMetadata={appMetadata} onVersionChange={setMinVersion} />

      {/* LLM Categorization Controls */}
      {!isCategorizingWithLLM && analysisResult && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI-Powered Categorization</h3>
                  <p className="text-sm text-zinc-400">
                    Use LLM to intelligently categorize reviews instead of keyword matching
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {categorizationMethod !== "keyword" && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      categorizationMethod === "llm"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {categorizationMethod === "llm" ? "LLM Categorized" : "Keyword Fallback"}
                  </Badge>
                )}
                <Button
                  onClick={generateLLMBasedCategories}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 border border-emerald-600/50 text-emerald-200 hover:from-emerald-700 hover:via-green-700 hover:to-teal-800 hover:text-white transition-all duration-200 shadow-lg"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Use AI Categorization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LLM Categorization Progress */}
      {isCategorizingWithLLM && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Categorization in Progress</h3>
                  <p className="text-sm text-zinc-400">{categorizationProgress.stage}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Progress</span>
                  <span className="text-zinc-300">{Math.round(categorizationProgress.percentage)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${categorizationProgress.percentage}%` }}
                  />
                </div>

                {categorizationProgress.totalReviews && (
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Total Reviews: {categorizationProgress.totalReviews}</span>
                    {categorizationProgress.categorizedReviews !== undefined && (
                      <span>Categorized: {categorizationProgress.categorizedReviews}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {issueCategories.length === 0 && !analysisResult && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Analyze Issues</h3>
            <p className="text-zinc-400 mb-6">
              Run an analysis first to automatically generate issue categories from negative reviews.
            </p>
          </CardContent>
        </Card>
      )}

      {issueCategories.length === 0 && analysisResult && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Issues Found</h3>
            <p className="text-zinc-400 mb-6">
              No negative reviews found in the current dataset. Try adjusting the version filter or run analysis with
              more regions.
            </p>
          </CardContent>
        </Card>
      )}

      {issueCategories.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Issue Categories</h3>
              <p className="text-zinc-400">
                {issueCategories.reduce((sum, cat) => sum + cat.count, 0)} negative reviews categorized
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={generateIssueAnalysis}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate (Keywords)
              </Button>
              <Button
                onClick={generateLLMBasedCategories}
                variant="outline"
                size="sm"
                disabled={isCategorizingWithLLM}
                className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 border border-emerald-600/50 text-emerald-200 hover:from-emerald-700 hover:via-green-700 hover:to-teal-800 hover:text-white transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {isCategorizingWithLLM ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Use AI
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issueCategories.map(category => (
              <Card
                key={category.id}
                className="bg-black/30 border-zinc-800/50 backdrop-blur-sm cursor-pointer group"
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${category.color.replace("text-", "bg-").replace("-400", "-500/20")}`}
                    >
                      <category.icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <Badge className={getSeverityColor(category.severity)}>
                      {getSeverityIcon(category.severity)} {category.severity}
                    </Badge>
                  </div>

                  <h4 className="font-semibold text-white mb-2">{category.name}</h4>
                  <p className="text-zinc-400 text-sm mb-4">{category.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">{category.count}</div>
                    <div className="text-sm text-zinc-500">reviews</div>
                  </div>

                  <div className="mt-4 text-xs text-zinc-500">Click to view details →</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

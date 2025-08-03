"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bug, Zap, Monitor, Users, Settings, ArrowLeft, Clock, AlertTriangle } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Version filter state
  const [minVersion, setMinVersion] = useState<string>("0.0");

  // Auto-generate issues when component mounts or analysis result changes
  useEffect(() => {
    if (analysisResult && reviews.length > 0) {
      generateIssueAnalysis();
    }
  }, [analysisResult, reviews, minVersion]);

  const generateIssueAnalysis = async () => {
    // Don't regenerate if already generating
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Filter reviews by version first, then get negative reviews (rating 1-2)
      const filteredReviews = filterReviewsByVersion(reviews, minVersion);
      const negativeReviews = filteredReviews.filter(review => review.rating <= 2);

      if (negativeReviews.length === 0) {
        setIssueCategories([]);
        setIsGenerating(false);
        setGenerationProgress(0);
        return;
      }

      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Define category definitions with priority order (higher priority = appears first)
      const categoryDefinitions = [
        {
          id: "bugs",
          name: "Bugs & Crashes",
          description: "App crashes, freezes, and technical issues",
          icon: Bug,
          color: "text-red-400",
          keywords: ["crash", "bug", "freeze", "error", "broken", "stuck", "not working"],
          severity: "critical" as const,
          priority: 1,
        },
        {
          id: "performance",
          name: "Performance Issues",
          description: "Slow loading, lag, and performance problems",
          icon: Zap,
          color: "text-orange-400",
          keywords: ["slow", "lag", "loading", "performance", "speed", "overheat", "stammering"],
          severity: "high" as const,
          priority: 2,
        },
        {
          id: "ux",
          name: "User Experience",
          description: "UI/UX problems and usability issues",
          icon: Users,
          color: "text-yellow-400",
          keywords: ["interface", "design", "layout", "confusing", "difficult", "hard to use", "unintuitive"],
          severity: "medium" as const,
          priority: 3,
        },
        {
          id: "features",
          name: "Missing Features",
          description: "Requested features and functionality gaps",
          icon: Settings,
          color: "text-blue-400",
          keywords: ["feature", "missing", "need", "want", "should have", "export", "pdf", "word"],
          severity: "medium" as const,
          priority: 4,
        },
        {
          id: "content",
          name: "Content Issues",
          description: "Content quality, accuracy, and relevance problems",
          icon: AlertCircle,
          color: "text-purple-400",
          keywords: ["content", "information", "data", "wrong", "inaccurate", "better", "chatgpt"],
          severity: "low" as const,
          priority: 5,
        },
      ];

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
        const def = categoryDefinitions.find(d => d.id === category.id);
        if (!def) continue;

        const matchingReviews = negativeReviews.filter(review => {
          // Skip if already categorized
          if (categorizedReviews.has(review.id)) return false;

          // Check if review matches this category's keywords
          const reviewText = review.content.toLowerCase() + " " + review.title.toLowerCase();
          return def.keywords.some(keyword => reviewText.includes(keyword));
        });

        // Add matching reviews to this category
        category.reviews = matchingReviews;
        category.count = matchingReviews.length;

        // Mark these reviews as categorized
        matchingReviews.forEach(review => categorizedReviews.add(review.id));
      }

      // Add uncategorized reviews to "other" category
      const uncategorizedReviews = negativeReviews.filter(review => !categorizedReviews.has(review.id));
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

      // Log deduplication results for debugging
      const totalCategorized = nonEmptyCategories.reduce((sum, cat) => sum + cat.count, 0);
      console.log(
        `🔍 Issue Analysis: ${negativeReviews.length} negative reviews → ${totalCategorized} categorized (${
          negativeReviews.length - totalCategorized
        } in "other")`
      );
      console.log(
        `📋 Categories:`,
        nonEmptyCategories.map(cat => `${cat.name}: ${cat.count}`)
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setTimeout(() => {
        setIssueCategories(nonEmptyCategories);
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error generating issue analysis:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
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

        <div className="grid gap-4">
          {selectedCategory.reviews.map(review => (
            <Card key={review.id} className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {review.rating}★
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {review.region.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      v{review.version}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500">{new Date(review.date).toLocaleDateString()}</div>
                </div>

                <h4 className="font-semibold text-white mb-2">{review.title}</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">{review.content}</p>

                <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                  <span>by {review.author}</span>
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

      {issueCategories.length === 0 && !isGenerating && !analysisResult && (
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

      {issueCategories.length === 0 && !isGenerating && analysisResult && (
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

      {isGenerating && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analyzing Issues</h3>
            <p className="text-zinc-400 mb-4">Categorizing negative reviews and identifying common problems...</p>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-sm text-zinc-500">{generationProgress}% complete</p>
          </CardContent>
        </Card>
      )}

      {issueCategories.length > 0 && !isGenerating && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Issue Categories</h3>
              <p className="text-zinc-400">
                {issueCategories.reduce((sum, cat) => sum + cat.count, 0)} negative reviews categorized
              </p>
            </div>
            <Button
              onClick={generateIssueAnalysis}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
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

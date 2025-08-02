"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
  RefreshCw,
} from "lucide-react";
import { AnalysisResult, AppStoreReview, AppMetadata } from "@/app/types";
import { getSortedVersions, filterReviewsByVersion } from "@/lib/utils";

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
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  // Initialize versions and default filter
  useEffect(() => {
    const versions = getSortedVersions(reviews);
    setAvailableVersions(versions);

    if (versions.length > 0) {
      // Get the newest version from metadata if available, otherwise use the latest from reviews
      const newestVersion = appMetadata?.version || versions[versions.length - 1];

      // Find the index of the newest version in our available versions
      const newestIndex = versions.findIndex(v => v === newestVersion);

      // Set default to halfway between the oldest and newest version
      const defaultIndex = newestIndex >= 0 ? Math.floor(newestIndex / 2) : Math.floor(versions.length / 2);
      setSelectedVersionIndex(defaultIndex);
      setMinVersion(versions[defaultIndex]);
    }
  }, [reviews, appMetadata]);

  // Handle version slider change
  const handleVersionChange = (value: number[]) => {
    const index = value[0];
    setSelectedVersionIndex(index);
    setMinVersion(availableVersions[index] || "0.0");
  };

  const generateIssueAnalysis = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Filter reviews by version first, then get negative reviews (rating 1-2)
      const filteredReviews = filterReviewsByVersion(reviews, minVersion);
      const negativeReviews = filteredReviews.filter(review => review.rating <= 2);

      if (negativeReviews.length === 0) {
        setIssueCategories([]);
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

      // Analyze reviews and categorize them
      const categories: IssueCategory[] = [
        {
          id: "bugs",
          name: "Bugs & Crashes",
          description: "App crashes, freezes, and technical issues",
          icon: Bug,
          color: "text-red-400",
          reviews: negativeReviews.filter(
            review =>
              review.content.toLowerCase().includes("crash") ||
              review.content.toLowerCase().includes("bug") ||
              review.content.toLowerCase().includes("freeze") ||
              review.content.toLowerCase().includes("error") ||
              review.content.toLowerCase().includes("broken")
          ),
          count: 0,
          severity: "critical",
        },
        {
          id: "performance",
          name: "Performance Issues",
          description: "Slow loading, lag, and performance problems",
          icon: Zap,
          color: "text-orange-400",
          reviews: negativeReviews.filter(
            review =>
              review.content.toLowerCase().includes("slow") ||
              review.content.toLowerCase().includes("lag") ||
              review.content.toLowerCase().includes("loading") ||
              review.content.toLowerCase().includes("performance") ||
              review.content.toLowerCase().includes("speed")
          ),
          count: 0,
          severity: "high",
        },
        {
          id: "ux",
          name: "User Experience",
          description: "UI/UX problems and usability issues",
          icon: Users,
          color: "text-yellow-400",
          reviews: negativeReviews.filter(
            review =>
              review.content.toLowerCase().includes("interface") ||
              review.content.toLowerCase().includes("design") ||
              review.content.toLowerCase().includes("layout") ||
              review.content.toLowerCase().includes("confusing") ||
              review.content.toLowerCase().includes("difficult") ||
              review.content.toLowerCase().includes("hard to use")
          ),
          count: 0,
          severity: "medium",
        },
        {
          id: "features",
          name: "Missing Features",
          description: "Requested features and functionality gaps",
          icon: Settings,
          color: "text-blue-400",
          reviews: negativeReviews.filter(
            review =>
              review.content.toLowerCase().includes("feature") ||
              review.content.toLowerCase().includes("missing") ||
              review.content.toLowerCase().includes("need") ||
              review.content.toLowerCase().includes("want") ||
              review.content.toLowerCase().includes("should have")
          ),
          count: 0,
          severity: "medium",
        },
        {
          id: "content",
          name: "Content Issues",
          description: "Content quality, accuracy, and relevance problems",
          icon: AlertCircle,
          color: "text-purple-400",
          reviews: negativeReviews.filter(
            review =>
              review.content.toLowerCase().includes("content") ||
              review.content.toLowerCase().includes("information") ||
              review.content.toLowerCase().includes("data") ||
              review.content.toLowerCase().includes("wrong") ||
              review.content.toLowerCase().includes("inaccurate")
          ),
          count: 0,
          severity: "low",
        },
        {
          id: "other",
          name: "Other Issues",
          description: "Miscellaneous complaints and feedback",
          icon: AlertTriangle,
          color: "text-gray-400",
          reviews: [],
          count: 0,
          severity: "low",
        },
      ];

      // Calculate counts and assign uncategorized reviews to "other"
      const categorizedReviewIds = new Set();
      categories.forEach(category => {
        category.count = category.reviews.length;
        category.reviews.forEach(review => categorizedReviewIds.add(review.id));
      });

      // Add uncategorized reviews to "other"
      const uncategorizedReviews = negativeReviews.filter(review => !categorizedReviewIds.has(review.id));
      categories[5].reviews = uncategorizedReviews;
      categories[5].count = uncategorizedReviews.length;

      // Filter out empty categories
      const nonEmptyCategories = categories.filter(category => category.count > 0);

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
          {selectedCategory.reviews.map((review, index) => (
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
    <div className="space-y-8">
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
      {availableVersions.length > 0 && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Version Filter</h3>
                <p className="text-sm text-zinc-400">
                  {minVersion === availableVersions[0]
                    ? "Analyze all reviews from all versions"
                    : `Include reviews from version ${minVersion} and newer`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-zinc-300">Minimum Version</Label>
                <span className="text-sm font-mono text-blue-400">{minVersion}</span>
              </div>

              <Slider
                value={[selectedVersionIndex]}
                onValueChange={handleVersionChange}
                max={availableVersions.length - 1}
                min={0}
                step={1}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-zinc-500">
                <span>{availableVersions[0] || "0.0"}</span>
                <span>{availableVersions[availableVersions.length - 1] || "0.0"}</span>
              </div>

              <div className="text-xs text-zinc-400">
                <span className="font-medium">Available versions:</span> {availableVersions.join(", ")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {issueCategories.length === 0 && !isGenerating && (
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Issue Analysis Generated</h3>
            <p className="text-zinc-400 mb-6">
              Click the button below to analyze negative reviews and categorize them by issue type.
            </p>
            <Button
              onClick={generateIssueAnalysis}
              disabled={isGenerating}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Issues... {generationProgress}%
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Generate Issue Analysis
                </>
              )}
            </Button>
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
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issueCategories.map(category => (
              <Card
                key={category.id}
                className="bg-black/30 border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700/50 transition-all cursor-pointer group"
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

                  <h4 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h4>
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

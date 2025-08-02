"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Target, Users, Activity, AlertCircle, CheckCircle, Sparkles, RefreshCw } from "lucide-react";
import { AnalysisResult, AppStoreReview, AppMetadata } from "@/app/types";
import { getSortedVersions, getDefaultMinVersion, filterReviewsByVersion } from "@/lib/utils";

interface TasksViewProps {
  analysisResult: AnalysisResult;
  reviews: AppStoreReview[];
  appMetadata?: AppMetadata | null;
  onAnalysisUpdate?: (updatedAnalysis: AnalysisResult) => void;
}

export function TasksView({ analysisResult, reviews, appMetadata, onAnalysisUpdate }: TasksViewProps) {
  const { actionableSteps } = analysisResult;
  const { steps, summary, insights } = actionableSteps;

  // Version filter state
  const [minVersion, setMinVersion] = useState<string>("0.0");
  const [filteredSteps, setFilteredSteps] = useState(actionableSteps);
  const [isRegenerating, setIsRegenerating] = useState(false);
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

  // Update filtered steps when actionable steps change
  useEffect(() => {
    setFilteredSteps(actionableSteps);
  }, [actionableSteps]);

  // Regenerate actionable steps with version filter
  const regenerateActionableSteps = async () => {
    if (minVersion === "0.0") {
      setFilteredSteps(actionableSteps);
      return;
    }

    setIsRegenerating(true);
    try {
      const filteredReviews = filterReviewsByVersion(reviews, minVersion);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviews: filteredReviews,
          metadata: appMetadata,
          minVersion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate actionable steps");
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
                const updatedActionableSteps = data.analysis.actionableSteps;
                setFilteredSteps(updatedActionableSteps);

                // Update the main analysis result if callback is provided
                if (onAnalysisUpdate) {
                  const updatedAnalysis = {
                    ...analysisResult,
                    actionableSteps: updatedActionableSteps,
                  };
                  onAnalysisUpdate(updatedAnalysis);
                }
                break;
              }
            } catch (parseError) {
              console.error("Error parsing analysis data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error regenerating actionable steps:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle version slider change
  const handleVersionChange = (value: number[]) => {
    const index = value[0];
    setSelectedVersionIndex(index);
    setMinVersion(availableVersions[index] || "0.0");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 border-red-400/30";
      case "high":
        return "text-orange-400 border-orange-400/30";
      case "medium":
        return "text-yellow-400 border-yellow-400/30";
      case "low":
        return "text-green-400 border-green-400/30";
      default:
        return "text-zinc-400 border-zinc-400/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug":
        return "🐛";
      case "performance":
        return "⚡";
      case "feature":
        return "✨";
      case "ui":
        return "🎨";
      case "content":
        return "📝";
      default:
        return "🔧";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-500/20 rounded-xl">
          <Target className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI-Generated Action Items</h2>
          <p className="text-zinc-400">Prioritized tasks based on comprehensive user feedback analysis</p>
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
              <button
                onClick={regenerateActionableSteps}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                {isRegenerating ? "Regenerating..." : "Apply Filter"}
              </button>
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

      {/* Actionable Steps */}
      <div className="space-y-6">
        {filteredSteps.steps.map((step, index) => (
          <Card
            key={step.id}
            className="bg-black/30 border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700/50 transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getCategoryIcon(step.category)}</span>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    <Badge variant="outline" className={getPriorityColor(step.priority)}>
                      {step.priority} priority
                    </Badge>
                  </div>
                  <p className="text-zinc-300 mb-4 leading-relaxed">{step.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Target className="h-4 w-4" />
                      <span>Confidence: {Math.round(step.confidence * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Activity className="h-4 w-4" />
                      <span className="capitalize">{step.timeframe}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="text-2xl">{getCategoryIcon(step.category)}</span>
                      <span className="capitalize">{step.category}</span>
                    </div>
                  </div>

                  {step.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-400" />
              Top Issues & Pain Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSteps.insights.topIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <span className="text-sm text-zinc-300">{issue}</span>
                </div>
              ))}
              {filteredSteps.insights.userPainPoints.map((painPoint, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <span className="text-sm text-zinc-300">{painPoint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Quick Wins & Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSteps.insights.quickWins.map((win, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-sm text-zinc-300">{win}</span>
                </div>
              ))}
              {filteredSteps.insights.strategicRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <span className="text-sm text-zinc-300">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Impact */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            Expected Overall Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-300 leading-relaxed">{filteredSteps.summary.overallImpact}</p>
        </CardContent>
      </Card>
    </div>
  );
}

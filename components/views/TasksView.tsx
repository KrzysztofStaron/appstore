"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Activity, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { AnalysisResult, AppStoreReview, AppMetadata } from "@/app/types";
import { filterReviewsByVersion } from "@/lib/utils";
import { VersionSlider } from "@/components/ui/version-slider";

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
      <VersionSlider
        reviews={reviews}
        appMetadata={appMetadata}
        onVersionChange={setMinVersion}
        onRegenerate={regenerateActionableSteps}
        isRegenerating={isRegenerating}
      />

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

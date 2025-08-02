"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Activity, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { AnalysisResult, AppStoreReview } from "@/app/types";

interface TasksViewProps {
  analysisResult: AnalysisResult;
  reviews: AppStoreReview[];
}

export function TasksView({ analysisResult, reviews }: TasksViewProps) {
  const { actionableSteps } = analysisResult;
  const { steps, summary, insights } = actionableSteps;

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

      {/* Actionable Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
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
              {insights.topIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <span className="text-sm text-zinc-300">{issue}</span>
                </div>
              ))}
              {insights.userPainPoints.map((painPoint, index) => (
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
              {insights.quickWins.map((win, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-sm text-zinc-300">{win}</span>
                </div>
              ))}
              {insights.strategicRecommendations.map((rec, index) => (
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
          <p className="text-zinc-300 leading-relaxed">{summary.overallImpact}</p>
        </CardContent>
      </Card>
    </div>
  );
}

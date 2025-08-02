"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, AlertCircle, CheckCircle, TrendingUp, Zap, Award } from "lucide-react";
import { AnalysisResult } from "@/app/types";

interface InsightsViewProps {
  analysisResult: AnalysisResult;
}

export function InsightsView({ analysisResult }: InsightsViewProps) {
  const { actionableSteps } = analysisResult;
  const { insights, summary } = actionableSteps;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-pink-500/20 rounded-xl">
          <Sparkles className="h-6 w-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI-Generated Insights</h2>
          <p className="text-zinc-400">Comprehensive analysis and strategic recommendations</p>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Priority Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Critical</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-red-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(summary.criticalSteps / summary.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{summary.criticalSteps}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-400">High</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-orange-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(summary.highPrioritySteps / summary.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{summary.highPrioritySteps}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">Medium</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-yellow-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${(summary.mediumPrioritySteps / summary.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{summary.mediumPrioritySteps}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Critical Issues & Pain Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Top Issues</h4>
                <ul className="space-y-2">
                  {insights.topIssues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                      <span className="text-sm text-zinc-300">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">User Pain Points</h4>
                <ul className="space-y-2">
                  {insights.userPainPoints.map((painPoint, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                      <span className="text-sm text-zinc-300">{painPoint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Opportunities & Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Quick Wins</h4>
                <ul className="space-y-2">
                  {insights.quickWins.map((win, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <span className="text-sm text-zinc-300">{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Strategic Recommendations</h4>
                <ul className="space-y-2">
                  {insights.strategicRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      <span className="text-sm text-zinc-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Rating Trend</h3>
            <p className="text-sm text-zinc-400">
              {analysisResult.dynamicMetrics?.ratingTrend?.trendDescription || "Insufficient data for trend analysis"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Performance</h3>
            <p className="text-sm text-zinc-400">
              {analysisResult.dynamicMetrics?.performanceMetrics?.speedComplaintChange > 0
                ? `${analysisResult.dynamicMetrics.performanceMetrics.speedComplaintChange} more speed complaints`
                : `${Math.abs(
                    analysisResult.dynamicMetrics?.performanceMetrics?.speedComplaintChange || 0
                  )} fewer speed complaints`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-pink-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Top Features</h3>
            <p className="text-sm text-zinc-400">
              {analysisResult.dynamicMetrics?.keywordTrends?.topPositiveKeywords?.length > 0
                ? `"${analysisResult.dynamicMetrics.keywordTrends.topPositiveKeywords[0].keyword}" trending positively`
                : "Focus on user experience improvements"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  Star,
  MessageSquare,
  Brain,
  Shield,
  TrendingUp,
  ArrowUp,
  CheckCircle,
  Sparkles,
  PieChartIcon,
  Award,
  AlertCircle,
} from "lucide-react";
import { AnalysisResult, AppMetadata } from "@/app/types";

const CHART_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316"];

interface DashboardViewProps {
  analysisResult: AnalysisResult;
  appMetadata: AppMetadata | null;
}

export function DashboardView({ analysisResult, appMetadata }: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                +{analysisResult.dynamicMetrics?.timeBasedStats?.recentActivity?.last7Days || 0}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-white">
                {analysisResult.basicStats.totalReviews.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">Total Reviews</div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>
                  {analysisResult.dynamicMetrics?.timeBasedStats?.averageReviewsPerDay?.toFixed(1) || "0.0"} reviews/day
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                AI
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-white">
                {Math.round((analysisResult.sentimentAnalysis.positive / analysisResult.sentimentAnalysis.total) * 100)}
                %
              </div>
              <div className="text-sm text-zinc-400">Positive Sentiment</div>
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <Sparkles className="h-3 w-3" />
                <span>AI analyzed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Shield className="h-5 w-5 text-orange-400" />
              </div>
              <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                {analysisResult.dynamicMetrics?.userComplaints?.totalIssues || 0} Issues
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-white">
                {analysisResult.filteredAnalysis.informativePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-zinc-400">Quality Score</div>
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <CheckCircle className="h-3 w-3" />
                <span>{analysisResult.dynamicMetrics?.impactAssessment?.criticalIssues || 0} critical issues</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-400" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(analysisResult.basicStats.ratingDistribution).map(([rating, count]) => ({
                    rating: `${rating}★`,
                    count: count as number,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="rating" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysisResult.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis domain={[1, 5]} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="averageRating"
                    stroke="#10B981"
                    fill="url(#colorGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            AI Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Rating Trend</h3>
              <p className="text-sm text-zinc-400">
                {analysisResult.dynamicMetrics?.ratingTrend?.trendDescription || "Insufficient data for trend analysis"}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Key Issues</h3>
              <p className="text-sm text-zinc-400">
                {analysisResult.dynamicMetrics?.performanceMetrics?.speedComplaintChange > 0
                  ? `Speed complaints increased by ${analysisResult.dynamicMetrics.performanceMetrics.speedComplaintChange}`
                  : `Speed complaints decreased by ${Math.abs(
                      analysisResult.dynamicMetrics?.performanceMetrics?.speedComplaintChange || 0
                    )}`}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Top Feature</h3>
              <p className="text-sm text-zinc-400">
                {analysisResult.dynamicMetrics?.keywordTrends?.topPositiveKeywords?.length > 0
                  ? `"${analysisResult.dynamicMetrics.keywordTrends.topPositiveKeywords[0].keyword}" mentioned ${analysisResult.dynamicMetrics.keywordTrends.topPositiveKeywords[0].count} times positively`
                  : "No positive keywords found"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  Star,
  MessageSquare,
  Brain,
  Shield,
  TrendingUp,
  CheckCircle,
  Sparkles,
  PieChartIcon,
  BarChart3,
  MapPin,
  GitBranch,
  AlertTriangle,
  Target,
  Users,
  Activity,
} from "lucide-react";
import { AnalysisResult, AppMetadata, ViewType } from "@/app/types";

const CHART_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316"];

interface DashboardViewProps {
  analysisResult: AnalysisResult;
  appMetadata: AppMetadata | null;
  onNavigateToView?: (view: ViewType) => void;
}

export function DashboardView({ analysisResult, appMetadata, onNavigateToView }: DashboardViewProps) {
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
                AI Filtered
              </Badge>
            </div>
            <div className="space-y-1 mb-4">
              <div className="text-3xl font-bold text-white">
                {analysisResult.basicStats.totalReviews.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">Relevant Reviews Analyzed</div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Sparkles className="h-3 w-3" />
                <span>AI-powered filtering applied</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-green-400/70 hover:text-green-400 hover:bg-green-500/5 h-8"
              onClick={() => onNavigateToView?.("regions")}
            >
              <MapPin className="h-3 w-3 mr-1" />
              View by Region
            </Button>
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
            <div className="space-y-1 mb-4">
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
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-purple-400/70 hover:text-purple-400 hover:bg-purple-500/5 h-8"
              onClick={() => onNavigateToView?.("sentiment")}
            >
              <Brain className="h-3 w-3 mr-1" />
              View Sentiment
            </Button>
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
            <div className="space-y-1 mb-4">
              <div className="text-3xl font-bold text-white">
                {analysisResult.filteredAnalysis.informativePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-zinc-400">Quality Score</div>
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <CheckCircle className="h-3 w-3" />
                <span>{analysisResult.dynamicMetrics?.impactAssessment?.criticalIssues || 0} critical issues</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/5 h-8"
              onClick={() => onNavigateToView?.("issues")}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              View Issues
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                {analysisResult.dynamicMetrics?.ratingTrend?.trendDirection || "stable"}
              </Badge>
            </div>
            <div className="space-y-1 mb-4">
              <div className="text-3xl font-bold text-white">{analysisResult.basicStats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-zinc-400">Average Rating</div>
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <Star className="h-3 w-3" />
                <span>Overall score</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/5 h-8"
              onClick={() => onNavigateToView?.("trends")}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              View Trends
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Most Relevant Actionable Step */}
      {analysisResult.actionableSteps?.steps?.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Target className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Most Relevant Action</h2>
              <p className="text-zinc-400">
                Based on AI analysis of {analysisResult.basicStats.totalReviews.toLocaleString()} reviews
              </p>
            </div>
          </div>

          {(() => {
            const topStep = analysisResult.actionableSteps.steps
              .filter(step => step.priority === "critical" || step.priority === "high")
              .sort((a, b) => {
                // Sort by priority first, then by confidence
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
                const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

                if (aPriority !== bPriority) return bPriority - aPriority;
                return (b.confidence || 0) - (a.confidence || 0);
              })[0];

            if (!topStep) return null;

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
              <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{getCategoryIcon(topStep.category)}</span>
                        <h3 className="text-xl font-semibold text-white">{topStep.title}</h3>
                        <Badge variant="outline" className={getPriorityColor(topStep.priority)}>
                          {topStep.priority} priority
                        </Badge>
                      </div>
                      <p className="text-zinc-300 mb-4 leading-relaxed">{topStep.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Target className="h-4 w-4" />
                          <span>Confidence: {Math.round((topStep.confidence || 0) * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Activity className="h-4 w-4" />
                          <span className="capitalize">{topStep.timeframe}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <span className="text-2xl">{getCategoryIcon(topStep.category)}</span>
                          <span className="capitalize">{topStep.category}</span>
                        </div>
                      </div>

                      {topStep.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {topStep.tags.map((tag, tagIndex) => (
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
            );
          })()}
        </div>
      )}

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
            <div className="h-64 mb-4">
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
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-zinc-400/70 hover:text-zinc-300 hover:bg-zinc-800/50 h-8"
              onClick={() => onNavigateToView?.("versions")}
            >
              <GitBranch className="h-3 w-3 mr-1" />
              View by Version
            </Button>
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
            <div className="h-64 mb-4">
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
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-zinc-400/70 hover:text-zinc-300 hover:bg-zinc-800/50 h-8"
              onClick={() => onNavigateToView?.("trends")}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Detailed Trends
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

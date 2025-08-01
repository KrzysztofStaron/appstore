"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  Search,
  TrendingUp,
  Star,
  MessageSquare,
  AlertCircle,
  Activity,
  BarChart3,
  Users,
  Target,
  CheckCircle,
  ArrowUp,
  Settings,
  Globe,
  Zap,
  Brain,
  Layers,
  PieChartIcon,
  Clock,
  Award,
  Shield,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { APP_STORE_REGIONS } from "@/lib/app-store-api";

// Types remain the same
interface AppStoreReview {
  id: string;
  region: string;
  title: string;
  content: string;
  rating: number;
  version: string;
  date: string;
  author: string;
}

interface AppMetadata {
  trackName: string;
  sellerName: string;
  primaryGenreName: string;
  averageUserRating: number;
  userRatingCount: number;
  version: string;
}

interface AnalysisResult {
  basicStats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
  };
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
  filteredAnalysis: {
    informativeReviews: number;
    nonInformativeReviews: number;
    informativePercentage: number;
    totalReviews: number;
    categoryBreakdown: Record<string, number>;
  };
  keywordAnalysis: Array<{
    keyword: string;
    count: number;
    sentiment: string;
    averageRating: number;
  }>;
  topReviews: {
    positive: AppStoreReview[];
    negative: AppStoreReview[];
  };
  trendData: Array<{
    date: string;
    averageRating: number;
  }>;
  versionAnalysis: Array<{
    version: string;
    averageRating: number;
  }>;
  regionalAnalysis: Array<{
    region: string;
    averageRating: number;
  }>;
}

type ViewType = "dashboard" | "sentiment" | "trends" | "keywords" | "regions" | "versions" | "tasks" | "insights";

const CHART_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316"];

export default function AppStoreAnalyzer() {
  const [appId, setAppId] = useState("6670324846");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["us", "gb", "ca"]);
  const [reviews, setReviews] = useState<AppStoreReview[]>([]);
  const [appMetadata, setAppMetadata] = useState<AppMetadata | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [regionProgress, setRegionProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("");

  const handleAnalyze = () => {
    if (!appId.trim()) return;

    setError(null);
    setProgress(0);
    setRegionProgress(null);
    setIsAnalyzing(true);

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
        setIsAnalyzing(false);
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

  const renderMainContent = () => {
    if (!analysisResult) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Ready to Analyze</h3>
            <p className="text-zinc-400 mb-6">
              Configure your app settings in the sidebar and start your first analysis to unlock powerful insights.
            </p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardView analysisResult={analysisResult} appMetadata={appMetadata} />;
      case "sentiment":
        return <SentimentView analysisResult={analysisResult} />;
      case "trends":
        return <TrendsView analysisResult={analysisResult} />;
      case "keywords":
        return <KeywordsView analysisResult={analysisResult} />;
      case "regions":
        return <RegionsView analysisResult={analysisResult} />;
      case "versions":
        return <VersionsView analysisResult={analysisResult} />;
      case "tasks":
        return <TasksView analysisResult={analysisResult} reviews={reviews} />;
      case "insights":
        return <InsightsView analysisResult={analysisResult} />;
      default:
        return <DashboardView analysisResult={analysisResult} appMetadata={appMetadata} />;
    }
  };

  const sidebarItems = [
    { id: "dashboard", label: "Overview", icon: BarChart3, color: "text-blue-400" },
    { id: "sentiment", label: "Sentiment", icon: Brain, color: "text-green-400" },
    { id: "trends", label: "Trends", icon: TrendingUp, color: "text-purple-400" },
    { id: "keywords", label: "Keywords", icon: Zap, color: "text-yellow-400" },
    { id: "regions", label: "Regions", icon: Globe, color: "text-cyan-400" },
    { id: "versions", label: "Versions", icon: Layers, color: "text-orange-400" },
    { id: "tasks", label: "Action Items", icon: Target, color: "text-red-400" },
    { id: "insights", label: "AI Insights", icon: Sparkles, color: "text-pink-400" },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-black/50 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Analytics Hub</h1>
              <p className="text-xs text-zinc-400">App Store Intelligence</p>
            </div>
          </div>

          {/* App Configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-zinc-300 mb-2 block">App Store ID</Label>
              <Input
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="Enter App ID"
                className="bg-zinc-900/50 border-zinc-700 text-white text-sm h-9"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-300 mb-2 block">Regions</Label>
              <Select value={selectedRegions.join(",")} onValueChange={value => setSelectedRegions(value.split(","))}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all">🌐 Global (175 regions)</SelectItem>
                  <SelectItem value="us,gb,ca">🌍 Major Markets</SelectItem>
                  <SelectItem value="us">🇺🇸 US Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRegions.includes("all") && (
              <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-300">All Regions Selected</span>
                </div>
                <p className="text-sm text-yellow-200 mt-1">
                  This will fetch reviews from all 175 App Store regions. This may take several minutes.
                </p>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isPending || !appId.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-9 text-sm"
            >
              {isAnalyzing ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{currentStage || "Processing reviews..."}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1 bg-zinc-800" />
                {regionProgress && (
                  <div className="text-xs text-zinc-500">
                    Region {regionProgress.current} of {regionProgress.total} (
                    {Math.round((regionProgress.current / regionProgress.total) * 100)}%)
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert className="bg-red-900/20 border-red-600/50 text-red-200 p-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* App Info */}
        {appMetadata && (
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{appMetadata.trackName.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{appMetadata.trackName}</h3>
                <p className="text-xs text-zinc-400">{appMetadata.sellerName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/30 rounded-lg p-3">
                <div className="text-lg font-bold text-yellow-400">{appMetadata.averageUserRating.toFixed(1)}</div>
                <div className="text-xs text-zinc-400">Rating</div>
              </div>
              <div className="bg-zinc-900/30 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-400">
                  {(appMetadata.userRatingCount / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-zinc-400">Reviews</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800/50 text-white border border-zinc-700/50"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? item.color : ""}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              disabled={!reviews.length}
              className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-8">{renderMainContent()}</div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({
  analysisResult,
  appMetadata,
}: {
  analysisResult: AnalysisResult;
  appMetadata: AppMetadata | null;
}) {
  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                Live
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-white">{analysisResult.basicStats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-zinc-400">Average Rating</div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>+0.2 this week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                +12%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-white">
                {analysisResult.basicStats.totalReviews.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">Total Reviews</div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>Growing steadily</span>
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
                Quality
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-white">
                {analysisResult.filteredAnalysis.informativePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-zinc-400">Quality Score</div>
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <CheckCircle className="h-3 w-3" />
                <span>High quality</span>
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
                  <YAxis domain={[3.5, 5]} stroke="#9CA3AF" />
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
              <h3 className="text-white font-semibold mb-2">Positive Trend</h3>
              <p className="text-sm text-zinc-400">Rating improved by 0.3 points over the last month</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Key Issues</h3>
              <p className="text-sm text-zinc-400">Performance complaints increased by 15%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Top Feature</h3>
              <p className="text-sm text-zinc-400">"Fast responses" mentioned 234 times positively</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sentiment View Component
function SentimentView({ analysisResult }: { analysisResult: AnalysisResult }) {
  const sentimentData = [
    {
      name: "Positive",
      value: Math.round((analysisResult.sentimentAnalysis.positive / analysisResult.sentimentAnalysis.total) * 100),
      color: "#10B981",
    },
    {
      name: "Neutral",
      value: Math.round((analysisResult.sentimentAnalysis.neutral / analysisResult.sentimentAnalysis.total) * 100),
      color: "#F59E0B",
    },
    {
      name: "Negative",
      value: Math.round((analysisResult.sentimentAnalysis.negative / analysisResult.sentimentAnalysis.total) * 100),
      color: "#EF4444",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-500/20 rounded-xl">
          <Brain className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Sentiment Analysis</h2>
          <p className="text-zinc-400">AI-powered emotion detection from user reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="text-white font-semibold">Positive Sentiment</h3>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Excellent</Badge>
              </div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {Math.round((analysisResult.sentimentAnalysis.positive / analysisResult.sentimentAnalysis.total) * 100)}
                %
              </div>
              <p className="text-sm text-zinc-400">Users expressing satisfaction and praise</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <h3 className="text-white font-semibold">Neutral Sentiment</h3>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400">Balanced</Badge>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {Math.round((analysisResult.sentimentAnalysis.neutral / analysisResult.sentimentAnalysis.total) * 100)}%
              </div>
              <p className="text-sm text-zinc-400">Factual reviews without strong emotion</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h3 className="text-white font-semibold">Negative Sentiment</h3>
                </div>
                <Badge className="bg-red-500/20 text-red-400">Needs Attention</Badge>
              </div>
              <div className="text-4xl font-bold text-red-400 mb-2">
                {Math.round((analysisResult.sentimentAnalysis.negative / analysisResult.sentimentAnalysis.total) * 100)}
                %
              </div>
              <p className="text-sm text-zinc-400">Users expressing frustration or complaints</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Trends View Component
function TrendsView({ analysisResult }: { analysisResult: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/20 rounded-xl">
          <TrendingUp className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Trend Analysis</h2>
          <p className="text-zinc-400">Track rating changes and performance over time</p>
        </div>
      </div>

      <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Rating Trends</CardTitle>
          <CardDescription className="text-zinc-400">
            Your app's rating performance over the last 7 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisResult.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis domain={[3.5, 5]} stroke="#9CA3AF" />
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
                  stroke="#8B5CF6"
                  fill="url(#purpleGradient)"
                  strokeWidth={3}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-400 mb-1">+0.3</div>
            <div className="text-sm text-zinc-400">Rating Improvement</div>
            <div className="text-xs text-green-400 mt-2">Last 30 days</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-400 mb-1">4.2</div>
            <div className="text-sm text-zinc-400">Current Rating</div>
            <div className="text-xs text-blue-400 mt-2">Above average</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-purple-400 mb-1">7</div>
            <div className="text-sm text-zinc-400">Weeks Tracked</div>
            <div className="text-xs text-purple-400 mt-2">Consistent data</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Keywords View Component
function KeywordsView({ analysisResult }: { analysisResult: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-yellow-500/20 rounded-xl">
          <Zap className="h-6 w-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Keyword Analysis</h2>
          <p className="text-zinc-400">Most mentioned terms and their sentiment impact</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analysisResult.keywordAnalysis.map((keyword, index) => (
          <Card
            key={keyword.keyword}
            className={`bg-gradient-to-br ${
              keyword.sentiment === "positive"
                ? "from-green-500/10 to-green-600/5 border-green-500/20"
                : keyword.sentiment === "negative"
                ? "from-red-500/10 to-red-600/5 border-red-500/20"
                : "from-gray-500/10 to-gray-600/5 border-gray-500/20"
            } backdrop-blur-sm hover:scale-105 transition-transform`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-white">{keyword.keyword}</div>
                <Badge
                  variant={
                    keyword.sentiment === "positive"
                      ? "default"
                      : keyword.sentiment === "negative"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {keyword.sentiment}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Mentions</span>
                  <span className="text-sm font-semibold text-white">{keyword.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Avg Rating</span>
                  <span className="text-sm font-semibold text-white">{keyword.averageRating.toFixed(1)}★</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Regions View Component
function RegionsView({ analysisResult }: { analysisResult: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-cyan-500/20 rounded-xl">
          <Globe className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Regional Performance</h2>
          <p className="text-zinc-400">App ratings across different geographic regions</p>
        </div>
      </div>

      <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Regional Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisResult.regionalAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="region" stroke="#9CA3AF" />
                <YAxis domain={[3.5, 5]} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Bar dataKey="averageRating" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Versions View Component
function VersionsView({ analysisResult }: { analysisResult: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-500/20 rounded-xl">
          <Layers className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Version Analysis</h2>
          <p className="text-zinc-400">Compare performance across different app versions</p>
        </div>
      </div>

      <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Version Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisResult.versionAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="version" stroke="#9CA3AF" />
                <YAxis domain={[3.5, 5]} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Bar dataKey="averageRating" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tasks View Component
function TasksView({ analysisResult, reviews }: { analysisResult: AnalysisResult; reviews: AppStoreReview[] }) {
  const tasks = [
    {
      id: "crashes",
      title: "Fix App Crashes",
      description: "45 users reported crashes and errors. Investigate and fix stability issues.",
      priority: "high" as const,
      category: "bug" as const,
      affectedUsers: 45,
      estimatedImpact: "Critical - affects user experience",
    },
    {
      id: "performance",
      title: "Improve App Performance",
      description: "123 users reported performance issues. Optimize app speed and responsiveness.",
      priority: "high" as const,
      category: "performance" as const,
      affectedUsers: 123,
      estimatedImpact: "High - affects user satisfaction",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-500/20 rounded-xl">
          <Target className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Action Items</h2>
          <p className="text-zinc-400">Prioritized tasks based on user feedback analysis</p>
        </div>
      </div>

      <div className="space-y-6">
        {tasks.map(task => (
          <Card key={task.id} className="bg-black/30 border-zinc-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                    <Badge variant={task.priority === "high" ? "destructive" : "default"}>
                      {task.priority} priority
                    </Badge>
                    <Badge variant="outline" className="text-zinc-400">
                      {task.category}
                    </Badge>
                  </div>
                  <p className="text-zinc-300 mb-4">{task.description}</p>
                  <div className="flex items-center gap-6 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{task.affectedUsers} users affected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{task.estimatedImpact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Insights View Component
function InsightsView({ analysisResult }: { analysisResult: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-pink-500/20 rounded-xl">
          <Sparkles className="h-6 w-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Insights</h2>
          <p className="text-zinc-400">Machine learning powered recommendations and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Positive Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Rating Improvement</div>
                  <div className="text-sm text-zinc-400">
                    Your app rating has improved by 0.3 points over the last month
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Positive Keywords</div>
                  <div className="text-sm text-zinc-400">"Fast" and "useful" are trending positively in reviews</div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Crash Reports</div>
                  <div className="text-sm text-zinc-400">45 users reported app crashes - priority fix needed</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Performance Issues</div>
                  <div className="text-sm text-zinc-400">Speed complaints increased by 15% this month</div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Stability Focus</h3>
              <p className="text-sm text-zinc-400">Prioritize fixing crashes to improve user retention</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Performance Boost</h3>
              <p className="text-sm text-zinc-400">Optimize loading times to address speed concerns</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Feature Highlight</h3>
              <p className="text-sm text-zinc-400">Promote "fast responses" feature in marketing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

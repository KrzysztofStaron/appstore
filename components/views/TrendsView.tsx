"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity, Clock } from "lucide-react";
import { AnalysisResult } from "@/app/types";

interface TrendsViewProps {
  analysisResult: AnalysisResult;
}

export function TrendsView({ analysisResult }: TrendsViewProps) {
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
            Average rating of the most relevant reviews in each 7 day period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analysisResult.trendData.map(item => ({
                  ...item,
                  averageRating: Number(item.averageRating).toFixed(2),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis
                  domain={[Math.min(...analysisResult.trendData.map(item => item.averageRating)) / 2, 5]}
                  stroke="#9CA3AF"
                />
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
            <div className="text-2xl font-bold text-green-400 mb-1">
              {analysisResult.dynamicMetrics?.ratingTrend?.monthlyChange > 0 ? "+" : ""}
              {analysisResult.dynamicMetrics?.ratingTrend?.monthlyChange?.toFixed(1) || "0.0"}
            </div>
            <div className="text-sm text-zinc-400">Rating Change</div>
            <div className="text-xs text-green-400 mt-2">Last 30 days</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {analysisResult.basicStats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-zinc-400">Current Rating</div>
            <div className="text-xs text-blue-400 mt-2">
              {analysisResult.basicStats.averageRating >= 4.0
                ? "Above average"
                : analysisResult.basicStats.averageRating >= 3.0
                ? "Average"
                : "Below average"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {analysisResult.dynamicMetrics?.timeBasedStats?.weeksTracked || 0}
            </div>
            <div className="text-sm text-zinc-400">Weeks Tracked</div>
            <div className="text-xs text-purple-400 mt-2">
              {analysisResult.dynamicMetrics?.timeBasedStats?.weeksTracked >= 4 ? "Consistent data" : "Limited data"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

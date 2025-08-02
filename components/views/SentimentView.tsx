"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Brain } from "lucide-react";
import { AnalysisResult } from "@/app/types";

interface SentimentViewProps {
  analysisResult: AnalysisResult;
}

export function SentimentView({ analysisResult }: SentimentViewProps) {
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
                <Badge className="bg-green-500/20 text-green-400">
                  {Math.round(
                    (analysisResult.sentimentAnalysis.positive / analysisResult.sentimentAnalysis.total) * 100
                  ) >= 70
                    ? "Excellent"
                    : Math.round(
                        (analysisResult.sentimentAnalysis.positive / analysisResult.sentimentAnalysis.total) * 100
                      ) >= 50
                    ? "Good"
                    : "Fair"}
                </Badge>
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
                <Badge className="bg-yellow-500/20 text-yellow-400">
                  {Math.round(
                    (analysisResult.sentimentAnalysis.neutral / analysisResult.sentimentAnalysis.total) * 100
                  ) >= 40
                    ? "High"
                    : Math.round(
                        (analysisResult.sentimentAnalysis.neutral / analysisResult.sentimentAnalysis.total) * 100
                      ) >= 20
                    ? "Balanced"
                    : "Low"}
                </Badge>
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
                <Badge className="bg-red-500/20 text-red-400">
                  {Math.round(
                    (analysisResult.sentimentAnalysis.negative / analysisResult.sentimentAnalysis.total) * 100
                  ) >= 30
                    ? "Critical"
                    : Math.round(
                        (analysisResult.sentimentAnalysis.negative / analysisResult.sentimentAnalysis.total) * 100
                      ) >= 15
                    ? "Needs Attention"
                    : "Low"}
                </Badge>
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

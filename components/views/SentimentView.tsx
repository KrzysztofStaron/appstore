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
  console.log("🎨 SentimentView rendering with data:", analysisResult.sentimentAnalysis);

  // Get the sentiment data directly from the analysis result
  const { positive, negative, neutral, total } = analysisResult.sentimentAnalysis;

  // Calculate percentages
  const positivePercent = total > 0 ? Number(((positive / total) * 100).toFixed(2)) : 0;
  const negativePercent = total > 0 ? Number(((negative / total) * 100).toFixed(2)) : 0;
  const neutralPercent = total > 0 ? Number(((neutral / total) * 100).toFixed(2)) : 0;

  const sentimentData = [
    {
      name: "Positive",
      value: positivePercent,
      color: "#10B981",
    },
    {
      name: "Neutral",
      value: neutralPercent,
      color: "#F59E0B",
    },
    {
      name: "Negative",
      value: negativePercent,
      color: "#EF4444",
    },
  ];

  console.log("📊 SentimentView calculated data:", sentimentData);

  // Validate percentages add up to 100%
  const totalPercentage = sentimentData.reduce((sum, item) => sum + item.value, 0);
  if (totalPercentage !== 100) {
    console.warn(`⚠️ SentimentView percentages don't add up to 100%: ${totalPercentage}%`);
  }

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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
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
                  {sentimentData[0].value >= 70 ? "Excellent" : sentimentData[0].value >= 50 ? "Good" : "Fair"}
                </Badge>
              </div>
              <div className="text-4xl font-bold text-green-400 mb-2">{sentimentData[0].value}%</div>
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
                  {sentimentData[1].value >= 40 ? "High" : sentimentData[1].value >= 20 ? "Balanced" : "Low"}
                </Badge>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{sentimentData[1].value}%</div>
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
                  {sentimentData[2].value >= 30 ? "Critical" : sentimentData[2].value >= 15 ? "Needs Attention" : "Low"}
                </Badge>
              </div>
              <div className="text-4xl font-bold text-red-400 mb-2">{sentimentData[2].value}%</div>
              <p className="text-sm text-zinc-400">Users expressing frustration or complaints</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

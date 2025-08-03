"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { AnalysisResult } from "@/app/types";

interface KeywordsViewProps {
  analysisResult: AnalysisResult;
}

export function KeywordsView({ analysisResult }: KeywordsViewProps) {
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
                  <span className="text-sm font-semibold text-white">{keyword.averageRating.toFixed(2)}★</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

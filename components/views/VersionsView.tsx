"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Layers } from "lucide-react";
import { AnalysisResult } from "@/app/types";

interface VersionsViewProps {
  analysisResult: AnalysisResult;
}

export function VersionsView({ analysisResult }: VersionsViewProps) {
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
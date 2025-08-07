"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Globe } from "lucide-react";
import { AnalysisResult } from "@/app/types";

interface RegionsViewProps {
  analysisResult: AnalysisResult;
}

export function RegionsView({ analysisResult }: RegionsViewProps) {
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
                  formatter={(value: any) => [typeof value === "number" ? value.toFixed(2) : value, "Average Rating"]}
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

"use client";

import { useState, useTransition } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { APP_STORE_REGIONS } from "@/lib/app-store-api";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { SentimentView } from "@/components/views/SentimentView";
import { TrendsView } from "@/components/views/TrendsView";
import { KeywordsView } from "@/components/views/KeywordsView";
import { RegionsView } from "@/components/views/RegionsView";
import { VersionsView } from "@/components/views/VersionsView";
import { TasksView } from "@/components/views/TasksView";
import { InsightsView } from "@/components/views/InsightsView";
import { AppStoreReview, AppMetadata, AnalysisResult, ViewType } from "@/app/types";

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

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        appId={appId}
        setAppId={setAppId}
        selectedRegions={selectedRegions}
        setSelectedRegions={setSelectedRegions}
        currentView={currentView}
        setCurrentView={setCurrentView}
        handleAnalyze={handleAnalyze}
        exportData={exportData}
        isPending={isPending}
        isAnalyzing={isAnalyzing}
        progress={progress}
        regionProgress={regionProgress}
        currentStage={currentStage}
        error={error}
        appMetadata={appMetadata}
        reviews={reviews}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-8">{renderMainContent()}</div>
        </ScrollArea>
      </div>
    </div>
  );
}

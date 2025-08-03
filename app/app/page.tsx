"use client";

import { useState, useTransition } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { APP_STORE_REGIONS } from "@/lib/app-store-api";
import { Sidebar } from "@/components/Sidebar";
import { AppConfigModal } from "@/components/AppConfigModal";
import { DashboardView } from "@/components/views/DashboardView";
import { SentimentView } from "@/components/views/SentimentView";
import { TrendsView } from "@/components/views/TrendsView";
import { KeywordsView } from "@/components/views/KeywordsView";
import { RegionsView } from "@/components/views/RegionsView";
import { VersionsView } from "@/components/views/VersionsView";
import { IssuesView } from "@/components/views/IssuesView";
import { TasksView } from "@/components/views/TasksView";
import { AppStoreReview, AppMetadata, AnalysisResult, ViewType } from "@/app/types";
import Link from "next/link";

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
  const [progressDetails, setProgressDetails] = useState<string>("");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

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
                  setProgressDetails(data.details || "");
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
        setProgressDetails("");
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
        <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-zinc-300" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Ready to Analyze</h3>
            <p className="text-zinc-400 mb-6">
              Configure your app settings in the sidebar and start your first analysis to unlock powerful insights.
            </p>
            <Button
              onClick={() => setIsConfigModalOpen(true)}
              className="w-full bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg"
            >
              Generate
            </Button>
          </div>
        </div>
      );
    }

    // Show loading state for all views when analyzing
    if (isAnalyzing) {
      return (
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Analyzing Data</h3>
              <p className="text-zinc-300 mb-4">{currentStage || "Processing reviews..."}</p>
              <div className="w-64 bg-zinc-800/50 border border-zinc-700/50 rounded-full h-2 mb-2 mx-auto">
                <div
                  className="bg-gradient-to-r from-zinc-600 to-zinc-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">{progress}% complete</p>
              {progressDetails && (
                <div className="mt-4 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
                  <p className="text-xs text-zinc-400">{progressDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-6">
                <div className="h-6 w-32 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-6">
                <div className="h-6 w-40 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-4 animate-pulse"></div>
                <div className="h-32 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-6">
                <div className="h-6 w-28 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-4 w-4/5 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-6">
                <div className="h-6 w-36 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-4 animate-pulse"></div>
                <div className="h-24 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView analysisResult={analysisResult} appMetadata={appMetadata} onNavigateToView={setCurrentView} />
        );
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
      case "issues":
        return <IssuesView analysisResult={analysisResult} reviews={reviews} appMetadata={appMetadata} />;
      case "tasks":
        return (
          <TasksView
            analysisResult={analysisResult}
            reviews={reviews}
            appMetadata={appMetadata}
            onAnalysisUpdate={updatedAnalysis => setAnalysisResult(updatedAnalysis)}
          />
        );
      default:
        return (
          <DashboardView analysisResult={analysisResult} appMetadata={appMetadata} onNavigateToView={setCurrentView} />
        );
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
        progressDetails={progressDetails}
        error={error}
        appMetadata={appMetadata}
        reviews={reviews}
        isConfigModalOpen={isConfigModalOpen}
        setIsConfigModalOpen={setIsConfigModalOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-8">{renderMainContent()}</div>
        </ScrollArea>
      </div>

      {/* App Configuration Modal */}
      <AppConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        appId={appId}
        setAppId={setAppId}
        selectedRegions={selectedRegions}
        setSelectedRegions={setSelectedRegions}
        handleAnalyze={handleAnalyze}
        isPending={isPending}
        isAnalyzing={isAnalyzing}
        progress={progress}
        regionProgress={regionProgress}
        currentStage={currentStage}
        progressDetails={progressDetails}
        error={error}
      />
    </div>
  );
}

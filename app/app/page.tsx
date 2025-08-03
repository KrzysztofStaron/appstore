"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, BarChart3, Download, Clock } from "lucide-react";
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
  const [appId, setAppId] = useState("");
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCachedDataModal, setShowCachedDataModal] = useState(false);
  const [cachedData, setCachedData] = useState<any>(null);

  // Create a stable dependency for regions
  const regionsKey = useMemo(() => selectedRegions.join(","), [selectedRegions]);

  // Check for cached data when appId changes
  useEffect(() => {
    const shouldCheckForCachedData = appId === "6670324846" && selectedRegions.includes("all");

    if (shouldCheckForCachedData) {
      checkForCachedData();
    } else {
      setShowCachedDataModal(false);
      setCachedData(null);
    }
  }, [appId, regionsKey]);

  const checkForCachedData = async () => {
    try {
      const response = await fetch("/6670324846.json");
      if (response.ok) {
        const data = await response.json();
        setCachedData(data);
        setShowCachedDataModal(true);
      }
    } catch (error) {
      console.log("No cached data found for this app");
    }
  };

  const loadCachedData = () => {
    if (!cachedData) return;

    setReviews(cachedData.reviews);
    setAppMetadata(cachedData.metadata.appMetadata);
    setAnalysisResult(cachedData.analysis);
    setSelectedRegions(cachedData.metadata.selectedRegions);
    setShowCachedDataModal(false);

    console.log("📂 Loaded cached data:", {
      reviewsCount: cachedData.reviews.length,
      exportDate: cachedData.metadata.exportDate,
      hasAnalysis: !!cachedData.analysis,
    });
  };

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

    // Create comprehensive export data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        appId: appId,
        totalReviews: reviews.length,
        selectedRegions: selectedRegions,
        appMetadata: appMetadata,
      },
      reviews: reviews,
      analysis: analysisResult,
    };

    // Log export data for debugging
    console.log("📤 Exporting data:", {
      reviewsCount: reviews.length,
      hasAnalysis: !!analysisResult,
      analysisKeys: analysisResult ? Object.keys(analysisResult) : [],
      appMetadata: !!appMetadata,
    });

    // Convert to JSON string with proper formatting
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Create and download the file
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviewai-export-${appId}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderMainContent = () => {
    if (!analysisResult) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
          <div className="text-center max-w-md px-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Search className="h-10 w-10 md:h-12 md:w-12 text-zinc-300" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Ready to Analyze</h3>
            <p className="text-sm md:text-base text-zinc-400 mb-4 md:mb-6">
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
        <div className="space-y-6 md:space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 md:h-8 w-36 md:w-48 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded animate-pulse"></div>
                <div className="h-3 md:h-4 w-48 md:w-64 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="flex items-center justify-center py-8 md:py-12">
            <div className="text-center max-w-md px-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-zinc-400"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Analyzing Data</h3>
              <p className="text-sm md:text-base text-zinc-300 mb-3 md:mb-4">
                {currentStage || "Processing reviews..."}
              </p>
              <div className="w-56 md:w-64 bg-zinc-800/50 border border-zinc-700/50 rounded-full h-2 mb-2 mx-auto">
                <div
                  className="bg-gradient-to-r from-zinc-600 to-zinc-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">{progress}% complete</p>
              {progressDetails && (
                <div className="mt-3 md:mt-4 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
                  <p className="text-xs text-zinc-400">{progressDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-4 md:p-6">
                <div className="h-5 md:h-6 w-24 md:w-32 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-3 md:mb-4 animate-pulse"></div>
                <div className="space-y-2 md:space-y-3">
                  <div className="h-3 md:h-4 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-3 md:h-4 w-3/4 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-3 md:h-4 w-5/6 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-4 md:p-6">
                <div className="h-5 md:h-6 w-32 md:w-40 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-3 md:mb-4 animate-pulse"></div>
                <div className="h-24 md:h-32 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-4 md:p-6">
                <div className="h-5 md:h-6 w-20 md:w-28 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-3 md:mb-4 animate-pulse"></div>
                <div className="space-y-2 md:space-y-3">
                  <div className="h-3 md:h-4 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-3 md:h-4 w-2/3 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                  <div className="h-3 md:h-4 w-4/5 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-lg p-4 md:p-6">
                <div className="h-5 md:h-6 w-28 md:w-36 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded mb-3 md:mb-4 animate-pulse"></div>
                <div className="h-20 md:h-24 w-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 rounded animate-pulse"></div>
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
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-zinc-300" />
            </div>
            <span className="text-lg font-bold text-white">ReviewAI</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-gradient-to-r from-slate-800/50 to-zinc-900/30 border border-slate-600/50 text-slate-200"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out`}
      >
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
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-8 pt-20 md:pt-8">{renderMainContent()}</div>
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

      {/* Cached Data Modal */}
      {showCachedDataModal && cachedData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900/95 to-black/95 border border-zinc-800/50 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cached Data Available</h2>
                <p className="text-sm text-zinc-400">Load previously analyzed data for Grok (X AI)</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-300">Export Date:</span>
                  <span className="text-sm text-zinc-400">
                    {new Date(cachedData.metadata.exportDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-300">Reviews:</span>
                  <span className="text-sm text-zinc-400">{cachedData.metadata.totalReviews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Regions:</span>
                  <span className="text-sm text-zinc-400">
                    {cachedData.metadata.selectedRegions.includes("all")
                      ? "All (175)"
                      : cachedData.metadata.selectedRegions.length}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Note</span>
                </div>
                <p className="text-xs text-white">
                  This data was exported on {new Date(cachedData.metadata.exportDate).toLocaleDateString()}. It may be
                  outdated. For fresh data, run a new analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={loadCachedData}
                className="flex-1 bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Load Cached Data
              </Button>
              <Button
                onClick={() => setShowCachedDataModal(false)}
                variant="outline"
                className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

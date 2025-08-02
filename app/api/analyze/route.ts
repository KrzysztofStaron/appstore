import { NextRequest, NextResponse } from "next/server";
import { ReviewAnalyzer } from "@/lib/analysis";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache";
import { benchmark } from "@/lib/benchmark";

export async function POST(request: NextRequest) {
  const { reviews, metadata } = await request.json();

  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json({ error: "No reviews provided for analysis" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Check cache first
        const appId = reviews[0]?.id?.split("-")[0] || "unknown";
        const regions = [...new Set(reviews.map((r: any) => r.region))];

        sendProgress({
          stage: "Checking analysis cache...",
          percentage: 5,
        });

        const cachedAnalysis = await getCachedAnalysis(appId, regions);

        if (cachedAnalysis) {
          sendProgress({
            stage: "Using cached analysis",
            percentage: 100,
          });

          sendProgress({
            type: "complete",
            analysis: cachedAnalysis,
          });

          controller.close();
          return;
        }

        sendProgress({
          stage: "Initializing analyzer...",
          percentage: 10,
        });

        const analyzer = new ReviewAnalyzer(reviews, metadata);

        sendProgress({
          stage: "Generating basic statistics...",
          percentage: 20,
        });

        const basicStats = analyzer.getBasicStats();

        sendProgress({
          stage: "Analyzing sentiment...",
          percentage: 30,
        });

        const sentimentAnalysis = analyzer.getSentimentAnalysis();

        sendProgress({
          stage: "Generating trend data...",
          percentage: 40,
        });

        const trendData = analyzer.getTrendAnalysis();

        sendProgress({
          stage: "Analyzing versions...",
          percentage: 50,
        });

        const versionAnalysis = analyzer.getVersionAnalysis();

        sendProgress({
          stage: "Analyzing regions...",
          percentage: 60,
        });

        const regionalAnalysis = analyzer.getRegionalAnalysis();

        sendProgress({
          stage: "Extracting keywords...",
          percentage: 70,
        });

        const keywordAnalysis = analyzer.getKeywordAnalysis();

        sendProgress({
          stage: "Finding top reviews...",
          percentage: 80,
        });

        const topReviews = analyzer.getTopReviews(3);

        sendProgress({
          stage: "Filtering reviews...",
          percentage: 90,
        });

        const filteredAnalysis = await analyzer.filterReviews(true);

        sendProgress({
          stage: "Calculating dynamic metrics...",
          percentage: 85,
        });

        const dynamicMetrics = analyzer.getDynamicMetrics();

        sendProgress({
          stage: "Generating actionable steps...",
          percentage: 90,
        });

        const actionableSteps = await analyzer.generateActionableSteps();

        sendProgress({
          stage: "Caching results...",
          percentage: 98,
        });

        const analysis = {
          basicStats,
          sentimentAnalysis,
          trendData,
          versionAnalysis,
          regionalAnalysis,
          keywordAnalysis,
          topReviews,
          filteredAnalysis,
          actionableSteps,
          dynamicMetrics,
        };

        // Cache analysis
        setCachedAnalysis(appId, regions, analysis);

        sendProgress({
          stage: "Analysis complete!",
          percentage: 100,
        });

        // Send final result
        sendProgress({
          type: "complete",
          analysis,
        });

        controller.close();
      } catch (error) {
        console.error("Analysis streaming error:", error);
        sendProgress({
          type: "error",
          error: "Analysis failed: " + (error instanceof Error ? error.message : String(error)),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { appStoreAPI } from "@/lib/app-store-api";
import { getCachedReviews, getCachedMetadata, setCachedMetadata, setCachedReviews } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const { appId, regions } = await request.json();

  if (!appId || !regions || !Array.isArray(regions)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Send initial progress
        sendProgress({
          current: 0,
          total: regions.length,
          stage: "Starting analysis...",
          percentage: 0,
        });

        // Check cache first
        sendProgress({
          current: 0,
          total: regions.length,
          stage: "Checking cache...",
          percentage: 5,
        });

        const cachedReviews = await getCachedReviews(appId, regions);
        const cachedMetadata = await getCachedMetadata(appId);

        if (cachedReviews && cachedMetadata) {
          sendProgress({
            current: regions.length,
            total: regions.length,
            stage: "Using cached data",
            percentage: 100,
          });

          sendProgress({
            type: "complete",
            reviews: cachedReviews,
            metadata: cachedMetadata,
          });

          controller.close();
          return;
        }

        // Fetch app metadata
        sendProgress({
          current: 0,
          total: regions.length,
          stage: "Fetching app metadata...",
          percentage: 10,
        });

        const metadata = await appStoreAPI.fetchAppMetadata(appId);

        if (!metadata) {
          sendProgress({
            type: "error",
            error: "App not found. Please check the App Store ID.",
          });
          controller.close();
          return;
        }

        // Cache metadata
        setCachedMetadata(appId, metadata);

        // Fetch reviews from all selected regions
        const allReviews: any[] = [];

        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];

          sendProgress({
            current: i,
            total: regions.length,
            stage: `Fetching reviews from ${region.toUpperCase()}...`,
            percentage: Math.round(10 + (i / regions.length) * 80),
          });

          try {
            const regionReviews = await appStoreAPI.fetchReviews(appId, [region], 3);
            allReviews.push(...regionReviews);

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error fetching reviews for region ${region}:`, error);
            // Continue with other regions even if one fails
          }
        }

        sendProgress({
          current: regions.length,
          total: regions.length,
          stage: "Caching results...",
          percentage: 95,
        });

        // Cache reviews
        setCachedReviews(appId, regions, allReviews);

        sendProgress({
          current: regions.length,
          total: regions.length,
          stage: "Analysis complete!",
          percentage: 100,
        });

        // Send final result
        sendProgress({
          type: "complete",
          reviews: allReviews,
          metadata,
        });

        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        sendProgress({
          type: "error",
          error: "An unexpected error occurred. Please try again.",
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

import { NextRequest, NextResponse } from "next/server";
import { reviewCategorizer } from "@/lib/review-categorization";
import { AppStoreReview } from "@/app/types";

export async function POST(request: NextRequest) {
  try {
    const { reviews } = await request.json();

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: "No reviews provided for categorization" }, { status: 400 });
    }

    // Validate review structure
    const validReviews = reviews.filter(
      (review: any) =>
        review &&
        typeof review.id === "string" &&
        typeof review.title === "string" &&
        typeof review.content === "string" &&
        typeof review.rating === "number"
    );

    if (validReviews.length === 0) {
      return NextResponse.json({ error: "No valid reviews provided" }, { status: 400 });
    }

    console.log(`📥 Received categorization request for ${validReviews.length} reviews`);

    // Create a streaming response for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendProgress({
            stage: "Initializing categorization...",
            percentage: 5,
            totalReviews: validReviews.length,
          });

          // Filter to negative reviews for categorization
          const negativeReviews = validReviews.filter((review: AppStoreReview) => review.rating <= 3);

          let reviewForAI = negativeReviews.filter(review => {
            if (review.rating > 3) return false;

            const combinedText = `${review.title} ${review.content}`.trim();

            // Check minimum length (60 characters)
            if (combinedText.length < 60) return false;

            // Check minimum word count (4 words)
            const wordCount = combinedText.split("").length;
            if (wordCount < 4) return false;

            return true;
          });

          // fallback to negativeReviews if reviewForAI is less than 2
          if (reviewForAI.length === 0) {
            reviewForAI = negativeReviews;
          }

          if (negativeReviews.length === 0) {
            sendProgress({
              stage: "No negative reviews to categorize",
              percentage: 100,
            });

            sendProgress({
              type: "complete",
              result: {
                categories: [],
                processingTime: 0,
                errors: ["No negative reviews found"],
                totalReviews: validReviews.length,
                categorizedReviews: 0,
              },
            });

            controller.close();
            return;
          }

          sendProgress({
            stage: `Found ${negativeReviews.length} negative reviews to categorize...`,
            percentage: 10,
            negativeReviews: negativeReviews.length,
          });

          // Calculate batch progress
          const batchSize = 10;
          const totalBatches = Math.ceil(negativeReviews.length / batchSize);

          sendProgress({
            stage: `Starting LLM categorization (${totalBatches} batches)...`,
            percentage: 15,
            totalBatches,
          });

          // Try LLM categorization first with streaming progress
          try {
            const result = await reviewCategorizer.categorizeReviews(reviewForAI, progressData => {
              // Forward progress from the categorizer to the client
              sendProgress({
                stage: progressData.stage,
                percentage: progressData.percentage,
                currentBatch: progressData.currentBatch,
                totalBatches: progressData.totalBatches,
                categorizedReviews: progressData.categorizedSoFar,
                totalReviews: progressData.totalReviews,
              });
            });

            sendProgress({
              stage: "Categorization complete!",
              percentage: 100,
              categorizedReviews: result.categories.length,
              totalReviews: validReviews.length,
            });

            // Send final result
            sendProgress({
              type: "complete",
              result: {
                ...result,
                totalReviews: validReviews.length,
                categorizedReviews: result.categories.length,
                method: "llm",
              },
            });
          } catch (llmError) {
            console.error("❌ LLM categorization failed, falling back to keywords:", llmError);

            sendProgress({
              stage: "LLM failed, using keyword fallback...",
              percentage: 50,
              error: llmError instanceof Error ? llmError.message : String(llmError),
            });

            // Fallback to keyword-based categorization
            const startTime = Date.now();
            const keywordCategories = reviewCategorizer.categorizeWithKeywords(negativeReviews);
            const processingTime = Date.now() - startTime;

            sendProgress({
              stage: "Keyword categorization completed",
              percentage: 90,
              categorized: keywordCategories.length,
            });

            sendProgress({
              stage: "Categorization complete (fallback method)!",
              percentage: 100,
            });

            // Send fallback result
            sendProgress({
              type: "complete",
              result: {
                categories: keywordCategories,
                processingTime,
                errors: [
                  `LLM categorization failed: ${llmError instanceof Error ? llmError.message : String(llmError)}`,
                ],
                totalReviews: validReviews.length,
                categorizedReviews: keywordCategories.length,
                method: "keyword_fallback",
              },
            });
          }

          controller.close();
        } catch (error) {
          console.error("❌ Categorization streaming error:", error);
          sendProgress({
            type: "error",
            error: "Categorization failed: " + (error instanceof Error ? error.message : String(error)),
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
  } catch (error) {
    console.error("❌ Categorization API error:", error);
    return NextResponse.json(
      {
        error: "Failed to categorize reviews",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

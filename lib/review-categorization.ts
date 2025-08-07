import OpenAI from "openai";
import { AppStoreReview } from "@/app/types";
import { getConfig } from "./config";

export interface CategoryResult {
  reviewId: string;
  category: "crashes_errors" | "feature_requests" | "performance" | "ui_ux" | "bugs_issues" | "other";
  confidence: number;
  reasoning?: string;
}

export interface BatchCategorizationResult {
  categories: CategoryResult[];
  processingTime: number;
  errors: string[];
}

export class ReviewCategorizer {
  private openai: OpenAI;
  private config = getConfig();
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENROUTER_API_KEY,
      baseURL: this.config.api.baseURL,
    });
  }

  private async retryRequest<T>(requestFn: () => Promise<T>, retries: number = this.maxRetries): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (error?.response?.status) {
      const status = error.response.status;
      return status === 429 || status >= 500 || status === 503;
    }
    return error?.message?.includes("network") || error?.message?.includes("timeout");
  }

  private createCategorizationPrompt(reviews: AppStoreReview[]): string {
    const reviewsText = reviews
      .map((review, index) => {
        const combinedText = `${review.title}. ${review.content}`.trim();
        return `Review ${index + 1} (ID: ${review.id}): "${combinedText}" [Rating: ${review.rating}/5]`;
      })
      .join("\n\n");

    return `You are an expert app review categorization system. Categorize the following negative app store reviews into specific issue categories.

Here are the reviews to categorize:

${reviewsText}

Available categories:
- "crashes_errors": App crashes, freezes, fatal errors, application not responding
- "feature_requests": Missing functionality, new feature requests, enhancement suggestions
- "performance": Slow loading, lag, speed issues, RAM problems, battery drain, performance issues
- "ui_ux": User interface problems, design issues, confusing navigation, usability problems
- "bugs_issues": Non-fatal bugs, glitches, minor technical issues, broken features
- "other": General complaints that don't fit other categories ( use only if you must )

For each review, determine:
1. The most appropriate category based on the main complaint
2. Confidence level (0.0 to 1.0) in your categorization
3. Brief reasoning for the categorization

Respond ONLY with a JSON array in this exact format:
[
  {
    "reviewId": "review_id_here",
    "category": "crashes_errors",
    "confidence": 0.95,
    "reasoning": "User reports app crashing repeatedly"
  },
  {
    "reviewId": "review_id_here", 
    "category": "performance",
    "confidence": 0.80,
    "reasoning": "Complaints about slow loading times"
  }
]

Do not include any other text or explanation. The array must contain exactly ${reviews.length} entries matching the review IDs provided.`;
  }

  private parseCategorizationResponse(response: string, expectedCount: number): CategoryResult[] {
    try {
      console.log("🔍 Parsing categorization response:", response);

      // Clean the response to extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("📝 Parsed JSON:", parsed);

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      if (parsed.length !== expectedCount) {
        console.warn(`⚠️ Expected ${expectedCount} categories, got ${parsed.length}`);
      }

      // Validate each category result
      const validCategories = ["crashes_errors", "feature_requests", "performance", "ui_ux", "bugs_issues", "other"];
      const results: CategoryResult[] = [];

      for (const item of parsed) {
        if (
          typeof item.reviewId !== "string" ||
          typeof item.category !== "string" ||
          typeof item.confidence !== "number" ||
          !validCategories.includes(item.category)
        ) {
          console.warn("⚠️ Invalid category result:", item);
          continue;
        }

        results.push({
          reviewId: item.reviewId,
          category: item.category as CategoryResult["category"],
          confidence: Math.max(0, Math.min(1, item.confidence)), // Clamp to 0-1
          reasoning: item.reasoning || "No reasoning provided",
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Failed to parse categorization response:", error);
      throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async categorizeBatch(reviews: AppStoreReview[]): Promise<CategoryResult[]> {
    if (reviews.length === 0) {
      return [];
    }

    // Remove the 10-review batch limit; allow any batch size
    console.log(`🏷️ Categorizing ${reviews.length} reviews in a single request...`);

    const prompt = this.createCategorizationPrompt(reviews);

    try {
      const response = await this.retryRequest(async () => {
        return await this.openai.chat.completions.create({
          model: this.config.api.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: this.config.api.maxTokens * 2 * Math.max(1, Math.ceil(reviews.length / 10)), // scale tokens with batch size
          temperature: this.config.api.temperature,
          response_format: { type: "json_object" },
        });
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in LLM response");
      }

      const categories = this.parseCategorizationResponse(content, reviews.length);

      console.log(`✅ Successfully categorized ${categories.length} reviews`);
      return categories;
    } catch (error) {
      console.error("❌ LLM categorization failed:", error);
      throw error;
    }
  }

  async categorizeReviews(reviews: AppStoreReview[]): Promise<BatchCategorizationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const allCategories: CategoryResult[] = [];

    if (reviews.length === 0) {
      return {
        categories: [],
        processingTime: Date.now() - startTime,
        errors: ["No negative reviews to categorize"],
      };
    }

    console.log(`🚀 Starting categorization of ${reviews.length} negative reviews...`);

    // Process in batches of 10
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < reviews.length; i += batchSize) {
      batches.push(reviews.slice(i, i + batchSize));
    }

    console.log(`📦 Processing ${batches.length} batches...`);

    // Process batches with rate limiting
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        console.log(`📊 Processing batch ${i + 1}/${batches.length} (${batch.length} reviews)...`);

        const batchCategories = await this.categorizeBatch(batch);
        allCategories.push(...batchCategories);
      } catch (error) {
        const errorMsg = `Batch ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);

        // Continue with other batches even if one fails
        continue;
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(`🎉 Categorization completed in ${processingTime}ms`);
    console.log(`📊 Results: ${allCategories.length} categorized, ${errors.length} errors`);

    return {
      categories: allCategories,
      processingTime,
      errors,
    };
  }

  // Fallback categorization using keywords (when LLM fails)
  categorizeWithKeywords(reviews: AppStoreReview[]): CategoryResult[] {
    const categoryKeywords = {
      crashes_errors: [
        "crash",
        "crashes",
        "crashed",
        "freeze",
        "freezes",
        "fatal error",
        "not responding",
        "force close",
      ],
      feature_requests: [
        "feature",
        "missing",
        "need",
        "want",
        "should have",
        "request",
        "add",
        "enhancement",
        "suggestion",
      ],
      performance: ["slow", "lag", "loading", "performance", "speed", "battery", "memory", "hang", "stutter"],
      ui_ux: [
        "interface",
        "design",
        "layout",
        "confusing",
        "difficult",
        "hard to use",
        "unintuitive",
        "ugly",
        "navigation",
      ],
      bugs_issues: ["bug", "glitch", "error", "broken", "stuck", "not working", "fails", "issue", "problem"],
    };

    return reviews
      .filter(review => review.rating <= 2)
      .map(review => {
        const reviewText = `${review.title} ${review.content}`.toLowerCase();

        // Find best matching category
        let bestCategory: CategoryResult["category"] = "other";
        let bestScore = 0;

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          const score = keywords.reduce((count, keyword) => {
            return count + (reviewText.includes(keyword) ? 1 : 0);
          }, 0);

          if (score > bestScore) {
            bestScore = score;
            bestCategory = category as CategoryResult["category"];
          }
        }

        return {
          reviewId: review.id,
          category: bestCategory,
          confidence: bestScore > 0 ? 0.6 : 0.3, // Lower confidence for keyword matching
          reasoning: `Keyword-based categorization (${bestScore} matches)`,
        };
      });
  }
}

// Export singleton instance
export const reviewCategorizer = new ReviewCategorizer();

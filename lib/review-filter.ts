import OpenAI from "openai";
import { benchmark } from "./benchmark";
import { getConfig, type AppStoreAnalyzerConfig } from "./config";

export interface ReviewFilterResult {
  isInformative: boolean;
  confidence: number;
  reason: string;
  category?: "bug" | "feature" | "performance" | "ui" | "general" | "non-informative";
}

export class ReviewFilter {
  private openai: OpenAI;
  private config: AppStoreAnalyzerConfig;

  constructor(apiKey?: string, config?: AppStoreAnalyzerConfig) {
    this.config = config || getConfig();

    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENROUTER_API_KEY,
      baseURL: this.config.api.baseURL,
      timeout: this.config.llm.timeout,
    });
  }

  // Helper function to delay execution
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to check if error is retryable
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    // Network errors
    if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET" || error.code === "ENOTFOUND") {
      return true;
    }

    // HTTP errors
    if (
      error.status === 429 ||
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    ) {
      return true;
    }

    // OpenAI API errors
    if (error.type === "system" || error.type === "server_error") {
      return true;
    }

    return false;
  }

  async filterReview(review: { title: string; content: string }): Promise<ReviewFilterResult> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.llm.retryAttempts; attempt++) {
      try {
        // Add rate limiting delay
        if (attempt > 1) {
          await this.delay(this.config.llm.rateLimitDelay * attempt); // Exponential backoff
        }

        const prompt = `Analyze this app store review and determine if it provides actionable information for developers.

Review Title: "${review.title}"
Review Content: "${review.content}"

Please classify this review as either informative or non-informative based on the following criteria:

INFORMATIVE reviews contain:
- Specific bugs or issues with details
- Feature requests or suggestions
- Performance problems (slow, crashes, freezes)
- UI/UX feedback with specifics
- Detailed user experience feedback
- Technical problems with context

NON-INFORMATIVE reviews contain:
- Generic praise without details ("love it", "great app", "awesome")
- Generic complaints without specifics ("hate it", "terrible", "worst app")
- Spam or irrelevant content
- Very short responses with no context
- Emotional reactions without actionable feedback

Respond with a JSON object in this exact format:
{
  "isInformative": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "category": "bug|feature|performance|ui|general|non-informative"
}

Categories:
- bug: Reports specific bugs or technical issues
- feature: Requests new features or improvements
- performance: Performance-related issues
- ui: UI/UX feedback
- general: General feedback that's informative but doesn't fit other categories
- non-informative: Generic praise/complaints without actionable details`;

        const response = await this.openai.chat.completions.create({
          model: this.config.api.model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that analyzes app store reviews to determine if they provide actionable information for developers. Always respond with valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: this.config.api.temperature,
          max_tokens: this.config.api.maxTokens,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return {
          isInformative: result.isInformative || false,
          confidence: result.confidence || 0.5,
          reason: result.reason || "Unable to analyze",
          category: result.category || "non-informative",
        };
      } catch (error: any) {
        lastError = error;
        console.warn(
          `Attempt ${attempt}/${this.config.llm.retryAttempts} failed for review filtering:`,
          error.message || error
        );

        // If it's not a retryable error, break immediately
        if (!this.isRetryableError(error)) {
          break;
        }

        // If this is the last attempt, don't wait
        if (attempt < this.config.llm.retryAttempts) {
          await this.delay(this.config.llm.retryDelay * attempt);
        }
      }
    }

    console.error("All retry attempts failed for review filtering:", lastError);

    // Fallback: consider reviews with more content as potentially informative
    const totalLength = (review.title + review.content).length;
    const isInformative = totalLength > 20;

    return {
      isInformative,
      confidence: 0.5,
      reason: "Fallback analysis due to API error",
      category: isInformative ? "general" : "non-informative",
    };
  }

  async filterReviews(reviews: Array<{ title: string; content: string }>): Promise<{
    informative: Array<{ review: any; filterResult: ReviewFilterResult }>;
    nonInformative: Array<{ review: any; filterResult: ReviewFilterResult }>;
  }> {
    const batchSize = this.config.llm.batchSize;
    const maxConcurrentBatches = this.config.llm.maxConcurrentBatches;

    return benchmark.measure(
      "filterReviews_llm_parallel",
      async () => {
        const results = {
          informative: [] as Array<{ review: any; filterResult: ReviewFilterResult }>,
          nonInformative: [] as Array<{ review: any; filterResult: ReviewFilterResult }>,
        };

        // Process reviews in smaller batches with controlled concurrency
        const batches = [];
        for (let i = 0; i < reviews.length; i += batchSize) {
          const batch = reviews.slice(i, i + batchSize);
          batches.push(batch);
        }

        // Process batches with controlled concurrency
        for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
          const currentBatches = batches.slice(i, i + maxConcurrentBatches);

          const batchPromises = currentBatches.map(async (batch, batchIndex) => {
            const batchResults = await Promise.allSettled(
              batch.map(async review => {
                try {
                  const filterResult = await this.filterReview(review);
                  return { review, filterResult };
                } catch (error: any) {
                  console.error("Individual review filtering failed:", error);
                  // Return a fallback result for this review
                  const totalLength = (review.title + review.content).length;
                  const isInformative = totalLength > 20;
                  return {
                    review,
                    filterResult: {
                      isInformative,
                      confidence: 0.5,
                      reason: "Fallback due to individual error",
                      category: isInformative ? "general" : "non-informative",
                    },
                  };
                }
              })
            );

            // Extract successful results
            return batchResults
              .filter(result => result.status === "fulfilled")
              .map(result => (result as PromiseFulfilledResult<any>).value);
          });

          const batchResults = await Promise.all(batchPromises);

          // Flatten and categorize results
          batchResults.flat().forEach(({ review, filterResult }) => {
            if (filterResult.isInformative) {
              results.informative.push({ review, filterResult });
            } else {
              results.nonInformative.push({ review, filterResult });
            }
          });

          // Add delay between batch groups to prevent rate limiting
          if (i + maxConcurrentBatches < batches.length) {
            await this.delay(1000); // 1 second delay between batch groups
          }
        }

        return results;
      },
      {
        totalReviews: reviews.length,
        batchSize,
        maxConcurrentBatches,
        totalBatches: Math.ceil(reviews.length / batchSize),
      }
    );
  }

  // Simple heuristic-based filtering as fallback
  filterReviewsHeuristic(reviews: Array<{ title: string; content: string }>): {
    informative: Array<{ review: any; filterResult: ReviewFilterResult }>;
    nonInformative: Array<{ review: any; filterResult: ReviewFilterResult }>;
  } {
    return benchmark.measureSync(
      "filterReviewsHeuristic",
      () => {
        const results = {
          informative: [] as Array<{ review: any; filterResult: ReviewFilterResult }>,
          nonInformative: [] as Array<{ review: any; filterResult: ReviewFilterResult }>,
        };

        const nonInformativePatterns = [
          /^(love|hate|great|awesome|terrible|worst|best|amazing|perfect|bad|good|nice|cool|ok|okay)$/i,
          /^(love it|hate it|great app|awesome app|terrible app|worst app|best app|amazing app|perfect app|bad app|good app|nice app|cool app)$/i,
          /^(thanks|thank you|thx|ty)$/i,
          /^(please|pls|plz)$/i,
          /^(update|updates)$/i,
          /^(fix|fixed|fixes)$/i,
          /^(work|works|working)$/i,
          /^(don't work|doesn't work|not working)$/i,
        ];

        const informativePatterns = [
          /(bug|crash|error|problem|issue|broken|fail|failed|failure)/i,
          /(slow|lag|freeze|frozen|unresponsive|performance)/i,
          /(feature|request|suggestion|improvement|enhancement)/i,
          /(interface|ui|ux|design|layout|user experience)/i,
          /(update|version|release|new version)/i,
          /(because|since|when|while|after|before)/i,
          /(specific|detailed|particular|exact)/i,
        ];

        reviews.forEach(review => {
          const text = `${review.title} ${review.content}`.toLowerCase();
          const totalLength = text.length;

          // Check for non-informative patterns
          const hasNonInformativePattern = nonInformativePatterns.some(
            pattern => pattern.test(text) && totalLength < 50
          );

          // Check for informative patterns
          const hasInformativePattern = informativePatterns.some(pattern => pattern.test(text));

          // Determine if informative
          const isInformative =
            !hasNonInformativePattern &&
            (hasInformativePattern ||
              totalLength > 30 ||
              text.includes("because") ||
              text.includes("when") ||
              text.includes("after"));

          const filterResult: ReviewFilterResult = {
            isInformative,
            confidence: 0.7,
            reason: hasNonInformativePattern
              ? "Generic feedback detected"
              : hasInformativePattern
              ? "Specific feedback detected"
              : totalLength > 30
              ? "Sufficient detail"
              : "Insufficient detail",
            category: hasNonInformativePattern ? "non-informative" : "general",
          };

          if (isInformative) {
            results.informative.push({ review, filterResult });
          } else {
            results.nonInformative.push({ review, filterResult });
          }
        });

        return results;
      },
      { totalReviews: reviews.length }
    );
  }
}

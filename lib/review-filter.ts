import OpenAI from "openai";
import { benchmark } from "./benchmark";

export interface ReviewFilterResult {
  isInformative: boolean;
  confidence: number;
  reason: string;
  category?: "bug" | "feature" | "performance" | "ui" | "general" | "non-informative";
}

export class ReviewFilter {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  async filterReview(review: { title: string; content: string }): Promise<ReviewFilterResult> {
    try {
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
        model: "mistralai/ministral-3b",
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
        temperature: 0.1,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        isInformative: result.isInformative || false,
        confidence: result.confidence || 0.5,
        reason: result.reason || "Unable to analyze",
        category: result.category || "non-informative",
      };
    } catch (error) {
      console.error("Error filtering review:", error);
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
  }

  async filterReviews(reviews: Array<{ title: string; content: string }>): Promise<{
    informative: Array<{ review: any; filterResult: ReviewFilterResult }>;
    nonInformative: Array<{ review: any; filterResult: ReviewFilterResult }>;
  }> {
    const batchSize = 20; // Increased batch size for better parallelism

    return benchmark.measure(
      "filterReviews_llm_parallel",
      async () => {
        const results = {
          informative: [] as Array<{ review: any; filterResult: ReviewFilterResult }>,
          nonInformative: [] as Array<{ review: any; filterResult: ReviewFilterResult }>,
        };

        // Process reviews in parallel batches
        const batches = [];

        for (let i = 0; i < reviews.length; i += batchSize) {
          const batch = reviews.slice(i, i + batchSize);
          batches.push(batch);
        }

        // Process all batches in parallel
        const batchPromises = batches.map(async (batch, batchIndex) => {
          const batchResults = await Promise.all(
            batch.map(async review => {
              const filterResult = await this.filterReview(review);
              return { review, filterResult };
            })
          );
          return batchResults;
        });

        const allBatchResults = await Promise.all(batchPromises);

        // Flatten and categorize results
        allBatchResults.flat().forEach(({ review, filterResult }) => {
          if (filterResult.isInformative) {
            results.informative.push({ review, filterResult });
          } else {
            results.nonInformative.push({ review, filterResult });
          }
        });

        return results;
      },
      { totalReviews: reviews.length, batchSize, totalBatches: Math.ceil(reviews.length / batchSize) }
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

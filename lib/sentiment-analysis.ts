import { HfInference } from "@huggingface/inference";

export interface SentimentResult {
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  score: number;
  reviewId: string;
}

export interface BatchSentimentResult {
  results: SentimentResult[];
  totalProcessed: number;
  errors: number;
}

class SentimentAnalyzer {
  private hf: HfInference;
  private model = "cardiffnlp/twitter-roberta-base-sentiment-latest";
  private batchSize = 10;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(apiKey?: string) {
    this.hf = new HfInference(apiKey);
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
    // Retry on rate limits, network errors, and temporary server errors
    if (error?.response?.status) {
      const status = error.response.status;
      return status === 429 || status >= 500 || status === 503;
    }
    return error?.message?.includes("network") || error?.message?.includes("timeout");
  }

  private async analyzeSingleText(text: string): Promise<{ label: string; score: number }> {
    try {
      const result = await this.retryRequest(() =>
        this.hf.textClassification({
          model: this.model,
          inputs: text,
        })
      );

      // The model returns labels like 'LABEL_0', 'LABEL_1', 'LABEL_2'
      // We need to map these to our sentiment labels
      const labelMap: { [key: string]: "POSITIVE" | "NEGATIVE" | "NEUTRAL" } = {
        LABEL_0: "NEGATIVE",
        LABEL_1: "NEUTRAL",
        LABEL_2: "POSITIVE",
      };

      const topResult = Array.isArray(result) ? result[0] : result;
      return {
        label: labelMap[topResult.label] || "NEUTRAL",
        score: topResult.score,
      };
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      // Fallback to neutral sentiment
      return { label: "NEUTRAL", score: 0.5 };
    }
  }

  private async analyzeBatch(texts: string[]): Promise<Array<{ label: string; score: number }>> {
    try {
      const results = await this.retryRequest(() =>
        this.hf.textClassification({
          model: this.model,
          inputs: texts,
        })
      );

      const labelMap: { [key: string]: "POSITIVE" | "NEGATIVE" | "NEUTRAL" } = {
        LABEL_0: "NEGATIVE",
        LABEL_1: "NEUTRAL",
        LABEL_2: "POSITIVE",
      };

      return (Array.isArray(results) ? results : [results]).map(result => {
        const topResult = Array.isArray(result) ? result[0] : result;
        return {
          label: labelMap[topResult.label] || "NEUTRAL",
          score: topResult.score,
        };
      });
    } catch (error) {
      console.error("Batch sentiment analysis error:", error);
      // Return neutral sentiments for all texts in case of error
      return texts.map(() => ({ label: "NEUTRAL", score: 0.5 }));
    }
  }

  async analyzeReviews(reviews: Array<{ id: string; content: string; title: string }>): Promise<BatchSentimentResult> {
    const results: SentimentResult[] = [];
    let errors = 0;
    let totalProcessed = 0;

    // Process reviews in batches
    for (let i = 0; i < reviews.length; i += this.batchSize) {
      const batch = reviews.slice(i, i + this.batchSize);

      try {
        // Combine title and content for better analysis
        const texts = batch.map(review => {
          const combinedText = `${review.title}. ${review.content}`.trim();
          // Limit text length to avoid API limits
          return combinedText.length > 500 ? combinedText.substring(0, 500) + "..." : combinedText;
        });

        const sentimentResults = await this.analyzeBatch(texts);

        batch.forEach((review, index) => {
          const sentiment = sentimentResults[index];
          if (sentiment) {
            results.push({
              reviewId: review.id,
              label: sentiment.label as "POSITIVE" | "NEGATIVE" | "NEUTRAL",
              score: sentiment.score,
            });
            totalProcessed++;
          } else {
            errors++;
          }
        });

        // Add delay between batches to respect rate limits
        if (i + this.batchSize < reviews.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error processing batch ${i / this.batchSize + 1}:`, error);
        errors += batch.length;
      }
    }

    return {
      results,
      totalProcessed,
      errors,
    };
  }

  async analyzeSingleReview(review: { id: string; content: string; title: string }): Promise<SentimentResult> {
    const combinedText = `${review.title}. ${review.content}`.trim();
    const text = combinedText.length > 500 ? combinedText.substring(0, 500) + "..." : combinedText;

    const result = await this.analyzeSingleText(text);

    return {
      reviewId: review.id,
      label: result.label as "POSITIVE" | "NEGATIVE" | "NEUTRAL",
      score: result.score,
    };
  }
}

// Create singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer(process.env.HUGGINGFACE_API_KEY);

// Fallback sentiment analysis based on keywords (when API is not available)
export function analyzeSentimentFallback(text: string): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "great",
    "good",
    "excellent",
    "amazing",
    "awesome",
    "love",
    "perfect",
    "best",
    "wonderful",
    "fantastic",
    "outstanding",
    "brilliant",
    "superb",
    "incredible",
    "fabulous",
    "terrific",
    "satisfied",
    "happy",
    "pleased",
    "impressed",
    "recommend",
    "worth",
    "useful",
    "helpful",
  ];

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "worst",
    "hate",
    "disappointed",
    "frustrated",
    "annoying",
    "useless",
    "waste",
    "broken",
    "crash",
    "bug",
    "error",
    "slow",
    "lag",
    "freeze",
    "problem",
    "issue",
    "difficult",
    "confusing",
    "hard",
    "poor",
    "unusable",
  ];

  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return "POSITIVE";
  if (negativeCount > positiveCount) return "NEGATIVE";
  return "NEUTRAL";
}

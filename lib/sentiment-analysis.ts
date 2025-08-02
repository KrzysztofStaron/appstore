import OpenAI from "openai";

export interface SentimentResult {
  positive: number;
  negative: number;
  neutral: number;
}

class SentimentAnalyzer {
  private openai: OpenAI;
  private model = "meta-llama/llama-4-scout";
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
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
    // Retry on rate limits, network errors, and temporary server errors
    if (error?.response?.status) {
      const status = error.response.status;
      return status === 429 || status >= 500 || status === 503;
    }
    return error?.message?.includes("network") || error?.message?.includes("timeout");
  }

  private createSentimentPrompt(reviews: Array<{ id: string; content: string; title: string }>): string {
    const reviewsText = reviews
      .map((review, index) => {
        const combinedText = `${review.title}. ${review.content}`.trim();
        return `Review ${index + 1}: "${combinedText}"`;
      })
      .join("\n\n");

    return `You are an expert sentiment analysis system. Analyze the following app store reviews and determine the overall sentiment distribution as percentages.

Here are the reviews to analyze:

${reviewsText}

Based on these reviews, provide the sentiment distribution as percentages. Consider:
- POSITIVE: Users expressing satisfaction, praise, recommendation, or positive emotions
- NEGATIVE: Users expressing dissatisfaction, complaints, frustration, or negative emotions  
- NEUTRAL: Users providing factual information without clear positive or negative sentiment

Respond ONLY with a JSON object in this exact format:
{
  "positive": 65,
  "negative": 25,
  "neutral": 10
}

The percentages must add up to 100. Do not include any other text or explanation.`;
  }

  private parseLlamaResponse(response: string): SentimentResult {
    try {
      console.log("🔍 Parsing Llama response:", response);

      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("📝 Parsed JSON:", parsed);

      // Validate the response has the required fields
      if (
        typeof parsed.positive !== "number" ||
        typeof parsed.negative !== "number" ||
        typeof parsed.neutral !== "number"
      ) {
        throw new Error("Response missing required percentage fields");
      }

      // Ensure percentages add up to 100
      const total = parsed.positive + parsed.negative + parsed.neutral;
      if (Math.abs(total - 100) > 1) {
        // Allow 1% tolerance for rounding
        console.warn(`⚠️ Percentages don't add up to 100: ${total}%, normalizing...`);
        const factor = 100 / total;
        parsed.positive = Math.round(parsed.positive * factor);
        parsed.negative = Math.round(parsed.negative * factor);
        parsed.neutral = Math.round(parsed.neutral * factor);
      }

      return {
        positive: Math.round(parsed.positive),
        negative: Math.round(parsed.negative),
        neutral: Math.round(parsed.neutral),
      };
    } catch (error) {
      console.error("❌ Failed to parse Llama response:", error);
      console.log("Raw response:", response);
      throw new Error("Invalid JSON response from Llama model");
    }
  }

  async analyzeReviews(reviews: Array<{ id: string; content: string; title: string }>): Promise<SentimentResult> {
    console.log(`🔍 Starting sentiment analysis for ${reviews.length} reviews`);

    try {
      // Process all reviews in a single prompt to Llama
      const prompt = this.createSentimentPrompt(reviews);

      const response = await this.retryRequest(async () => {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a sentiment analysis expert. Always respond with valid JSON objects containing percentage distributions.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1, // Low temperature for consistent results
          max_tokens: 200, // Reduced since we only need a simple JSON response
        });

        return completion.choices[0]?.message?.content || "";
      });

      console.log(`📝 Llama response received:`, response);

      const result = this.parseLlamaResponse(response);

      console.log(`📈 Sentiment analysis result:`, result);

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

      return result;
    } catch (error) {
      console.error("Error in sentiment analysis:", error);
      // Return neutral distribution as fallback
      return {
        positive: 33,
        negative: 33,
        neutral: 34,
      };
    }
  }
}

// Create singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer(process.env.OPENROUTER_API_KEY);

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

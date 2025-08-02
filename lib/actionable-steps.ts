import { AppStoreReview, AppMetadata } from "./app-store-api";

export interface ActionableStep {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "bug" | "performance" | "feature" | "ui" | "content" | "other";
  estimatedImpact: string;
  affectedUsers: number;
  confidence: number;
  tags: string[];
  timeframe: "immediate" | "short-term" | "long-term";
}

export interface ActionableStepsResult {
  steps: ActionableStep[];
  summary: {
    totalSteps: number;
    criticalSteps: number;
    highPrioritySteps: number;
    mediumPrioritySteps: number;
    lowPrioritySteps: number;
    estimatedTimeToComplete: string;
    overallImpact: string;
  };
  insights: {
    topIssues: string[];
    userPainPoints: string[];
    quickWins: string[];
    strategicRecommendations: string[];
  };
}

export class ActionableStepsGenerator {
  private reviews: AppStoreReview[];
  private metadata: AppMetadata | null;
  private minVersion: string;

  constructor(reviews: AppStoreReview[], metadata?: AppMetadata, minVersion?: string) {
    this.reviews = reviews;
    this.metadata = metadata || null;
    this.minVersion = minVersion || "0.0";
  }

  async generateActionableSteps(minVersion?: string): Promise<ActionableStepsResult> {
    // Update minVersion if provided
    if (minVersion !== undefined) {
      this.minVersion = minVersion;
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("OpenRouter API key not found, returning mock actionable steps");
      return this.generateMockActionableSteps();
    }

    try {
      // Filter reviews by minimum version
      const filteredReviews = this.filterReviewsByVersion();
      console.log(
        `Filtered reviews from ${this.reviews.length} to ${filteredReviews.length} (min version: ${this.minVersion})`
      );

      const prompt = this.buildPrompt(filteredReviews);
      const response = await this.callOpenRouterAPI(prompt);
      const result = this.parseResponse(response);

      // Merge identical steps using AI
      const mergedResult = await this.mergeIdenticalSteps(result);
      return mergedResult;
    } catch (error) {
      console.error("Error generating actionable steps:", error);
      return this.generateMockActionableSteps();
    }
  }

  private filterReviewsByVersion(): AppStoreReview[] {
    if (this.minVersion === "0.0") {
      return this.reviews;
    }

    return this.reviews.filter(review => {
      const reviewVersion = review.version;
      const minVersion = this.minVersion;

      // Simple version comparison
      const reviewParts = reviewVersion.split(".").map(Number);
      const minParts = minVersion.split(".").map(Number);

      const maxLength = Math.max(reviewParts.length, minParts.length);

      for (let i = 0; i < maxLength; i++) {
        const reviewPart = reviewParts[i] || 0;
        const minPart = minParts[i] || 0;

        if (reviewPart > minPart) return true;
        if (reviewPart < minPart) return false;
      }

      return true; // Equal versions are included
    });
  }

  private buildPrompt(reviewsToAnalyze: AppStoreReview[] = this.reviews): string {
    const appName = this.metadata?.trackName || "the app";
    const totalReviews = reviewsToAnalyze.length;
    const averageRating =
      this.metadata?.averageUserRating ||
      reviewsToAnalyze.reduce((sum, r) => sum + r.rating, 0) / reviewsToAnalyze.length;

    // Group reviews by rating for better context
    const reviewsByRating = {
      1: reviewsToAnalyze.filter(r => r.rating === 1),
      2: reviewsToAnalyze.filter(r => r.rating === 2),
      3: reviewsToAnalyze.filter(r => r.rating === 3),
      4: reviewsToAnalyze.filter(r => r.rating === 4),
      5: reviewsToAnalyze.filter(r => r.rating === 5),
    };

    // Sample reviews from each rating category
    const sampleReviews = Object.entries(reviewsByRating).map(([rating, reviews]) => {
      const samples = reviews.slice(0, 500).map(r => ({
        title: r.title,
        content: r.content,
        region: r.region,
        version: r.version,
        date: r.date,
      }));
      return { rating, reviews: samples, total: reviews.length };
    });

    const prompt = `You are an expert product manager and user experience analyst. Analyze the following App Store reviews for ${appName} and generate actionable steps to improve the app.

APP CONTEXT:
- App Name: ${appName}
- Total Reviews: ${totalReviews}
- Average Rating: ${averageRating.toFixed(1)}/5.0
- Developer: ${this.metadata?.sellerName || "Unknown"}

REVIEW DATA:
${sampleReviews
  .map(
    category => `
${category.rating}-Star Reviews (${category.total} total):
${category.reviews
  .map(
    review => `
Title: "${review.title}"
Content: "${review.content}"
Region: ${review.region}
Version: ${review.version}
Date: ${review.date}
`
  )
  .join("\n")}
`
  )
  .join("\n")}

TASK:
Generate actionable steps to improve the app based on user feedback. Focus on:
1. Critical bugs and crashes that need immediate attention
2. Performance issues affecting user experience
3. Missing features or improvements users are requesting
4. UI/UX issues that frustrate users
5. Content or functionality problems

OUTPUT FORMAT (JSON):
{
  "steps": [
    {
      "id": "unique-id",
      "title": "Clear, actionable title",
      "description": "Detailed description of the issue and solution",
      "priority": "critical|high|medium|low",
      "category": "bug|performance|feature|ui|content|other",
      "estimatedImpact": "Description of expected impact",
      "affectedUsers": number,
      "confidence": 0.0-1.0,
      "tags": ["tag1", "tag2"],
      "timeframe": "immediate|short-term|long-term"
    }
  ],
  "summary": {
    "totalSteps": number,
    "criticalSteps": number,
    "highPrioritySteps": number,
    "mediumPrioritySteps": number,
    "lowPrioritySteps": number,
    "estimatedTimeToComplete": "e.g., 2-3 weeks",
    "overallImpact": "Description of overall impact"
  },
  "insights": {
    "topIssues": ["Issue 1", "Issue 2", "Issue 3"],
    "userPainPoints": ["Pain point 1", "Pain point 2"],
    "quickWins": ["Quick win 1", "Quick win 2"],
    "strategicRecommendations": ["Strategic recommendation 1", "Strategic recommendation 2"]
  }
}

GUIDELINES:
- Prioritize based on user impact and frequency
- Be specific and actionable
- Consider the app's current rating and user sentiment
- Focus on issues that will have the most positive impact
- Include both quick wins and strategic improvements
- Base confidence on review frequency and clarity

Generate 8-15 actionable steps that will significantly improve the app's user experience and rating.`;

    return prompt;
  }

  private async callOpenRouterAPI(prompt: string): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://appstore-analyzer.vercel.app",
        "X-Title": "App Store Analyzer",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseResponse(response: string): ActionableStepsResult {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and transform the response
      const steps: ActionableStep[] = (parsed.steps || []).map((step: any, index: number) => ({
        id: step.id || `step-${index + 1}`,
        title: step.title || "Untitled Step",
        description: step.description || "No description provided",
        priority: this.validatePriority(step.priority),
        category: this.validateCategory(step.category),
        estimatedImpact: step.estimatedImpact || "Impact not specified",
        affectedUsers: typeof step.affectedUsers === "number" ? step.affectedUsers : 0,
        confidence: typeof step.confidence === "number" ? Math.max(0, Math.min(1, step.confidence)) : 0.5,
        tags: Array.isArray(step.tags) ? step.tags : [],
        timeframe: this.validateTimeframe(step.timeframe),
      }));

      const summary = {
        totalSteps: steps.length,
        criticalSteps: steps.filter(s => s.priority === "critical").length,
        highPrioritySteps: steps.filter(s => s.priority === "high").length,
        mediumPrioritySteps: steps.filter(s => s.priority === "medium").length,
        lowPrioritySteps: steps.filter(s => s.priority === "low").length,
        estimatedTimeToComplete: parsed.summary?.estimatedTimeToComplete || "2-4 weeks",
        overallImpact: parsed.summary?.overallImpact || "Significant improvement in user satisfaction",
      };

      const insights = {
        topIssues: Array.isArray(parsed.insights?.topIssues) ? parsed.insights.topIssues : [],
        userPainPoints: Array.isArray(parsed.insights?.userPainPoints) ? parsed.insights.userPainPoints : [],
        quickWins: Array.isArray(parsed.insights?.quickWins) ? parsed.insights.quickWins : [],
        strategicRecommendations: Array.isArray(parsed.insights?.strategicRecommendations)
          ? parsed.insights.strategicRecommendations
          : [],
      };

      return { steps, summary, insights };
    } catch (error) {
      console.error("Error parsing actionable steps response:", error);
      console.log("Raw response:", response);
      return this.generateMockActionableSteps();
    }
  }

  private validatePriority(priority: any): "critical" | "high" | "medium" | "low" {
    const validPriorities = ["critical", "high", "medium", "low"];
    return validPriorities.includes(priority) ? priority : "medium";
  }

  private validateCategory(category: any): "bug" | "performance" | "feature" | "ui" | "content" | "other" {
    const validCategories = ["bug", "performance", "feature", "ui", "content", "other"];
    return validCategories.includes(category) ? category : "other";
  }

  private validateTimeframe(timeframe: any): "immediate" | "short-term" | "long-term" {
    const validTimeframes = ["immediate", "short-term", "long-term"];
    return validTimeframes.includes(timeframe) ? timeframe : "short-term";
  }

  private async mergeIdenticalSteps(result: ActionableStepsResult): Promise<ActionableStepsResult> {
    if (!process.env.OPENROUTER_API_KEY) {
      return result;
    }

    try {
      const prompt = `You are an expert at identifying and merging duplicate actionable steps. 

Below is a JSON object containing actionable steps for improving an app. Please analyze the steps and merge any that are essentially the same or very similar. When merging:

1. Combine similar titles and descriptions into a single, comprehensive step
2. Use the highest priority level among the merged steps
3. Sum the affectedUsers count
4. Use the highest confidence level
5. Combine all unique tags
6. Use the most urgent timeframe

Here's the data to analyze and merge:

${JSON.stringify(result, null, 2)}

Return the merged result in the exact same JSON format, but with duplicate steps consolidated.`;

      const response = await this.callOpenRouterAPI(prompt);
      const mergedResult = this.parseResponse(response);

      // Update summary counts after merging
      mergedResult.summary = {
        totalSteps: mergedResult.steps.length,
        criticalSteps: mergedResult.steps.filter(s => s.priority === "critical").length,
        highPrioritySteps: mergedResult.steps.filter(s => s.priority === "high").length,
        mediumPrioritySteps: mergedResult.steps.filter(s => s.priority === "medium").length,
        lowPrioritySteps: mergedResult.steps.filter(s => s.priority === "low").length,
        estimatedTimeToComplete: mergedResult.summary.estimatedTimeToComplete,
        overallImpact: mergedResult.summary.overallImpact,
      };

      return mergedResult;
    } catch (error) {
      console.error("Error merging identical steps:", error);
      return result; // Return original if merging fails
    }
  }

  private generateMockActionableSteps(): ActionableStepsResult {
    return {
      steps: [
        {
          id: "mock-1",
          title: "Fix App Crashes",
          description: "Address reported crashes and stability issues to improve user experience",
          priority: "critical",
          category: "bug",
          estimatedImpact: "Significant reduction in user frustration and negative reviews",
          affectedUsers: 15,
          confidence: 0.9,
          tags: ["crash", "stability", "urgent"],
          timeframe: "immediate",
        },
        {
          id: "mock-2",
          title: "Improve App Performance",
          description: "Optimize app speed and responsiveness based on user feedback",
          priority: "high",
          category: "performance",
          estimatedImpact: "Better user experience and higher ratings",
          affectedUsers: 25,
          confidence: 0.8,
          tags: ["performance", "speed", "optimization"],
          timeframe: "short-term",
        },
      ],
      summary: {
        totalSteps: 2,
        criticalSteps: 1,
        highPrioritySteps: 1,
        mediumPrioritySteps: 0,
        lowPrioritySteps: 0,
        estimatedTimeToComplete: "1-2 weeks",
        overallImpact: "Significant improvement in app stability and performance",
      },
      insights: {
        topIssues: ["App crashes", "Performance issues"],
        userPainPoints: ["Frequent crashes", "Slow loading times"],
        quickWins: ["Fix obvious crash bugs", "Optimize startup time"],
        strategicRecommendations: ["Implement crash reporting", "Add performance monitoring"],
      },
    };
  }
}

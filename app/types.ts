export interface AppStoreReview {
  id: string;
  region: string;
  title: string;
  content: string;
  rating: number;
  version: string;
  date: string;
  author: string;
}

export interface AppMetadata {
  trackName: string;
  sellerName: string;
  primaryGenreName: string;
  averageUserRating: number;
  userRatingCount: number;
  version: string;
}

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

export interface AnalysisResult {
  basicStats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
  };
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
  filteredAnalysis: {
    informativeReviews: number;
    nonInformativeReviews: number;
    informativePercentage: number;
    totalReviews: number;
    categoryBreakdown: Record<string, number>;
  };
  keywordAnalysis: Array<{
    keyword: string;
    count: number;
    sentiment: string;
    averageRating: number;
  }>;
  topReviews: {
    positive: AppStoreReview[];
    negative: AppStoreReview[];
  };
  trendData: Array<{
    date: string;
    averageRating: number;
  }>;
  versionAnalysis: Array<{
    version: string;
    averageRating: number;
  }>;
  regionalAnalysis: Array<{
    region: string;
    averageRating: number;
  }>;
  actionableSteps: ActionableStepsResult;
  dynamicMetrics: {
    ratingTrend: {
      weeklyChange: number;
      monthlyChange: number;
      trendDirection: "up" | "down" | "stable";
      trendDescription: string;
    };
    userComplaints: {
      crashReports: number;
      performanceIssues: number;
      bugReports: number;
      totalIssues: number;
    };
    performanceMetrics: {
      speedComplaints: number;
      speedComplaintChange: number;
      lagComplaints: number;
      freezeComplaints: number;
    };
    keywordTrends: {
      topPositiveKeywords: Array<{ keyword: string; count: number; trend: number }>;
      topNegativeKeywords: Array<{ keyword: string; count: number; trend: number }>;
    };
    timeBasedStats: {
      weeksTracked: number;
      daysTracked: number;
      averageReviewsPerDay: number;
      recentActivity: {
        last7Days: number;
        last30Days: number;
        last90Days: number;
      };
    };
    impactAssessment: {
      criticalIssues: number;
      highPriorityIssues: number;
      mediumPriorityIssues: number;
      lowPriorityIssues: number;
    };
  };
}

export type ViewType =
  | "dashboard"
  | "sentiment"
  | "trends"
  | "keywords"
  | "regions"
  | "versions"
  | "tasks"
  | "insights"
  | "issues";

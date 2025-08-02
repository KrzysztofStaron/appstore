export interface AppStoreAnalyzerConfig {
  // LLM Filtering Configuration
  llm: {
    enabled: boolean;
    maxReviews: number; // Maximum number of reviews to process with LLM
    batchSize: number; // Number of reviews to process in each batch
    maxConcurrentBatches: number; // Maximum concurrent batches
    retryAttempts: number; // Number of retry attempts for failed requests
    retryDelay: number; // Delay between retries in milliseconds
    rateLimitDelay: number; // Delay between requests to prevent rate limiting
    timeout: number; // Request timeout in milliseconds
  };

  // API Configuration
  api: {
    baseURL: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  // Analysis Configuration
  analysis: {
    minReviewLength: number; // Minimum review length to consider informative
    sentimentThreshold: number; // Threshold for sentiment classification
    trendPeriodDays: number; // Number of days for trend analysis
  };

  // Caching Configuration
  cache: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
  };
}

export const defaultConfig: AppStoreAnalyzerConfig = {
  llm: {
    enabled: true,
    maxReviews: 100, // Limit to prevent overwhelming the API
    batchSize: 5, // Small batches for better error handling
    maxConcurrentBatches: 3, // Limit concurrent requests
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    rateLimitDelay: 200, // 200ms between requests
    timeout: 10000, // 10 seconds
  },

  api: {
    baseURL: "https://openrouter.ai/api/v1",
    model: "mistralai/ministral-3b",
    maxTokens: 200,
    temperature: 0.1,
  },

  analysis: {
    minReviewLength: 20,
    sentimentThreshold: 0.6,
    trendPeriodDays: 30,
  },

  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
  },
};

// Get configuration with environment variable overrides
export function getConfig(): AppStoreAnalyzerConfig {
  const config = { ...defaultConfig };

  // Override with environment variables if present
  if (process.env.OPENROUTER_API_KEY) {
    config.llm.enabled = true;
  } else {
    config.llm.enabled = false;
  }

  // Parse numeric environment variables
  if (process.env.MAX_REVIEWS) {
    config.llm.maxReviews = parseInt(process.env.MAX_REVIEWS, 10);
  }

  if (process.env.BATCH_SIZE) {
    config.llm.batchSize = parseInt(process.env.BATCH_SIZE, 10);
  }

  if (process.env.MAX_CONCURRENT_BATCHES) {
    config.llm.maxConcurrentBatches = parseInt(process.env.MAX_CONCURRENT_BATCHES, 10);
  }

  if (process.env.RETRY_ATTEMPTS) {
    config.llm.retryAttempts = parseInt(process.env.RETRY_ATTEMPTS, 10);
  }

  if (process.env.RETRY_DELAY) {
    config.llm.retryDelay = parseInt(process.env.RETRY_DELAY, 10);
  }

  if (process.env.RATE_LIMIT_DELAY) {
    config.llm.rateLimitDelay = parseInt(process.env.RATE_LIMIT_DELAY, 10);
  }

  if (process.env.REQUEST_TIMEOUT) {
    config.llm.timeout = parseInt(process.env.REQUEST_TIMEOUT, 10);
  }

  return config;
}

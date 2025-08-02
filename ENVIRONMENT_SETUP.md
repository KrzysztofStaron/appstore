# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenRouter API Key for sentiment analysis using Meta's Llama 4 Scout
# Get your API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Override default settings
NEXT_PUBLIC_APP_NAME="App Store Analytics"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## Getting an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Create a free account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

## Features Enabled with API Key

- **Advanced AI Sentiment Analysis**: Uses Meta's Llama 4 Scout model for superior sentiment understanding
- **Comprehensive Review Analysis**: Analyzes both review titles and content for better accuracy
- **Batch Processing**: Processes all reviews in a single prompt for efficiency
- **Confidence Scoring**: Provides confidence scores for each sentiment classification
- **Reasoning**: Includes brief explanations for sentiment classifications
- **Fallback Support**: Falls back to keyword-based analysis if API is unavailable

## Performance Optimizations

The app includes several performance optimizations:

- **Request Deduplication**: Prevents duplicate API calls
- **Caching**: Caches metadata and reviews for 15-30 minutes
- **Batch Processing**: Processes all reviews in a single API call
- **Lazy Loading**: Images load only when visible
- **Debouncing**: Search inputs are debounced to reduce API calls
- **Rate Limiting**: Built-in delays to respect API rate limits

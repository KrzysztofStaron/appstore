# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Hugging Face API Key for sentiment analysis
# Get your free API key from: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: Override default settings
NEXT_PUBLIC_APP_NAME="App Store Analytics"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## Getting a Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Create a free account
3. Go to [Settings > Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "read" permissions
5. Copy the token and paste it in your `.env.local` file

## Features Enabled with API Key

- **Real AI Sentiment Analysis**: Uses the `cardiffnlp/twitter-roberta-base-sentiment-latest` model
- **Content-based Analysis**: Analyzes review content instead of just ratings
- **Batch Processing**: Processes multiple reviews efficiently
- **Fallback Support**: Falls back to keyword-based analysis if API is unavailable

## Performance Optimizations

The app includes several performance optimizations:

- **Request Deduplication**: Prevents duplicate API calls
- **Caching**: Caches metadata and reviews for 15-30 minutes
- **Batch Processing**: Processes reviews in batches of 10
- **Lazy Loading**: Images load only when visible
- **Debouncing**: Search inputs are debounced to reduce API calls

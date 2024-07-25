# App Store Review Analysis Tool

A comprehensive tool for analyzing user reviews from the Apple App Store, providing actionable insights for developers and businesses.

## Features

- **Review Collection**: Automated fetching from App Store RSS API across 175 regions
- **Advanced Analysis**: Sentiment analysis, keyword extraction, trend analysis
- **Competitor Analysis**: Market positioning and competitive intelligence
- **Actionable Insights**: Prioritized tasks and improvement recommendations
- **Interactive Dashboard**: Beautiful UI with charts and visualizations
- **Export Capabilities**: CSV export for further analysis

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Recharts
- **AI**: OpenRouter API with Mistral model for review filtering
- **Data**: App Store RSS API, custom analysis algorithms
- **Performance**: Server Actions, caching, benchmarking

## Quick Start

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```
4. Run the development server: `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter an App Store app ID (e.g., `6670324846` for Grok)
2. Select regions to analyze (default: US, GB, CA, AU)
3. Click "Analyze Reviews" to fetch and process data
4. Explore different tabs for insights:
   - **Overview**: Key metrics and sentiment analysis
   - **Trends**: Rating trends over time
   - **Versions**: Version-specific analysis
   - **Keywords**: Most mentioned terms and sentiment
   - **Performance**: Issue categorization and filtering
   - **Actionable**: Prioritized improvement tasks
   - **Competitors**: Market analysis and positioning

## API Endpoints

The tool uses the public App Store RSS API:

- Customer Reviews: `/rss/customerreviews/{region}/{page}/{app_id}/{sort_option}/json`
- App Metadata: `/lookup?id={app_id}`
- App Search: `/search?term={keyword}&country={region}&entity=software`

## Analysis Features

### Review Filtering

- LLM-powered filtering of non-informative reviews
- Heuristic fallback for reliability
- Parallel processing for performance

### Advanced Metrics

- Review length analysis
- Engagement metrics
- Sentiment trends and volatility
- Performance issue categorization
- User behavior patterns

### Competitor Analysis

- Automatic competitor discovery
- Market positioning analysis
- Strategic insights and recommendations

## Development

### Project Structure

```
appstore/
├── app/                    # Next.js app directory
│   ├── actions.ts         # Server actions
│   ├── page.tsx           # Main dashboard
│   └── layout.tsx         # Root layout
├── lib/                   # Core libraries
│   ├── app-store-api.ts   # API integration
│   ├── analysis.ts        # Analysis algorithms
│   ├── review-filter.ts   # LLM filtering
│   ├── competitor-analysis.ts # Competitor analysis
│   ├── benchmark.ts       # Performance tracking
│   └── cache.ts          # Caching system
└── components/            # UI components
    └── ui/               # shadcn/ui components
```

### Key Components

- **AppStoreAPI**: Handles all App Store API interactions
- **ReviewAnalyzer**: Core analysis engine with advanced metrics
- **ReviewFilter**: LLM-powered review filtering
- **CompetitorAnalyzer**: Market analysis and competitor insights
- **Benchmark**: Performance tracking and optimization

## Performance

- **Caching**: In-memory cache for analysis results
- **Parallel Processing**: Batch processing for LLM calls
- **Benchmarking**: Detailed performance metrics
- **Optimization**: Server-side rendering and efficient data structures

## Future Enhancements

- Historical data collection with cron jobs
- Database integration for persistent storage
- PDF report generation
- Manual data import (CSV upload)
- Real-time monitoring and alerts
- Advanced competitor tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

_Built with Next.js, React, and modern web technologies for comprehensive App Store review analysis._

<!-- Development activity: July 24-26, 2024 -->

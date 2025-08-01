we=# App Store Review Analysis Tool

<<<<<<< HEAD
> **Transform App Store reviews into actionable insights with AI-powered analysis**
=======
A comprehensive tool for analyzing user reviews from the Apple App Store, providing actionable insights for developers and businesses.
>>>>>>> 51497c3 (docs: improve README with comprehensive documentation)

A modern web application that automatically collects, analyzes, and visualizes user reviews from the Apple App Store. Built with Next.js, React, and OpenAI for comprehensive review intelligence.

<<<<<<< HEAD
## 🎯 What It Does

- **Collects** reviews from 175+ App Store regions automatically
- **Analyzes** sentiment, trends, and user feedback using AI
- **Identifies** bugs, feature requests, and performance issues
- **Compares** your app against competitors in the market
- **Generates** prioritized action items for improvement
- **Exports** data for further analysis and reporting

## 🚀 Quick Start

```bash
# Clone and install
git clone <your-repo>
cd appstore
pnpm install

# Set up environment
echo "OPENROUTER_API_KEY=your_key_here" > .env.local

# Run the app
pnpm dev
```

Visit `http://localhost:3000` and enter an App Store ID (e.g., `6670324846` for Grok).
=======
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
>>>>>>> 51497c3 (docs: improve README with comprehensive documentation)

## 📊 Features

<<<<<<< HEAD
### Core Analysis

- **Multi-region data collection** from App Store RSS API
- **AI-powered review filtering** to remove noise
- **Sentiment analysis** across multiple languages
- **Trend tracking** over time and versions
- **Keyword extraction** and topic clustering

### Competitive Intelligence

- **Automatic competitor discovery**
- **Market positioning analysis**
- **Benchmark comparisons**
- **Strategic recommendations**

### Interactive Dashboard

- **Real-time visualizations** with Recharts
- **Tabbed interface** for different insights
- **Responsive design** for all devices
- **Export capabilities** (CSV)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Charts**: Recharts
- **AI**: OpenAI via OpenRouter
- **HTTP**: Axios
- **Styling**: Tailwind CSS

## 📁 Project Structure
=======
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
>>>>>>> 51497c3 (docs: improve README with comprehensive documentation)

```
appstore/
├── app/                    # Next.js app directory
│   ├── actions.ts         # Server actions
│   ├── page.tsx           # Main dashboard
│   └── layout.tsx         # Root layout
├── lib/                   # Core libraries
│   ├── app-store-api.ts   # API integration
<<<<<<< HEAD
│   ├── analysis.ts        # Analysis engine
│   ├── review-filter.ts   # AI filtering
│   ├── competitor-analysis.ts # Market analysis
│   ├── benchmark.ts       # Performance tracking
│   └── cache.ts          # Caching
└── components/            # UI components
    └── ui/               # shadcn/ui
```

## 🔧 API Integration

The tool uses the public App Store RSS API:

```typescript
// Review collection
GET /rss/customerreviews/{region}/{page}/{app_id}/mostrecent/json

// App metadata
GET /lookup?id={app_id}

// Competitor search
GET /search?term={keyword}&country={region}&entity=software
```
=======
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
>>>>>>> 51497c3 (docs: improve README with comprehensive documentation)

### Data Flow

1. **Fetch** reviews from multiple regions
2. **Filter** using AI to remove non-informative content
3. **Analyze** sentiment, extract keywords, identify trends
4. **Compare** with competitors and market data
5. **Generate** actionable insights and recommendations

## 📈 Analysis Tabs

| Tab             | Purpose                   | Key Metrics                                    |
| --------------- | ------------------------- | ---------------------------------------------- |
| **Overview**    | High-level summary        | Total reviews, avg rating, sentiment breakdown |
| **Trends**      | Time-based analysis       | Rating trends, version impact, monthly changes |
| **Versions**    | Version-specific insights | Update impact, bug frequency, feature adoption |
| **Keywords**    | Topic analysis            | Most mentioned terms, sentiment by keyword     |
| **Performance** | Issue categorization      | Bug vs feature requests, UX problems           |
| **Actionable**  | Improvement tasks         | Prioritized recommendations, impact estimates  |
| **Competitors** | Market analysis           | Positioning, benchmarking, strategic insights  |

## ⚙️ Configuration

### Environment Variables

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Default Settings

- **Default App ID**: `6670324846` (Grok)
- **Default Regions**: US, GB, CA
- **Max Pages**: 10 per region (500 reviews)
- **Rate Limiting**: 1-2 second delays between requests

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Add `OPENROUTER_API_KEY` to environment variables
3. Deploy automatically on push

### Other Platforms

Works with any Next.js-compatible hosting:

- Netlify
- Railway
- DigitalOcean
- AWS Amplify

## 🧪 Development

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Code Style

- TypeScript with strict mode
- ESLint with Next.js config
- Functional components
- Server actions for data processing

## 📊 Performance

- **Caching**: In-memory cache for analysis results
- **Parallel Processing**: Batch AI calls for efficiency
- **Benchmarking**: Performance tracking and optimization
- **Server Actions**: Server-side data processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Guidelines

<<<<<<< HEAD
- Follow TypeScript best practices
- Add proper error handling
- Include JSDoc comments
- Test thoroughly
- Update documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- App Store RSS API for review data
- OpenAI for AI-powered analysis
- shadcn/ui for beautiful components
- Recharts for data visualization
- Next.js team for the amazing framework

---

**Built with ❤️ using modern web technologies**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/appstore?style=social)](https://github.com/your-repo/appstore)
[![GitHub forks](https://img.shields.io/github/forks/your-repo/appstore?style=social)](https://github.com/your-repo/appstore)
=======
MIT License - see LICENSE file for details

---

_Built with Next.js, React, and modern web technologies for comprehensive App Store review analysis._

<!-- Development activity: July 24-26, 2024 -->
>>>>>>> 51497c3 (docs: improve README with comprehensive documentation)

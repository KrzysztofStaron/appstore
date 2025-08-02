# App Store Review Analysis Tool

> **Transform App Store reviews into actionable insights with AI-powered analysis**

A comprehensive tool for analyzing user reviews from the Apple App Store, providing actionable insights for developers and businesses.

A modern web application that automatically collects, analyzes, and visualizes user reviews from the Apple App Store. Built with Next.js, React, and Meta's Llama 4 Scout for comprehensive review intelligence.

## 🎯 What It Does

- **Collects** reviews from 175+ App Store regions automatically
- **Analyzes** sentiment, trends, and user feedback using Meta's Llama 4 Scout
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

## 📊 Features

### Core Analysis

- **Multi-region data collection** from App Store RSS API
- **AI-powered review filtering** to remove noise
- **Advanced sentiment analysis** using Meta's Llama 4 Scout model
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
- **AI**: Meta's Llama 4 Scout via OpenRouter
- **HTTP**: Axios
- **Styling**: Tailwind CSS

## 📁 Project Structure

```
appstore/
├── app/                    # Next.js app directory
│   ├── actions.ts         # Server actions
│   ├── page.tsx           # Main dashboard
│   └── layout.tsx         # Root layout
├── lib/                   # Core libraries
│   ├── app-store-api.ts   # API integration
│   ├── analysis.ts        # Analysis engine
│   ├── sentiment-analysis.ts # Llama-based sentiment analysis
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

### Data Flow

1. **Fetch** reviews from multiple regions
2. **Filter** using AI to remove non-informative content
3. **Analyze** sentiment using Llama 4 Scout, extract keywords, identify trends
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
# OpenRouter API Key for Llama 4 Scout sentiment analysis
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Default Settings

- **Default App ID**: `6670324846` (Grok)
- **Default Regions**: US, GB, CA
- **Max Pages**: 10 per region (500 reviews)
- **Rate Limiting**: 1-2 second delays between requests
- **AI Model**: Meta's Llama 4 Scout via OpenRouter

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
- **Advanced AI**: Meta's Llama 4 Scout for superior sentiment analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Guidelines

- Follow TypeScript best practices
- Add proper error handling
- Include JSDoc comments
- Test thoroughly
- Update documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- App Store RSS API for review data
- Meta's Llama 4 Scout for advanced sentiment analysis
- OpenRouter for AI model access
- shadcn/ui for beautiful components
- Recharts for data visualization
- Next.js team for the amazing framework

---

**Built with ❤️ using modern web technologies**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/appstore?style=social)](https://github.com/your-repo/appstore)
[![GitHub forks](https://img.shields.io/github/forks/your-repo/appstore?style=social)](https://github.com/your-repo/appstore)

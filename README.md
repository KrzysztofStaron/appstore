# App Store Review Analysis Tool

> **Transform App Store reviews into actionable insights with AI-powered analysis**

A comprehensive web application that automatically collects, analyzes, and visualizes user reviews from the Apple App Store. Built with Next.js, React, and advanced AI models for comprehensive review intelligence.

![Dashboard Overview](dashboard.png)

## 🎯 Overview

The App Store Review Analysis Tool is designed to help developers and businesses understand user sentiment, identify critical issues, and make data-driven decisions based on App Store reviews. It leverages the public App Store RSS API and advanced AI analysis to provide actionable insights.

### Key Features

- **🌐 Multi-region Data Collection**: Automatically fetches reviews from 175+ App Store regions
- **🤖 AI-Powered Analysis**: Uses advanced language models for sentiment analysis and issue detection
- **📊 Interactive Dashboard**: Beautiful visualizations with real-time insights
- **🎯 Actionable Insights**: Prioritized recommendations for app improvement
- **📈 Trend Analysis**: Track performance over time and across versions
- **🏆 Competitive Intelligence**: Benchmark against competitors in your category

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenRouter API key for AI analysis

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd appstore

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key
```

### Environment Setup

Create a `.env.local` file with your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Running the Application

```bash
# Start the development server
pnpm dev

# Open your browser to http://localhost:3000
```

### First Analysis

1. Enter an App Store ID (e.g., `6670324846` for Grok)
2. Select regions to analyze (or choose "Global" for all 175 regions)
3. Click "Start Analysis" and watch the real-time progress
4. Explore the comprehensive dashboard with insights

## 📊 Dashboard Features

The dashboard provides a comprehensive view of your app's performance across multiple dimensions:

### Overview Dashboard

- **Relevant Reviews Analyzed**: AI-filtered reviews with actionable insights
- **Positive Sentiment**: Percentage of positive user sentiment
- **Quality Score**: Overall app quality rating with issue breakdown
- **Average Rating**: Current App Store rating with trend indicators

### Analysis Sections

#### 📈 Trends Analysis

- Rating trends over time
- Version impact analysis
- Monthly performance tracking
- Seasonal patterns identification

#### 🎭 Sentiment Analysis

- Positive/negative/neutral breakdown
- Sentiment by region and version
- Emotional tone analysis
- User satisfaction metrics

#### 🔍 Keywords & Topics

- Most mentioned features and issues
- Topic clustering and categorization
- Keyword sentiment analysis
- Feature request identification

#### 🌍 Regional Insights

- Performance by geographic region
- Cultural sentiment differences
- Regional issue patterns
- Market-specific recommendations

#### 📱 Version Analysis

- Update impact assessment
- Bug frequency by version
- Feature adoption rates
- Regression detection

#### ⚠️ Issues & Bugs

- Critical issue identification
- Bug categorization and prioritization
- Performance problem detection
- User experience blockers

#### ✅ Actionable Steps

- Prioritized improvement recommendations
- Impact estimates for each action
- Implementation suggestions
- ROI projections

## 🛠️ Technical Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Data Visualization**: Recharts
- **AI/ML**: Meta's Llama 4 Scout via OpenRouter
- **HTTP Client**: Axios
- **Caching**: In-memory cache with persistence

### Project Structure

```
appstore/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── analyze/       # Analysis endpoint
│   │   ├── progress/      # Progress tracking
│   │   └── search/        # App search
│   ├── actions.ts         # Server actions
│   ├── page.tsx           # Main dashboard
│   ├── types.ts           # TypeScript definitions
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── views/            # Dashboard view components
│   ├── AppConfigModal.tsx # Configuration modal
│   ├── AppSelector.tsx   # App selection component
│   └── Sidebar.tsx       # Navigation sidebar
├── lib/                   # Core libraries
│   ├── app-store-api.ts   # App Store API integration
│   ├── analysis.ts        # Analysis engine
│   ├── sentiment-analysis.ts # AI sentiment analysis
│   ├── review-filter.ts   # Review filtering logic
│   ├── competitor-analysis.ts # Competitive analysis
│   ├── benchmark.ts       # Performance benchmarking
│   ├── cache.ts          # Caching system
│   └── utils.ts          # Utility functions
├── public/               # Static assets
└── README.md            # This file
```

## 🔌 API Integration

### App Store RSS API

The tool leverages the public App Store RSS API for data collection:

```typescript
// Customer reviews endpoint
GET /rss/customerreviews/{region}/{page}/{app_id}/mostrecent/json

// App metadata endpoint
GET /lookup?id={app_id}

// App search endpoint
GET /search?term={keyword}&country={region}&entity=software
```

### Data Flow

1. **Collection**: Fetch reviews from selected regions (up to 500 per region)
2. **Filtering**: AI-powered filtering to remove non-informative reviews
3. **Analysis**: Sentiment analysis, keyword extraction, trend identification
4. **Processing**: Issue categorization, competitor comparison, actionable insights
5. **Visualization**: Interactive dashboard with real-time updates

### Rate Limiting & Best Practices

- **Rate Limiting**: 1-2 second delays between API requests
- **Caching**: Results cached to minimize API calls
- **Error Handling**: Graceful degradation for API failures
- **Progress Tracking**: Real-time progress updates during analysis

## 📈 Analysis Capabilities

### AI-Powered Features

- **Sentiment Analysis**: Advanced language model analysis of review sentiment
- **Issue Detection**: Automatic identification of bugs, crashes, and UX problems
- **Topic Clustering**: Intelligent grouping of related feedback
- **Priority Scoring**: AI-driven prioritization of issues and recommendations

### Data Processing

- **Review Filtering**: Remove spam, non-informative, and duplicate reviews
- **Multi-language Support**: Analysis across different languages and regions
- **Version Tracking**: Correlation of issues with specific app versions
- **Trend Analysis**: Time-based analysis of user sentiment and issues

### Export & Integration

- **JSON Export**: Complete dataset export for further analysis
- **CSV Reports**: Formatted reports for stakeholders
- **API Access**: Programmatic access to analysis results
- **Real-time Updates**: Live progress tracking during analysis

## ⚙️ Configuration

### Environment Variables

```env
# Required: OpenRouter API key for AI analysis
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Custom API endpoints
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Default Settings

- **Default App ID**: `6670324846` (Grok - X.AI)
- **Default Regions**: US, GB, CA (Major markets)
- **Max Pages**: 10 per region (500 reviews maximum)
- **AI Model**: Meta's Llama 4 Scout via OpenRouter
- **Cache Duration**: 24 hours for analysis results

### Customization

You can customize various aspects of the analysis:

- **Region Selection**: Choose specific regions or analyze globally
- **Review Filtering**: Adjust filtering criteria for different use cases
- **Analysis Depth**: Configure the level of detail in AI analysis
- **Export Format**: Customize export formats and data structure

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add `OPENROUTER_API_KEY` in Vercel dashboard
3. **Deploy**: Automatic deployment on every push to main branch

```bash
# Deploy to Vercel
vercel --prod
```

### Other Platforms

The application works with any Next.js-compatible hosting platform:

- **Netlify**: Connect Git repository and set environment variables
- **Railway**: Deploy with automatic environment variable injection
- **DigitalOcean App Platform**: One-click deployment
- **AWS Amplify**: Full-stack deployment with CI/CD

### Production Considerations

- **Environment Variables**: Ensure all required variables are set
- **API Limits**: Monitor OpenRouter API usage and limits
- **Caching**: Implement Redis or similar for production caching
- **Monitoring**: Set up error tracking and performance monitoring

## 🧪 Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

### Development Guidelines

- **TypeScript**: Use strict mode and proper typing
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Testing**: Add tests for critical functionality
- **Documentation**: Update docs for new features

### Code Style

- Follow Next.js 13+ App Router conventions
- Use server components where possible
- Implement proper error boundaries
- Add loading states and error handling
- Follow TypeScript best practices

## 📊 Performance & Optimization

### Performance Features

- **Server-Side Rendering**: Fast initial page loads
- **Streaming**: Real-time progress updates during analysis
- **Caching**: Intelligent caching of analysis results
- **Code Splitting**: Automatic code splitting for optimal loading
- **Image Optimization**: Next.js automatic image optimization

### Optimization Strategies

- **Parallel Processing**: Concurrent API calls for faster data collection
- **Incremental Analysis**: Progressive analysis with real-time updates
- **Memory Management**: Efficient data structures and cleanup
- **Network Optimization**: Request batching and compression

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Guidelines

- **Code Quality**: Follow existing code style and patterns
- **Testing**: Add tests for new functionality
- **Documentation**: Update README and code comments
- **Performance**: Consider performance impact of changes
- **Accessibility**: Ensure UI changes are accessible

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/appstore.git
cd appstore

# Add upstream remote
git remote add upstream https://github.com/original-owner/appstore.git

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **App Store RSS API**: For providing access to review data
- **Meta's Llama 4 Scout**: For advanced AI analysis capabilities
- **OpenRouter**: For providing access to AI models
- **shadcn/ui**: For beautiful, accessible UI components
- **Recharts**: For powerful data visualization
- **Next.js Team**: For the amazing React framework
- **Vercel**: For seamless deployment and hosting

## 📞 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions for help and ideas
- **Documentation**: Check the code comments and inline docs
- **Examples**: See the demo with Grok app analysis

---

**Built with ❤️ using modern web technologies**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/appstore?style=social)](https://github.com/your-repo/appstore)
[![GitHub forks](https://img.shields.io/github/forks/your-repo/appstore?style=social)](https://github.com/your-repo/appstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# App Store Review Analysis Tool

A comprehensive web application for analyzing user reviews from the Apple App Store. This tool provides insights into app performance, user sentiment, and trends across different regions and versions.

## Features

- **Multi-Region Data Collection**: Fetch reviews from up to 175 App Store regions
- **Sentiment Analysis**: Analyze user sentiment based on ratings and review content
- **Trend Analysis**: Track rating trends over time
- **Version Performance**: Compare ratings across different app versions
- **Regional Insights**: Analyze performance by region
- **Keyword Analysis**: Identify common themes and issues in reviews
- **Data Export**: Export analysis results to CSV format
- **Beautiful Visualizations**: Interactive charts and graphs using Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd appstore
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Analysis

1. **Enter App Store ID**: Input the numeric ID of the app you want to analyze

   - Example: `6670324846` for Grok
   - You can find the ID in the App Store URL: `https://apps.apple.com/app/id[APP_ID]`

2. **Select Regions**: Choose which regions to analyze

   - Pre-configured options: US/UK/Canada, Major Markets, or individual countries
   - More regions = more data but longer processing time

3. **Click "Analyze Reviews"**: The tool will fetch reviews and metadata from the App Store

4. **View Results**: Explore the analysis through different tabs:
   - **Overview**: Sentiment analysis, rating distribution, and keyword insights
   - **Trends**: Rating trends over time
   - **Versions**: Performance by app version
   - **Regions**: Regional performance comparison

### Exporting Data

- Click "Export CSV" to download all review data in CSV format
- The exported file includes: ID, Region, Title, Content, Rating, Version, Date, and Author

## Technical Details

### Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios for API requests

### API Integration

The tool uses the public App Store RSS API endpoints:

- **Reviews**: `https://itunes.apple.com/{region}/rss/customerreviews/id={app_id}/sortby=mostrecent/json`
- **Metadata**: `https://itunes.apple.com/lookup?id={app_id}&country={region}`
- **Search**: `https://itunes.apple.com/search?term={keyword}&country={region}&entity=software`

### Data Processing

- **Rate Limiting**: 1-second delay between requests to respect API limits
- **Deduplication**: Removes duplicate reviews based on review ID
- **Filtering**: Excludes non-informative reviews (too short, generic terms)
- **Analysis**: Sentiment classification, trend analysis, keyword extraction

### Supported Regions

The tool supports all 175 App Store regions including:

- Major markets: US, UK, Canada, Australia, Germany, France, Japan
- European markets: Italy, Spain, Netherlands, Sweden, Norway
- Asian markets: China, South Korea, India, Singapore, Hong Kong
- And many more...

## Analysis Features

### Sentiment Analysis

- **Positive**: 4-5 star ratings
- **Neutral**: 3 star ratings
- **Negative**: 1-2 star ratings

### Trend Analysis

- Daily average ratings over time
- Review volume trends
- Version release impact analysis

### Keyword Analysis

- Common positive keywords: "great", "awesome", "love", "perfect"
- Common negative keywords: "bug", "crash", "error", "problem"
- Performance-related: "slow", "lag", "freeze"
- Feature-related: "update", "new", "feature"

### Regional Analysis

- Average ratings by country/region
- Review volume by region
- Regional sentiment breakdown

## Limitations

- **API Rate Limits**: The App Store API has undocumented rate limits
- **Data Availability**: Not all apps have reviews in all regions
- **Language**: Reviews are in local languages (multilingual analysis not implemented)
- **Historical Data**: Limited to recent reviews (typically last few months)

## Development

### Project Structure

```
appstore/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main dashboard
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── app-store-api.ts     # API service
│   ├── analysis.ts          # Data analysis utilities
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

### Adding New Features

1. **New Analysis Types**: Extend the `ReviewAnalyzer` class in `lib/analysis.ts`
2. **New Visualizations**: Add new chart components using Recharts
3. **New Data Sources**: Extend the API service in `lib/app-store-api.ts`

### Testing

The tool includes error handling for:

- Network timeouts
- Invalid app IDs
- Empty responses
- Rate limiting errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the browser console for error messages
2. Verify the App Store ID is correct
3. Try with fewer regions if experiencing timeouts
4. Ensure you have a stable internet connection

## Future Enhancements

- [ ] Multilingual sentiment analysis
- [ ] Competitor comparison
- [ ] Real-time monitoring
- [ ] Advanced filtering options
- [ ] PDF report generation
- [ ] Email notifications
- [ ] User accounts and saved analyses
- [ ] Google Play Store integration

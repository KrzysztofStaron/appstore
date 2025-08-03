import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const region = searchParams.get("region") || "us";

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&country=${region}&limit=20`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`iTunes API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match our app structure
    const apps = data.results.map((app: any) => ({
      trackId: app.trackId,
      trackName: app.trackName,
      sellerName: app.sellerName,
      primaryGenreName: app.primaryGenreName,
      averageUserRating: app.averageUserRating || 0,
      userRatingCount: app.userRatingCount || 0,
      artworkUrl100: app.artworkUrl100,
      artworkUrl512: app.artworkUrl512,
      version: app.version,
      releaseDate: app.releaseDate,
      currentVersionReleaseDate: app.currentVersionReleaseDate,
      description: app.description,
      price: app.price,
      currency: app.currency,
    }));

    return NextResponse.json({ apps, resultCount: apps.length });
  } catch (error) {
    console.error("Error searching apps:", error);
    return NextResponse.json({ error: "Failed to search apps" }, { status: 500 });
  }
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReviewAI - Transform App Reviews Into Actionable Insights",
  description:
    "Free AI-powered App Store review analysis tool. Analyze thousands of reviews across 175+ regions, extract sentiment, keywords, and get prioritized action items. No registration required.",
  keywords: [
    "app store reviews",
    "review analysis",
    "sentiment analysis",
    "app store insights",
    "user feedback analysis",
    "app store analytics",
    "review sentiment",
    "app store data",
    "review trends",
    "app feedback",
    "app store research",
    "review mining",
    "app store monitoring",
    "user sentiment",
    "app store intelligence",
  ],
  authors: [{ name: "ReviewAI Team" }],
  creator: "ReviewAI",
  publisher: "ReviewAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://reviewai.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ReviewAI - Transform App Reviews Into Actionable Insights",
    description:
      "Free AI-powered App Store review analysis tool. Analyze thousands of reviews across 175+ regions, extract sentiment, keywords, and get prioritized action items.",
    url: "https://reviewai.app",
    siteName: "ReviewAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReviewAI - App Store Review Analysis Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewAI - Transform App Reviews Into Actionable Insights",
    description: "Free AI-powered App Store review analysis tool. Analyze thousands of reviews across 175+ regions.",
    images: ["/og-image.png"],
    creator: "@reviewai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}

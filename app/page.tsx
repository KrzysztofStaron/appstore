"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Globe,
  Sparkles,
  Play,
  ArrowRight,
  CheckCircle,
  Github,
  Brain,
  Target,
  Download,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const stats: Array<{ label: string; value: string; icon: any; color: string }> = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-zinc-300" />
          </div>
          <span className="text-lg md:text-xl font-bold text-white">ReviewAI</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
          >
            Features
          </Button>
          <a href="https://github.com/KrzysztofStaron/appstore" target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </a>
          <Link href="/app">
            <Button className="bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg">
              Try App
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-gradient-to-r from-slate-800/50 to-zinc-900/30 border border-slate-600/50 text-slate-200"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden relative z-10 px-4 pb-4">
          <div className="bg-gradient-to-r from-slate-800/90 to-zinc-900/90 backdrop-blur-xl border border-slate-600/50 rounded-lg p-4 space-y-3">
            <Button
              variant="ghost"
              className="w-full bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
            >
              Features
            </Button>
            <a href="https://github.com/KrzysztofStaron/appstore" target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                className="w-full bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
            <Link href="/app">
              <Button className="w-full bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg">
                Try App
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-32">
        <div className="text-center flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh]">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 md:mb-8 text-center leading-tight">
            <span className="text-white">Transform</span>
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">App Reviews</span>
            <br />
            <span className="text-white">Into </span>
            <span className="text-white">Actionable</span>
            <span className="text-white"> Insights</span>
          </h1>

          <p className="text-base md:text-xl text-zinc-400 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Drop your App ID and watch ReviewAI analyze thousands of reviews across 175+ regions, delivering instant
            insights, sentiment analysis, and prioritized action items—all for free!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 md:mb-20 w-full px-4">
            <Link href="/app" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg px-6 md:px-8 py-4 text-base md:text-lg"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Try App
              </Button>
            </Link>
            <a
              href="https://github.com/KrzysztofStaron/appstore"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg px-6 md:px-8 py-4 text-base md:text-lg"
              >
                <Github className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                View on GitHub
              </Button>
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto px-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color} mr-2`} />
                  <span className="text-xl md:text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-xs md:text-sm text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-40">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">How it works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16 md:mb-20">
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <span className="text-white font-bold text-lg md:text-xl">1</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Enter App ID</h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed px-4">
              Paste your App ID or search by name—we'll automatically fetch the app details.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <span className="text-white font-bold text-lg md:text-xl">2</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">AI Analysis</h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed px-4">
              Our AI analyzes thousands of reviews, extracting sentiment, keywords, and insights.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <span className="text-white font-bold text-lg md:text-xl">3</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Get Insights</h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed px-4">
              Receive actionable recommendations, trend analysis, and prioritized improvement suggestions.
            </p>
          </div>
        </div>

        {/* Open Source Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center pt-12 md:pt-20">
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">Open Source & Free</h2>
            <p className="text-base md:text-lg lg:text-xl text-zinc-400 mb-6 md:mb-8 leading-relaxed">
              This project is completely free and open source. Clone the repository, set up your environment, and start
              analyzing App Store reviews in minutes.
            </p>
            <div className="space-y-3 md:space-y-4 lg:space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm md:text-base text-zinc-300">Real-time analysis across 175+ regions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm md:text-base text-zinc-300">AI-powered sentiment and keyword extraction</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm md:text-base text-zinc-300">Prioritized actionable insights</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm md:text-base text-zinc-300">Export reports and share insights</span>
              </div>
            </div>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/app" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg"
                >
                  Try App
                </Button>
              </Link>
              <a
                href="https://github.com/KrzysztofStaron/appstore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
                >
                  <Github className="w-4 h-4 mr-2" />
                  View Source
                </Button>
              </a>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="h-3 md:h-4 bg-zinc-700/50 rounded animate-pulse"></div>
                <div className="h-3 md:h-4 bg-zinc-700/50 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 md:h-4 bg-zinc-700/50 rounded w-1/2 animate-pulse"></div>
                <div className="h-24 md:h-32 bg-zinc-700/30 rounded-lg mt-4 md:mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-40 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
          Ready to Transform Your App Reviews?
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-zinc-400 mb-6 md:mb-8 px-4">
          Start analyzing your app reviews with AI-powered insights today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 md:mb-8 w-full px-4">
          <Link href="/app" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg px-6 md:px-8 py-4 text-base md:text-lg"
            >
              Try App Now
            </Button>
          </Link>
          <a
            href="https://github.com/KrzysztofStaron/appstore"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg px-6 md:px-8 py-4 text-base md:text-lg"
            >
              <Github className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              View on GitHub
            </Button>
          </a>
        </div>

        <p className="text-xs md:text-sm text-zinc-500">100% Free • Open Source • No Registration Required</p>
      </div>

      {/* Bottom Spacing */}
      <div className="h-12 md:h-20"></div>
    </div>
  );
}

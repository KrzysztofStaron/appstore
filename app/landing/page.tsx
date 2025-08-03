"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Globe, Sparkles, Play, ArrowRight, CheckCircle, Github } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const stats = [
    { label: "App Store Regions", value: "175+", icon: Globe, color: "text-blue-400" },
    { label: "Analysis Views", value: "8+", icon: BarChart3, color: "text-green-400" },
  ];

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
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-zinc-300" />
          </div>
          <span className="text-xl font-bold text-white">Analytics Hub</span>
        </div>

        <div className="flex items-center gap-4">
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
          <Link href="/">
            <Button className="bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg">
              Try App
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            <span className="text-white">Transform</span>
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">App Reviews</span>
            <br />
            <span className="text-white">Into </span>
            <span className="text-white">Actionable</span>
            <span className="text-white"> Insights</span>
          </h1>

          <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Drop your app ID and watch AI analyze thousands of reviews across 175+ regions. Get instant insights,
            sentiment analysis, and prioritized action items. Completely free and open source.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Try App
              </Button>
            </Link>
            <a href="https://github.com/KrzysztofStaron/appstore" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg px-8 py-4 text-lg"
              >
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className={`w-6 h-6 ${stat.color} mr-2`} />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Get started in minutes with our simple 3-step process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800/50 to-zinc-900/30 border border-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Enter App ID</h3>
            <p className="text-zinc-400 leading-relaxed">
              Simply paste your App Store ID or search for your app by name. We'll automatically fetch the app details.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
            <p className="text-zinc-400 leading-relaxed">
              Our AI analyzes thousands of reviews across 175+ regions, extracting sentiment, keywords, and insights.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Get Insights</h3>
            <p className="text-zinc-400 leading-relaxed">
              Receive actionable recommendations, trend analysis, and prioritized improvement suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">Open Source & Free</h2>
            <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
              This project is completely free and open source. Clone the repository, set up your environment, and start
              analyzing App Store reviews in minutes.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-zinc-300">Real-time analysis across 175+ regions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-zinc-300">AI-powered sentiment and keyword extraction</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-zinc-300">Prioritized actionable insights</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-zinc-300">Export reports and share insights</span>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg"
                >
                  Try App
                </Button>
              </Link>
              <a href="https://github.com/KrzysztofStaron/appstore" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg"
                >
                  <Github className="w-4 h-4 mr-2" />
                  View Source
                </Button>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-zinc-700/50 rounded animate-pulse"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-1/2 animate-pulse"></div>
                <div className="h-32 bg-zinc-700/30 rounded-lg mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your App Reviews?</h2>
        <p className="text-xl text-zinc-400 mb-8">Start analyzing your app reviews with AI-powered insights today.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg px-8 py-4 text-lg"
            >
              Try App Now
            </Button>
          </Link>
          <a href="https://github.com/KrzysztofStaron/appstore" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              variant="outline"
              className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg px-8 py-4 text-lg"
            >
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
          </a>
        </div>

        <p className="text-sm text-zinc-500">100% Free • Open Source • No Registration Required</p>
      </div>
    </div>
  );
}

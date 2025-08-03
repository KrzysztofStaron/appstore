"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Download,
  Settings,
  AlertCircle,
  ChevronRight,
  Brain,
  TrendingUp,
  Zap,
  Globe,
  Layers,
  Target,
  X,
} from "lucide-react";
import { ViewType, AppMetadata } from "@/app/types";
import { AppConfigModal } from "@/components/AppConfigModal";

interface SidebarProps {
  appId: string;
  setAppId: (id: string) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  handleAnalyze: () => void;
  exportData: () => void;
  isPending: boolean;
  isAnalyzing: boolean;
  progress: number;
  regionProgress: { current: number; total: number } | null;
  currentStage: string;
  progressDetails: string;
  error: string | null;
  appMetadata: AppMetadata | null;
  reviews: any[];
  isConfigModalOpen: boolean;
  setIsConfigModalOpen: (open: boolean) => void;
  onCloseMobile?: () => void;
}

const sidebarItems = [
  { id: "dashboard", label: "Overview", icon: BarChart3, color: "text-blue-400" },
  { id: "sentiment", label: "Sentiment", icon: Brain, color: "text-green-400" },
  { id: "trends", label: "Trends", icon: TrendingUp, color: "text-purple-400" },
  { id: "keywords", label: "Keywords", icon: Zap, color: "text-yellow-400" },
  { id: "regions", label: "Regions", icon: Globe, color: "text-cyan-400" },
  { id: "versions", label: "Versions", icon: Layers, color: "text-orange-400" },
  { id: "issues", label: "Issues", icon: AlertCircle, color: "text-red-400" },
  { id: "tasks", label: "Actionable Steps", icon: Target, color: "text-red-400" },
];

export function Sidebar({
  appId,
  setAppId,
  selectedRegions,
  setSelectedRegions,
  currentView,
  setCurrentView,
  handleAnalyze,
  exportData,
  isPending,
  isAnalyzing,
  progress,
  regionProgress,
  currentStage,
  progressDetails,
  error,
  appMetadata,
  reviews,
  isConfigModalOpen,
  setIsConfigModalOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    // Close mobile sidebar when a view is selected
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className="w-80 md:w-80 bg-black/50 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Analytics Hub</h1>
              <p className="text-xs text-zinc-400">App Store Intelligence</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-lg bg-gradient-to-r from-slate-800/50 to-zinc-900/30 border border-slate-600/50 text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* App Configuration Button */}
        <div className="space-y-3 md:space-y-4">
          <Button
            onClick={() => setIsConfigModalOpen(true)}
            className="w-full bg-gradient-to-r from-slate-800/50 to-zinc-900/30 border border-slate-600/50 text-slate-200 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-800 hover:text-white transition-all duration-200 shadow-lg text-sm md:text-base"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure App
          </Button>
        </div>
      </div>

      {/* App Info */}
      {appMetadata && (
        <div className="p-4 md:p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            {appMetadata.artworkUrl100 ? (
              <img
                src={appMetadata.artworkUrl100}
                alt={appMetadata.trackName}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover"
                onError={e => {
                  // Fallback to gradient if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center ${
                appMetadata.artworkUrl100 ? "hidden" : ""
              }`}
            >
              <span className="text-white font-bold text-base md:text-lg">{appMetadata.trackName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-sm md:text-base text-white font-semibold">{appMetadata.trackName}</h3>
              <p className="text-xs text-zinc-400">{appMetadata.sellerName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="bg-zinc-900/30 rounded-lg p-2 md:p-3">
              <div className="text-base md:text-lg font-bold text-yellow-400">
                {appMetadata.averageUserRating.toFixed(2)}
              </div>
              <div className="text-xs text-zinc-400">Rating</div>
            </div>
            <div className="bg-zinc-900/30 rounded-lg p-2 md:p-3">
              <div className="text-base md:text-lg font-bold text-blue-400">
                {(appMetadata.userRatingCount / 1000).toFixed(2)}K
              </div>
              <div className="text-xs text-zinc-400">Reviews</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-3 md:p-4">
        <div className="space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id as ViewType)}
                disabled={isAnalyzing}
                className={`w-full flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-zinc-800/50 text-white border border-zinc-700/50" : "text-zinc-400"
                } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : "hover:text-white"}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? item.color : ""}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
                {isAnalyzing && isActive && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 md:p-4 border-t border-zinc-800/50">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={!reviews.length}
            className="flex-1 bg-transparent border-zinc-700 text-zinc-300 h-8 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

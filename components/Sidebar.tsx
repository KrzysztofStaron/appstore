"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Download,
  Settings,
  AlertCircle,
  Play,
  Pause,
  ChevronRight,
  Brain,
  TrendingUp,
  Zap,
  Globe,
  Layers,
  Target,
  Sparkles,
} from "lucide-react";
import { ViewType, AppMetadata } from "@/app/types";

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
  error: string | null;
  appMetadata: AppMetadata | null;
  reviews: any[];
}

const sidebarItems = [
  { id: "dashboard", label: "Overview", icon: BarChart3, color: "text-blue-400" },
  { id: "sentiment", label: "Sentiment", icon: Brain, color: "text-green-400" },
  { id: "trends", label: "Trends", icon: TrendingUp, color: "text-purple-400" },
  { id: "keywords", label: "Keywords", icon: Zap, color: "text-yellow-400" },
  { id: "regions", label: "Regions", icon: Globe, color: "text-cyan-400" },
  { id: "versions", label: "Versions", icon: Layers, color: "text-orange-400" },
  { id: "issues", label: "Issues", icon: AlertCircle, color: "text-red-400" },
  { id: "tasks", label: "AI Action Items", icon: Target, color: "text-red-400" },
  { id: "insights", label: "AI Insights", icon: Sparkles, color: "text-pink-400" },
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
  error,
  appMetadata,
  reviews,
}: SidebarProps) {
  return (
    <div className="w-80 bg-black/50 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Analytics Hub</h1>
            <p className="text-xs text-zinc-400">App Store Intelligence</p>
          </div>
        </div>

        {/* App Configuration */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-zinc-300 mb-2 block">App Store ID</Label>
            <Input
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder="Enter App ID"
              className="bg-zinc-900/50 border-zinc-700 text-white text-sm h-9"
            />
          </div>

          <div>
            <Label className="text-sm text-zinc-300 mb-2 block">Regions</Label>
            <Select value={selectedRegions.join(",")} onValueChange={value => setSelectedRegions(value.split(","))}>
              <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">🌐 Global (175 regions)</SelectItem>
                <SelectItem value="us,gb,ca">🌍 Major Markets</SelectItem>
                <SelectItem value="us">🇺🇸 US Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRegions.includes("all") && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">All Regions Selected</span>
              </div>
              <p className="text-sm text-yellow-200 mt-1">
                This will fetch reviews from all 175 App Store regions. This may take several minutes.
              </p>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isPending || !appId.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-9 text-sm"
          >
            {isAnalyzing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{currentStage || "Processing reviews..."}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1 bg-zinc-800" />
              {regionProgress && (
                <div className="text-xs text-zinc-500">
                  Region {regionProgress.current} of {regionProgress.total} (
                  {Math.round((regionProgress.current / regionProgress.total) * 100)}%)
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert className="bg-red-900/20 border-red-600/50 text-red-200 p-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* App Info */}
      {appMetadata && (
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{appMetadata.trackName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{appMetadata.trackName}</h3>
              <p className="text-xs text-zinc-400">{appMetadata.sellerName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/30 rounded-lg p-3">
              <div className="text-lg font-bold text-yellow-400">{appMetadata.averageUserRating.toFixed(1)}</div>
              <div className="text-xs text-zinc-400">Rating</div>
            </div>
            <div className="bg-zinc-900/30 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-400">{(appMetadata.userRatingCount / 1000).toFixed(1)}K</div>
              <div className="text-xs text-zinc-400">Reviews</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800/50 text-white border border-zinc-700/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? item.color : ""}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={!reviews.length}
            className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { X, Play, AlertCircle, Settings } from "lucide-react";
import { AppSelector } from "@/components/AppSelector";
import { AppMetadata } from "@/app/types";

interface AppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  setAppId: (id: string) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  handleAnalyze: () => void;
  isPending: boolean;
  isAnalyzing: boolean;
  progress: number;
  regionProgress: { current: number; total: number } | null;
  currentStage: string;
  progressDetails: string;
  error: string | null;
}

export function AppConfigModal({
  isOpen,
  onClose,
  appId,
  setAppId,
  selectedRegions,
  setSelectedRegions,
  handleAnalyze,
  isPending,
  isAnalyzing,
  progress,
  regionProgress,
  currentStage,
  progressDetails,
  error,
}: AppConfigModalProps) {
  const [selectedApp, setSelectedApp] = useState<AppMetadata | null>(null);

  // Fetch app metadata when appId changes
  useEffect(() => {
    if (appId && appId.trim()) {
      fetchAppMetadata(appId);
    } else {
      setSelectedApp(null);
    }
  }, [appId]);

  const fetchAppMetadata = async (appId: string) => {
    try {
      const response = await fetch(`/api/search?q=${appId}`);
      if (response.ok) {
        const data = await response.json();
        const app = data.apps?.find((app: any) => app.trackId.toString() === appId);
        if (app) {
          setSelectedApp({
            trackName: app.trackName,
            sellerName: app.sellerName,
            primaryGenreName: app.primaryGenreName,
            averageUserRating: app.averageUserRating,
            userRatingCount: app.userRatingCount,
            artworkUrl100: app.artworkUrl100,
            artworkUrl512: app.artworkUrl512,
            version: app.version,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching app metadata:", error);
      setSelectedApp(null);
    }
  };

  // Close modal when analysis is complete
  React.useEffect(() => {
    // Close modal when analysis is complete
    if (isOpen && !isAnalyzing && !error) {
      // If progress is 100%, close immediately
      if (progress === 100) {
        const timer = setTimeout(() => {
          onClose();
        }, 1000);
        return () => clearTimeout(timer);
      }
      // If progress is >= 95%, close with delay
      else if (progress >= 95) {
        const timer = setTimeout(() => {
          onClose();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, isAnalyzing, progress, error, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-zinc-900/95 to-black/95 border border-zinc-800/50 rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-xl flex items-center justify-center">
              <Settings className="h-4 w-4 md:h-6 md:w-6 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">App Configuration</h2>
              <p className="text-xs md:text-sm text-zinc-400">Configure your analysis settings</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4 md:space-y-6">
          <div>
            <Label className="text-xs md:text-sm text-zinc-300 mb-2 block">Search App</Label>
            <AppSelector onAppSelect={setAppId} currentAppId={appId} selectedApp={selectedApp || undefined} />
          </div>

          <div>
            <Label className="text-xs md:text-sm text-zinc-300 mb-2 block">App Store ID</Label>
            <Input
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder="Enter App ID manually"
              className="bg-zinc-900/50 border-zinc-700 text-white text-sm h-9 md:h-10"
            />
          </div>

          <div>
            <Label className="text-xs md:text-sm text-zinc-300 mb-2 block">Regions</Label>
            <Select value={selectedRegions.join(",")} onValueChange={value => setSelectedRegions(value.split(","))}>
              <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white text-sm h-9 md:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectItem value="all">🌐 Global (175 regions)</SelectItem>
                <SelectItem value="us,gb,ca">🌍 Major Markets</SelectItem>
                <SelectItem value="us">🇺🇸 US Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRegions.includes("all") && (
            <Alert className="bg-yellow-900/20 border-yellow-600/50 text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                <span className="font-medium">All Regions Selected</span>
                <br />
                This will fetch reviews from all 175 App Store regions. This may take several minutes.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isPending || isAnalyzing || !appId.trim()}
            className="w-full bg-gradient-to-r from-blue-800/70 to-sky-900/50 border border-slate-600/50 text-slate-200 hover:from-blue-700 hover:via-sky-700 hover:to-sky-800 hover:text-white transition-all duration-200 shadow-lg h-9 md:h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between text-xs md:text-sm text-zinc-400">
                <span>{currentStage || "Processing reviews..."}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-zinc-800" />
              {progressDetails && <div className="text-xs md:text-sm text-zinc-500">{progressDetails}</div>}
              {regionProgress && !progressDetails && (
                <div className="text-xs md:text-sm text-zinc-500">
                  Region {regionProgress.current} of {regionProgress.total} (
                  {Math.round((regionProgress.current / regionProgress.total) * 100)}%)
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

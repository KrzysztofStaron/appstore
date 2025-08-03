"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { AppStoreReview, AppMetadata } from "@/app/types";
import { getSortedVersions } from "@/lib/utils";

interface VersionSliderProps {
  reviews: AppStoreReview[];
  appMetadata?: AppMetadata | null;
  onVersionChange: (minVersion: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  title?: string;
  description?: string;
}

export function VersionSlider({
  reviews,
  appMetadata,
  onVersionChange,
  onRegenerate,
  isRegenerating = false,
  title = "Version Filter",
  description,
}: VersionSliderProps) {
  const [minVersion, setMinVersion] = useState<string>("0.0");
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  // Initialize versions and default filter
  useEffect(() => {
    const versions = getSortedVersions(reviews);
    setAvailableVersions(versions);

    if (versions.length > 0) {
      // Get the newest version from metadata if available, otherwise use the latest from reviews
      const newestVersion = appMetadata?.version || versions[versions.length - 1];

      // Find the index of the newest version in our available versions
      const newestIndex = versions.findIndex(v => v === newestVersion);

      // Set default to halfway between the oldest and newest version
      const defaultIndex = newestIndex >= 0 ? Math.floor(newestIndex / 2) : Math.floor(versions.length / 2);
      setSelectedVersionIndex(defaultIndex);
      const defaultMinVersion = versions[defaultIndex];
      setMinVersion(defaultMinVersion);
      onVersionChange(defaultMinVersion);
    }
  }, [reviews, appMetadata, onVersionChange]);

  // Handle version slider change
  const handleVersionChange = (value: number[]) => {
    const index = value[0];
    setSelectedVersionIndex(index);
    const newMinVersion = availableVersions[index] || "0.0";
    setMinVersion(newMinVersion);
    onVersionChange(newMinVersion);
  };

  if (availableVersions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-black/30 border-zinc-800/50 backdrop-blur-sm mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">
              {description ||
                (minVersion === availableVersions[0]
                  ? "Analyze all reviews from all versions"
                  : `Include reviews from version ${minVersion} and newer`)}
            </p>
          </div>
          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              disabled={isRegenerating}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating..." : "Apply Filter"}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-300">Minimum Version</Label>
            <span className="text-sm font-mono text-blue-400">{minVersion}</span>
          </div>

          <Slider
            value={[selectedVersionIndex]}
            onValueChange={handleVersionChange}
            max={availableVersions.length - 1}
            min={0}
            step={1}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-zinc-500">
            <span>Oldest</span>
            <span>{availableVersions[Math.floor(availableVersions.length / 2)] || "0.0"}</span>
            <span>Newest</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

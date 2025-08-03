"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSelector } from "@/components/AppSelector";
import { AppMetadata } from "@/app/types";

export function AppSelectorDemo() {
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<AppMetadata | null>(null);

  const handleAppSelect = async (appId: string) => {
    setSelectedAppId(appId);

    // Fetch app metadata
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
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">App Selector Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Select an App</label>
            <AppSelector
              onAppSelect={handleAppSelect}
              currentAppId={selectedAppId}
              selectedApp={selectedApp || undefined}
            />
          </div>

          {selectedApp && (
            <div className="mt-6 p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Selected App Details:</h3>
              <div className="text-xs text-zinc-400 space-y-1">
                <p>
                  <strong>Name:</strong> {selectedApp.trackName}
                </p>
                <p>
                  <strong>Developer:</strong> {selectedApp.sellerName}
                </p>
                <p>
                  <strong>Category:</strong> {selectedApp.primaryGenreName}
                </p>
                <p>
                  <strong>Rating:</strong> {selectedApp.averageUserRating}/5 ({selectedApp.userRatingCount} reviews)
                </p>
                <p>
                  <strong>Version:</strong> {selectedApp.version}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

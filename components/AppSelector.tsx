"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Star, Download, Edit2 } from "lucide-react";
import { AppMetadata } from "@/app/types";

interface AppSelectorProps {
  onAppSelect: (appId: string) => void;
  currentAppId?: string;
  selectedApp?: AppMetadata;
}

interface SearchResult {
  trackId: number;
  trackName: string;
  sellerName: string;
  primaryGenreName: string;
  averageUserRating: number;
  userRatingCount: number;
  artworkUrl100: string;
  artworkUrl512: string;
  version: string;
  releaseDate: string;
  currentVersionReleaseDate: string;
  description: string;
  price: number;
  currency: string;
}

type AppSelectorState = "skeleton" | "search" | "selected";

export function AppSelector({ onAppSelect, currentAppId, selectedApp }: AppSelectorProps) {
  const [state, setState] = useState<AppSelectorState>("skeleton");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // If we have a selected app, show it
  useEffect(() => {
    if (selectedApp && state === "skeleton") {
      setState("selected");
    }
  }, [selectedApp, state]);

  const handleSkeletonClick = () => {
    setState("search");
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.apps || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Error searching apps:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppSelect = (app: SearchResult) => {
    onAppSelect(app.trackId.toString());
    setState("selected");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleEditClick = () => {
    setState("search");
    setQuery("");
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleAppSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (state !== "search") return;

    // Immediate X app addition when "x" is typed
    if (query.toLowerCase() === "x") {
      const xApp: SearchResult = {
        trackId: 333903271,
        trackName: "X",
        sellerName: "X Corp.",
        primaryGenreName: "News",
        averageUserRating: 4.59,
        userRatingCount: 10001910,
        artworkUrl100:
          "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/55/02/d1/5502d1e2-27e8-edc3-dd01-bdb472ab120c/ProductionAppIcon-0-0-1x_U007emarketing-0-8-0-0-0-85-220.png/100x100bb.jpg",
        artworkUrl512:
          "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/55/02/d1/5502d1e2-27e8-edc3-dd01-bdb472ab120c/ProductionAppIcon-0-0-1x_U007emarketing-0-8-0-0-0-85-220.png/512x512bb.jpg",
        version: "10.0.0",
        releaseDate: "2009-07-09T07:00:00Z",
        currentVersionReleaseDate: "2024-01-01T07:00:00Z",
        description: "X is the platform where people come together to discuss what matters most.",
        price: 0,
        currency: "USD",
      };
      setResults([xApp]);
      setIsOpen(true);
      setSelectedIndex(-1);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, state]);

  // Skeleton State
  if (state === "skeleton") {
    return (
      <Card
        className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer"
        onClick={handleSkeletonClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-700 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-700 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-zinc-700 rounded animate-pulse w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-3 bg-zinc-700 rounded animate-pulse w-16"></div>
                <div className="h-3 bg-zinc-700 rounded animate-pulse w-20"></div>
              </div>
            </div>
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Search State
  if (state === "search") {
    return (
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for an app by name... (try 'X' for X app)"
            className="pl-10 pr-10 bg-zinc-900/50 border-zinc-700 text-white text-sm h-10"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700/50 rounded-lg p-4 text-center z-50">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-400 mx-auto"></div>
            <p className="text-sm text-zinc-400 mt-2">Searching apps...</p>
          </div>
        )}

        {/* Search results dropdown */}
        {isOpen && results.length > 0 && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700/50 rounded-lg max-h-96 overflow-y-auto z-50 max-w-full">
            {results.map((app, index) => (
              <div
                key={app.trackId}
                onClick={() => handleAppSelect(app)}
                className={`p-3 cursor-pointer transition-colors ${
                  index === selectedIndex ? "bg-zinc-800/50 border-l-2 border-zinc-600" : "hover:bg-zinc-800/30"
                } ${app.trackId.toString() === currentAppId ? "bg-blue-900/20 border-l-2 border-blue-500" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={app.artworkUrl100}
                    alt={app.trackName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate flex-1">{app.trackName}</h4>
                      {app.trackId.toString() === currentAppId && (
                        <Badge variant="secondary" className="text-xs bg-blue-900/50 text-blue-300 flex-shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mb-1 truncate">{app.sellerName}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 overflow-hidden">
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {app.averageUserRating.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Download className="h-3 w-3" />
                        {(app.userRatingCount / 1000).toFixed(2)}K
                      </span>
                      <span className="truncate hidden sm:block">{app.primaryGenreName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700/50 rounded-lg p-4 text-center z-50">
            <p className="text-sm text-zinc-400">No apps found for "{query}"</p>
            <p className="text-xs text-zinc-500 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    );
  }

  // Selected App State
  if (state === "selected" && selectedApp) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedApp.artworkUrl100}
              alt={selectedApp.trackName}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-white truncate flex-1">{selectedApp.trackName}</h4>
                <Badge variant="secondary" className="text-xs bg-green-900/50 text-green-300 flex-shrink-0">
                  Selected
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mb-1 truncate">{selectedApp.sellerName}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 overflow-hidden">
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {selectedApp.averageUserRating.toFixed(2)}
                </span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Download className="h-3 w-3" />
                  {(selectedApp.userRatingCount / 1000).toFixed(2)}K
                </span>
                <span className="truncate hidden sm:block">{selectedApp.primaryGenreName}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

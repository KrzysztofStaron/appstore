"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Star, Download } from "lucide-react";
import { AppMetadata } from "@/app/types";

interface AppSearchProps {
  onAppSelect: (appId: string) => void;
  currentAppId?: string;
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

export function AppSearch({ onAppSelect, currentAppId }: AppSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search apps with debouncing
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
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
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
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

  const handleAppSelect = (app: SearchResult) => {
    onAppSelect(app.trackId.toString());
    setQuery(app.trackName);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for an app by name..."
          className="pl-10 pr-10 bg-zinc-900/50 border-zinc-700 text-white text-sm h-9 md:h-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700/50 rounded-lg p-3 md:p-4 text-center z-50">
          <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-zinc-400 mx-auto"></div>
          <p className="text-xs md:text-sm text-zinc-400 mt-2">Searching apps...</p>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && results.length > 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700/50 rounded-lg max-h-80 md:max-h-96 overflow-y-auto z-50 max-w-full">
          {results.map((app, index) => (
            <div
              key={app.trackId}
              onClick={() => handleAppSelect(app)}
              className={`p-3 cursor-pointer transition-colors ${
                index === selectedIndex ? "bg-zinc-800/50 border-l-2 border-zinc-600" : "hover:bg-zinc-800/30"
              } ${app.trackId.toString() === currentAppId ? "bg-blue-900/20 border-l-2 border-blue-500" : ""}`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <img
                  src={app.artworkUrl100}
                  alt={app.trackName}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs md:text-sm font-medium text-white truncate flex-1">{app.trackName}</h4>
                    {app.trackId.toString() === currentAppId && (
                      <Badge variant="secondary" className="text-xs bg-blue-900/50 text-blue-300 flex-shrink-0">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mb-1 truncate">{app.sellerName}</p>
                  <div className="flex items-center gap-2 md:gap-3 text-xs text-zinc-500 overflow-hidden">
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700/50 rounded-lg p-3 md:p-4 text-center z-50">
          <p className="text-xs md:text-sm text-zinc-400">No apps found for "{query}"</p>
          <p className="text-xs text-zinc-500 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

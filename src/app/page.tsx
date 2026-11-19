'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  Flame,
  Clock,
  Navigation,
  Loader2,
  PlusSquare,
  Globe,
} from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/components/AuthProvider';
import { detectBrowserLocation } from '@/lib/locationClient';
import { POPULAR_CITIES, type PostData } from '@/types/archive';

interface LocationFacet {
  locationText: string;
  city: string;
  countryCode: string;
  count: number;
  latitude?: number | null;
  longitude?: number | null;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FeedPage() {
  const router = useRouter();
  const { user, openSignInModal } = useAuth();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [locations, setLocations] = useState<LocationFacet[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [nearestLocation, setNearestLocation] = useState<string | null>(null);
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [detectingNearMe, setDetectingNearMe] = useState(false);
  const [nearMeMessage, setNearMeMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (selectedLocation !== 'all') params.set('location', selectedLocation);
    params.set('sort', sort);
    params.set('limit', '8');
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    fetch(`/api/posts?${params.toString()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setPosts(data.posts || []);
        setLocations(data.locations || []);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((err) => {
        console.error('Failed to load feed:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLocation, sort, searchQuery]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (selectedLocation !== 'all') params.set('location', selectedLocation);
      params.set('sort', sort);
      params.set('limit', '8');
      params.set('offset', String(posts.length));
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/posts?${params.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [...prev, ...(data.posts || [])]);
        setHasMore(Boolean(data.hasMore));
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const findClosestRegion = (
    lat?: number | null,
    lng?: number | null,
    city?: string,
    locationText?: string,
  ): string => {
    // 1. Direct city or locationText match in existing feed locations
    if (city || locationText) {
      const exact = locations.find(
        (l) =>
          (city && l.city.toLowerCase() === city.toLowerCase()) ||
          (locationText &&
            l.locationText.toLowerCase() === locationText.toLowerCase()),
      );
      if (exact) return exact.locationText;
    }

    // 2. Minimum Haversine distance among existing feed locations (with fallback to POPULAR_CITIES coords)
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      let bestLoc: string | null = null;
      let bestDist = Infinity;

      for (const l of locations) {
        const known = POPULAR_CITIES.find(
          (c) =>
            c.locationText.toLowerCase() === l.locationText.toLowerCase() ||
            c.city.toLowerCase() === l.city.toLowerCase(),
        );
        const targetLat = l.latitude ?? known?.latitude ?? null;
        const targetLng = l.longitude ?? known?.longitude ?? null;
        if (targetLat == null || targetLng == null) continue;

        const d = haversineKm(lat, lng, targetLat, targetLng);
        if (d < bestDist) {
          bestDist = d;
          bestLoc = l.locationText;
        }
      }

      if (bestLoc) return bestLoc;

      // Fallback to POPULAR_CITIES if locations list is empty
      for (const c of POPULAR_CITIES) {
        if (c.latitude == null || c.longitude == null) continue;
        const d = haversineKm(lat, lng, c.latitude, c.longitude);
        if (d < bestDist) {
          bestDist = d;
          bestLoc = c.locationText;
        }
      }
      if (bestLoc) return bestLoc;
    }

    return locationText || locations[0]?.locationText || 'Seoul, KR';
  };

  const handleNearMe = async () => {
    // If already filtering by a specific region, clicking again resets to All Regions
    if (selectedLocation !== 'all' && nearestLocation === selectedLocation) {
      setSelectedLocation('all');
      setNearMeMessage(null);
      return;
    }

    setDetectingNearMe(true);
    setNearMeMessage(null);
    try {
      const loc = await detectBrowserLocation();
      const closest = findClosestRegion(
        loc.latitude,
        loc.longitude,
        loc.city,
        loc.locationText,
      );
      setNearestLocation(closest);
      setSelectedLocation(closest);
    } catch {
      const fallback = locations[0]?.locationText || 'Seoul, KR';
      setNearestLocation(fallback);
      setSelectedLocation(fallback);
      setNearMeMessage(
        `Location access unavailable — showing nearest default region (${fallback}).`,
      );
    } finally {
      setDetectingNearMe(false);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      openSignInModal('/archive');
    } else {
      router.push('/archive');
    }
  };

  const activeRegionLabel =
    selectedLocation !== 'all' ? selectedLocation : nearestLocation;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero / SNS Banner */}
      <section className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-5 shadow-sm sm:flex-row sm:items-center sm:p-7">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
            <Globe className="h-3.5 w-3.5" />
            TASTORY · Explore Taste Stories by City
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl">
            Where your taste becomes your story (2021–2025).
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Browse 5-year media, music, book, and game stories tagged by city,
            remix stories you love, or publish your own taste story.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-[#f7f9f2] shadow-md transition hover:bg-amber-500"
        >
          <PlusSquare className="h-4 w-4" />
          Create My Story
        </button>
      </section>

      {/* Filter & Location Bar */}
      <section className="mb-6 space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute top-3 left-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, caption, or city..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* All Regions, Near Me (with nearest region inside), and Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedLocation('all');
                setNearMeMessage(null);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                selectedLocation === 'all'
                  ? 'bg-amber-400 text-[#f7f9f2] shadow-sm'
                  : 'border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              All Regions
            </button>

            <button
              type="button"
              onClick={handleNearMe}
              disabled={detectingNearMe}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 ${
                selectedLocation !== 'all'
                  ? 'bg-amber-400 text-[#f7f9f2] shadow-md shadow-amber-400/15'
                  : 'border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
              }`}
            >
              {detectingNearMe ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5" />
              )}
              <span>
                {activeRegionLabel
                  ? `Near Me · ${activeRegionLabel}`
                  : 'Near Me'}
              </span>
            </button>

            <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setSort('latest')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  sort === 'latest'
                    ? 'bg-amber-400 text-[#f7f9f2]'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Latest
              </button>
              <button
                type="button"
                onClick={() => setSort('popular')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  sort === 'popular'
                    ? 'bg-amber-400 text-[#f7f9f2]'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                Most Liked
              </button>
            </div>
          </div>
        </div>

        {nearMeMessage && (
          <p className="text-xs font-medium text-amber-300">{nearMeMessage}</p>
        )}
      </section>

      {/* Feed Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-[540px] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-20 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-zinc-600" />
          <h2 className="text-lg font-bold text-zinc-100">
            No taste stories found for this filter
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-400">
            Try switching back to All Regions or publish the first story from
            this area!
          </p>
          <div className="mt-5 flex gap-3">
            {selectedLocation !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedLocation('all')}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-100 hover:bg-zinc-800"
              >
                Show All Regions
              </button>
            )}
            <button
              type="button"
              onClick={handleCreateClick}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#f7f9f2] hover:bg-amber-500"
            >
              Create Story
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSelectLocation={(loc) => {
                  setNearestLocation(loc);
                  setSelectedLocation(loc);
                }}
                onDeleted={(deletedId) =>
                  setPosts((prev) => prev.filter((p) => p.id !== deletedId))
                }
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-xs font-bold text-zinc-100 transition hover:border-amber-400/60 hover:bg-zinc-800 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? 'Loading more stories...' : 'Load More Stories'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

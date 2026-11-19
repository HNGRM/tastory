'use client';

import React, { useEffect, useState } from 'react';
import { X, MapPin, Loader2, Globe, Send } from 'lucide-react';
import { POPULAR_CITIES, type LocationInfo } from '@/types/archive';
import { detectBrowserLocation } from '@/lib/locationClient';
import { ModalBackdrop } from '@/components/ModalBackdrop';

interface PublishModalProps {
  isEditing: boolean;
  initialCaption?: string;
  initialLocation?: LocationInfo | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { caption: string; location: LocationInfo }) => void;
}

export function PublishModal({
  isEditing,
  initialCaption = '',
  initialLocation = null,
  submitting,
  onClose,
  onConfirm,
}: PublishModalProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [location, setLocation] = useState<LocationInfo>(
    initialLocation || POPULAR_CITIES[0],
  );
  const [detecting, setDetecting] = useState(!initialLocation);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const handleDetectLocation = async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const detected = await detectBrowserLocation();
      setLocation(detected);
      setManualMode(false);
    } catch (err) {
      setDetectError(
        err instanceof Error
          ? err.message
          : 'Could not detect location. Please pick a city manually.',
      );
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (initialLocation) return;
    let active = true;
    detectBrowserLocation()
      .then((detected) => {
        if (!active) return;
        setLocation(detected);
        setManualMode(false);
      })
      .catch((err) => {
        if (!active) return;
        setDetectError(
          err instanceof Error
            ? err.message
            : 'Could not detect location. Please pick a city manually.',
        );
      })
      .finally(() => {
        if (active) setDetecting(false);
      });
    return () => {
      active = false;
    };
  }, [initialLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalLocation = location;
    if (manualMode && customCity.trim()) {
      const city = customCity.trim();
      const country = customCountry.trim() || 'Earth';
      finalLocation = {
        city,
        country,
        countryCode: country.slice(0, 2).toUpperCase(),
        locationText: `${city}, ${country}`,
        latitude: null,
        longitude: null,
      };
    }
    onConfirm({ caption: caption.trim(), location: finalLocation });
  };

  return (
    <ModalBackdrop
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClose={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              {isEditing ? 'Update Published Story' : 'Publish to TASTORY'}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Share your 5-year taste story with the community.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Location Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-400 uppercase">
                <MapPin className="h-4 w-4" />
                Location Tag (Location-Based)
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detecting}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {detecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5 text-amber-400" />
                    Detect GPS
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2.5 text-sm">
              <span className="font-semibold text-zinc-100">
                📍{' '}
                {manualMode && customCity.trim()
                  ? `${customCity.trim()}${customCountry.trim() ? `, ${customCountry.trim()}` : ''}`
                  : location.locationText}
              </span>
              <span className="text-xs text-zinc-500">City-level privacy</span>
            </div>

            {detectError && (
              <p className="mt-2 text-xs text-amber-300/90">{detectError}</p>
            )}

            {/* Quick City Presets */}
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-medium text-zinc-400">
                Or select a city manually:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((c) => {
                  const selected =
                    !manualMode && location.locationText === c.locationText;
                  return (
                    <button
                      key={c.locationText}
                      type="button"
                      onClick={() => {
                        setLocation(c);
                        setManualMode(false);
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        selected
                          ? 'bg-amber-400 font-bold text-[#f7f9f2]'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {c.locationText}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setManualMode((v) => !v)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    manualMode
                      ? 'bg-amber-400 font-bold text-[#f7f9f2]'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  + Other City
                </button>
              </div>
            </div>

            {manualMode && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="City (e.g., Berlin)"
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  placeholder="Country (e.g., DE)"
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Caption (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={280}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell the feed what defined your taste from 2021 to 2025..."
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-[#f7f9f2] transition hover:bg-amber-500 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isEditing ? 'Save Changes' : 'Publish to Feed'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

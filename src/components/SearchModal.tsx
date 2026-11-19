'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Search,
  Loader2,
  Upload,
  Link as LinkIcon,
  Film,
  Music,
  BookOpen,
  Gamepad2,
  ImagePlus,
  Sparkles,
} from 'lucide-react';
import type {
  ArchiveItemData,
  MainCategory,
  SearchResultItem,
} from '@/types/archive';
import { ImageCropModal } from '@/components/ImageCropModal';
import { ModalBackdrop } from '@/components/ModalBackdrop';

interface SearchModalProps {
  year: number;
  slot: number;
  onClose: () => void;
  onSelect: (item: Omit<ArchiveItemData, 'year' | 'slot'>) => void;
}

const CATEGORIES: {
  id: MainCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'media', label: 'Media', icon: Film },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'book', label: 'Books', icon: BookOpen },
  { id: 'game', label: 'Games', icon: Gamepad2 },
  { id: 'custom', label: 'Custom', icon: ImagePlus },
];

const MEDIA_SUBS = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movie' },
  { id: 'drama', label: 'TV / Drama' },
  { id: 'anime', label: 'Anime' },
  { id: 'variety', label: 'Variety' },
];

const MUSIC_SUBS = [
  { id: 'all', label: 'All' },
  { id: 'song', label: 'Song' },
  { id: 'album', label: 'Album' },
];

const YEAR_RECOMMENDATIONS: Record<
  number,
  Record<Exclude<MainCategory, 'custom'>, string[]>
> = {
  2021: {
    media: [
      'Squid Game',
      'Spider-Man: No Way Home',
      'Dune',
      'Arcane',
      'Demon Slayer: Mugen Train',
    ],
    music: ['Butter', 'STAY', 'drivers license', 'Next Level', 'MONTERO'],
    book: [
      'Project Hail Mary',
      'Klara and the Sun',
      'Crying in H Mart',
      'The Midnight Library',
      'Beautiful World, Where Are You',
    ],
    game: [
      'It Takes Two',
      'Resident Evil Village',
      'Metroid Dread',
      'Forza Horizon 5',
      'Deathloop',
    ],
  },
  2022: {
    media: [
      'Everything Everywhere All at Once',
      'Top Gun: Maverick',
      'Stranger Things',
      'Cyberpunk: Edgerunners',
      'Chainsaw Man',
    ],
    music: ['Hype Boy', 'As It Was', 'LOVE DIVE', 'Anti-Hero', 'Midnights'],
    book: [
      'Tomorrow, and Tomorrow, and Tomorrow',
      'Lessons in Chemistry',
      'Pachinko',
      "I'm Glad My Mom Died",
      'Book Lovers',
    ],
    game: [
      'Elden Ring',
      'God of War Ragnarök',
      'Stray',
      'Pokémon Legends: Arceus',
      'Splatoon 3',
    ],
  },
  2023: {
    media: [
      'Oppenheimer',
      'Barbie',
      'The Last of Us',
      "Frieren: Beyond Journey's End",
      'Oshi no Ko',
    ],
    music: ['Super Shy', 'Seven', 'I AM', 'Flowers', 'Kill Bill'],
    book: [
      'Fourth Wing',
      'Yellowface',
      'The Creative Act',
      'The Covenant of Water',
      'The Woman in Me',
    ],
    game: [
      "Baldur's Gate 3",
      'The Legend of Zelda: Tears of the Kingdom',
      'Alan Wake 2',
      'Spider-Man 2',
      'Hogwarts Legacy',
    ],
  },
  2024: {
    media: [
      'Dune: Part Two',
      'Inside Out 2',
      'Culinary Class Wars',
      'Shōgun',
      'Lovely Runner',
    ],
    music: ['APT.', 'Supernova', 'Espresso', 'Not Like Us', 'BRAT'],
    book: [
      'The Vegetarian',
      'Human Acts',
      'Intermezzo',
      'James',
      'The Anxious Generation',
    ],
    game: [
      'Astro Bot',
      'Black Myth: Wukong',
      'Balatro',
      'Helldivers 2',
      'Palworld',
    ],
  },
  2025: {
    media: [
      'Mickey 17',
      'Severance',
      'When Life Gives You Tangerines',
      'KPop Demon Hunters',
      'Sinners',
    ],
    music: ['Ruby', 'REBEL HEART', 'luther', 'Die With A Smile', 'Mayhem'],
    book: [
      'Sunrise on the Reaping',
      'We Do Not Part',
      'Onyx Storm',
      'Everything Is Tuberculosis',
      'Source Code',
    ],
    game: [
      'Monster Hunter Wilds',
      'Grand Theft Auto VI',
      'Ghost of Yōtei',
      'Split Fiction',
      'Pokémon Legends: Z-A',
    ],
  },
};

export function SearchModal({
  year,
  slot,
  onClose,
  onSelect,
}: SearchModalProps) {
  const [category, setCategory] = useState<MainCategory>('media');
  const [subFilter, setSubFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Custom upload state
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [cropSource, setCropSource] = useState<string | null>(null);

  const handleCategoryChange = (nextCat: MainCategory) => {
    setCategory(nextCat);
    setSubFilter('all');
    setResults([]);
    setSourceLabel('');
  };

  const runSearch = async (e?: React.FormEvent, targetQuery?: string) => {
    e?.preventDefault();
    const searchQuery = (targetQuery ?? query).trim();
    if (category === 'custom' || !searchQuery) return;

    if (targetQuery) {
      setQuery(targetQuery);
    }

    setLoading(true);
    try {
      const endpoint = `/api/search/${category}?query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSourceLabel(data.source || '');
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((item) => {
    if (subFilter === 'all') return true;
    return item.subCategory === subFilter;
  });

  const recommendedItems =
    category !== 'custom'
      ? YEAR_RECOMMENDATIONS[year]?.[category] ||
        YEAR_RECOMMENDATIONS[2024][category]
      : [];

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label || 'Items';

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customImageUrl.trim()) return;
    onSelect({
      title: customTitle.trim(),
      subtitle: customSubtitle.trim() || 'Custom Entry',
      category: 'custom',
      subCategory: null,
      imageUrl: customImageUrl.trim(),
    });
  };

  return (
    <>
      <ModalBackdrop
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClose={onClose}
      >
        <div
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
                {year} · Slot #{slot}
              </span>
              <h3 className="text-base font-bold text-zinc-100 sm:text-lg">
                Add to Your Story
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-800/80 px-5 py-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-amber-400 text-[#f7f9f2] shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          {category === 'custom' ? (
            <form
              onSubmit={handleCustomSubmit}
              className="space-y-4 overflow-y-auto p-5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Interstellar, My Favorite Cafe, Graduation Trip"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  placeholder="e.g., Personal Memory · 2024"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Upload &amp; Crop Image (Canvas)
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/70 p-4 text-center transition hover:border-amber-400">
                    <Upload className="h-5 w-5 text-amber-400" />
                    <span className="text-xs font-medium text-zinc-300">
                      Choose image file
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Opens interactive Canvas cropper
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFilePick}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Or Paste Image URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute top-3 left-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="url"
                      value={
                        customImageUrl.startsWith('data:') ? '' : customImageUrl
                      }
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://example.com/poster.jpg"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pr-3 pl-9 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  {customImageUrl && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={customImageUrl}
                        alt="Preview"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <span className="text-xs font-semibold text-emerald-700">
                        Image ready!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customTitle.trim() || !customImageUrl.trim()}
                  className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-[#f7f9f2] transition hover:bg-amber-500 disabled:opacity-40"
                >
                  Add to Slot
                </button>
              </div>
            </form>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-5">
              {/* Sub-filters */}
              {(category === 'media' || category === 'music') && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(category === 'media' ? MEDIA_SUBS : MUSIC_SUBS).map(
                    (sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSubFilter(sub.id)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          subFilter === sub.id
                            ? 'bg-amber-400 text-[#f7f9f2]'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ),
                  )}
                </div>
              )}

              {/* Search Bar */}
              <form onSubmit={runSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-3 left-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a title, artist, author, or game and press Search."
                    autoFocus
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pr-10 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                  {query.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                        setSourceLabel('');
                        setSubFilter('all');
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search query"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#f7f9f2] transition hover:bg-amber-500 disabled:opacity-40 sm:text-sm"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {sourceLabel === 'demo-fallback' && (
                <p className="mt-2 text-[11px] text-amber-300/80">
                  Showing curated demo results (live API key missing or unavailable).
                </p>
              )}

              {/* Results Grid */}
              <div className="mt-4 flex-1 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-zinc-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
                    <span className="text-sm">Searching Open APIs...</span>
                  </div>
                ) : filteredResults.length === 0 ? (
                  results.length > 0 ? (
                    <div className="flex h-44 flex-col items-center justify-center text-center text-zinc-500">
                      <Search className="mb-2 h-7 w-7 opacity-40" />
                      <p className="text-sm text-zinc-400">
                        No items match this sub-filter.
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-amber-400 uppercase">
                          <Sparkles className="h-3.5 w-3.5" />
                          Popular {activeCategoryLabel} in {year}
                        </div>
                        <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                          Top 5 Chart
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {recommendedItems.map((rec, idx) => {
                          const rank = idx + 1;
                          const isTopThree = rank <= 3;
                          return (
                            <button
                              key={rec}
                              type="button"
                              onClick={() => runSearch(undefined, rec)}
                              className="group flex w-full items-center justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-3.5 py-2.5 text-left transition hover:border-amber-400/60 hover:bg-zinc-900"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                                    isTopThree
                                      ? 'bg-amber-400 text-[#f7f9f2]'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  {rank}
                                </span>
                                <span className="truncate text-sm font-bold text-zinc-100 transition group-hover:text-amber-300">
                                  {rec}
                                </span>
                              </div>
                              <span className="ml-3 shrink-0 text-[11px] font-semibold text-zinc-500 transition group-hover:text-amber-300">
                                Search &rarr;
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {filteredResults.map((item, idx) => (
                      <button
                        key={`${item.id}-${idx}`}
                        type="button"
                        onClick={() =>
                          onSelect({
                            title: item.title,
                            subtitle: item.subtitle,
                            category: item.category,
                            subCategory: item.subCategory || null,
                            imageUrl: item.image,
                          })
                        }
                        className="flex items-center gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-2.5 text-left transition hover:border-amber-400/70 hover:bg-zinc-900"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-zinc-100">
                            {item.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ModalBackdrop>

      {cropSource && (
        <ImageCropModal
          imageSrc={cropSource}
          onCancel={() => setCropSource(null)}
          onApply={(cropped) => {
            setCustomImageUrl(cropped);
            setCropSource(null);
          }}
        />
      )}
    </>
  );
}

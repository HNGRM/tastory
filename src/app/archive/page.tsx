'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  Download,
  Send,
  X,
  Lock,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { ArchiveBoard } from '@/components/ArchiveBoard';
import { ControlPanel } from '@/components/ControlPanel';
import { SearchModal } from '@/components/SearchModal';
import { SlotDetailModal } from '@/components/SlotDetailModal';
import { PublishModal } from '@/components/PublishModal';
import { ModalBackdrop } from '@/components/ModalBackdrop';
import { exportArchiveToPng } from '@/lib/canvasExport';
import {
  slotKey,
  type ArchiveItemData,
  type AspectRatioOption,
  type FontStyleOption,
  type LocationInfo,
  type PostData,
  type SlotMap,
} from '@/types/archive';

function ArchiveStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = searchParams.get('edit');
  const remixPostId = searchParams.get('remix');

  const { user, loading: authLoading, openSignInModal } = useAuth();
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Board state — always starts clean & empty unless editing/remixing
  const [title, setTitle] = useState('MY 5-YEAR TASTORY');
  const [items, setItems] = useState<SlotMap>({});
  const [bgColor, setBgColor] = useState('#0a0a0a');
  const [textColor, setTextColor] = useState<string | null>(null);
  const [fontStyle, setFontStyle] = useState<FontStyleOption>('sans');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('4:5');
  const [showLabels, setShowLabels] = useState(true);

  const [initialCaption, setInitialCaption] = useState('');
  const [initialLocation, setInitialLocation] = useState<LocationInfo | null>(
    null,
  );
  const [loadingPost, setLoadingPost] = useState(
    Boolean(editPostId || remixPostId),
  );

  // Interactive modals
  const [searchTarget, setSearchTarget] = useState<{
    year: number;
    slot: number;
  } | null>(null);
  const [detailTargetKey, setDetailTargetKey] = useState<string | null>(null);
  const [swapSourceKey, setSwapSourceKey] = useState<string | null>(null);
  const [mobileCustomizeOpen, setMobileCustomizeOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const targetId = editPostId || remixPostId;
    if (!targetId) return;

    let cancelled = false;
    fetch(`/api/posts/${targetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { post?: PostData } | null) => {
        if (cancelled || !data?.post) return;
        const p = data.post;
        setTitle(remixPostId ? `${p.title} (REMIX)` : p.title);
        setBgColor(p.bgColor);
        setTextColor(p.textColor || null);
        setFontStyle(p.fontStyle);
        setAspectRatio(p.aspectRatio);
        setShowLabels(p.showLabels);

        const nextMap: SlotMap = {};
        for (const it of p.items) {
          nextMap[slotKey(it.year, it.slot)] = it;
        }
        setItems(nextMap);

        if (editPostId) {
          setInitialCaption(p.caption || '');
          setInitialLocation({
            city: p.city,
            country: p.country,
            countryCode: p.countryCode,
            locationText: p.locationText,
            latitude: p.latitude,
            longitude: p.longitude,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPost(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editPostId, remixPostId]);

  const filledCount = Object.keys(items).length;

  const handleSwapSlots = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;
    setItems((prev) => {
      const next = { ...prev };
      const sourceItem = prev[sourceKey];
      const targetItem = prev[targetKey];
      if (!sourceItem) return prev;

      const [tYear, tSlot] = targetKey.split('-').map(Number);
      const [sYear, sSlot] = sourceKey.split('-').map(Number);

      next[targetKey] = { ...sourceItem, year: tYear, slot: tSlot };
      if (targetItem) {
        next[sourceKey] = { ...targetItem, year: sYear, slot: sSlot };
      } else {
        delete next[sourceKey];
      }
      return next;
    });
  };

  const handleSlotClick = (year: number, slot: number) => {
    const key = slotKey(year, slot);

    if (swapSourceKey) {
      if (swapSourceKey !== key) {
        handleSwapSlots(swapSourceKey, key);
      }
      setSwapSourceKey(null);
      return;
    }

    if (items[key]) {
      setDetailTargetKey(key);
    } else {
      setSearchTarget({ year, slot });
    }
  };

  const handleSelectItem = (
    payload: Omit<ArchiveItemData, 'year' | 'slot'>,
  ) => {
    if (!searchTarget) return;
    const { year, slot } = searchTarget;
    const key = slotKey(year, slot);
    setItems((prev) => ({
      ...prev,
      [key]: { ...payload, year, slot },
    }));
    setSearchTarget(null);
  };

  const handleDownloadPng = async () => {
    setExporting(true);
    try {
      await exportArchiveToPng({
        title,
        items,
        bgColor,
        textColor,
        fontStyle,
        aspectRatio,
        showLabels,
        locationText: initialLocation?.locationText,
        boardElement: boardRef.current,
      });
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to export PNG image.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearBoard = () => {
    if (filledCount > 0 && !confirm('Clear all slots in this taste story?')) return;
    setItems({});
    setSwapSourceKey(null);
  };

  const handlePublishConfirm = async ({
    caption,
    location,
  }: {
    caption: string;
    location: LocationInfo;
  }) => {
    setPublishing(true);
    try {
      const payload = {
        title,
        caption,
        city: location.city,
        country: location.country,
        countryCode: location.countryCode,
        locationText: location.locationText,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        aspectRatio,
        bgColor,
        textColor,
        fontStyle,
        showLabels,
        items: Object.values(items),
        remixFromId: remixPostId || undefined,
      };

      const url = editPostId ? `/api/posts/${editPostId}` : '/api/posts';
      const method = editPostId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to publish archive.');
        return;
      }

      setPublishModalOpen(false);
      router.push('/');
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading || loadingPost) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
        Loading Archive Studio...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-extrabold text-zinc-100">
          Start as Guest to create your story
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Curate your 2021–2025 favorites, customize themes, export PNG posters,
          and publish to the location-based feed.
        </p>
        <button
          type="button"
          onClick={() => openSignInModal('/archive')}
          className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-[#f7f9f2] transition hover:bg-amber-500"
        >
          Start as Guest
        </button>
      </div>
    );
  }

  const detailItem = detailTargetKey ? items[detailTargetKey] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      {/* Mobile Compact Action Bar */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileCustomizeOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-100"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
          Customize
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-200"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>
          <button
            type="button"
            disabled={filledCount === 0}
            onClick={() => setPublishModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold text-[#f7f9f2] disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Publish
          </button>
        </div>
      </div>

      {/* Swap Mode Banner */}
      {swapSourceKey && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-2.5 text-xs font-semibold text-amber-200">
          <span className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-amber-400" />
            Tap any destination slot to move or swap with this item.
          </span>
          <button
            type="button"
            onClick={() => setSwapSourceKey(null)}
            className="rounded-lg bg-zinc-950 px-2.5 py-1 text-zinc-100"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Split Workspace on Desktop */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Desktop Left Sidebar */}
        <aside className="hidden w-[360px] shrink-0 rounded-2xl border border-zinc-800/90 bg-zinc-900/65 p-5 shadow-sm lg:sticky lg:top-24 lg:block">
          <div className="mb-4 border-b border-zinc-800 pb-3">
            <h1 className="text-base font-extrabold text-zinc-100">
              {editPostId ? 'Edit Published Story' : 'TASTORY Studio'}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Click any empty slot to search, or drag cards to reorder your taste story.
            </p>
          </div>
          <ControlPanel
            title={title}
            onTitleChange={setTitle}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            bgColor={bgColor}
            onBgColorChange={setBgColor}
            textColor={textColor}
            onTextColorChange={setTextColor}
            fontStyle={fontStyle}
            onFontStyleChange={setFontStyle}
            showLabels={showLabels}
            onShowLabelsChange={setShowLabels}
            filledCount={filledCount}
            exporting={exporting}
            isEditing={Boolean(editPostId)}
            onDownloadPng={handleDownloadPng}
            onOpenPublish={() => setPublishModalOpen(true)}
            onClearBoard={handleClearBoard}
          />
        </aside>

        {/* Live Board Area */}
        <section className="flex flex-1 flex-col items-center">
          <div className="w-full max-w-[440px]">
            <ArchiveBoard
              boardRef={boardRef}
              title={title}
              items={items}
              bgColor={bgColor}
              textColor={textColor}
              fontStyle={fontStyle}
              aspectRatio={aspectRatio}
              showLabels={showLabels}
              locationText={initialLocation?.locationText}
              editable
              compact
              swapSourceKey={swapSourceKey}
              onSlotClick={handleSlotClick}
              onSwapSlots={handleSwapSlots}
            />
          </div>
          <p className="mt-3 text-center text-xs text-zinc-500">
            Tip: Drag &amp; drop cards to rearrange on desktop, or tap a card for
            Move / Replace / Remove options.
          </p>
        </section>
      </div>

      {/* Mobile Customize Drawer */}
      {mobileCustomizeOpen && (
        <ModalBackdrop
          className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm lg:hidden"
          onClose={() => setMobileCustomizeOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100">
                Customize Story
              </h2>
              <button
                type="button"
                onClick={() => setMobileCustomizeOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ControlPanel
              title={title}
              onTitleChange={setTitle}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              bgColor={bgColor}
              onBgColorChange={setBgColor}
              textColor={textColor}
              onTextColorChange={setTextColor}
              fontStyle={fontStyle}
              onFontStyleChange={setFontStyle}
              showLabels={showLabels}
              onShowLabelsChange={setShowLabels}
              filledCount={filledCount}
              exporting={exporting}
              isEditing={Boolean(editPostId)}
              onDownloadPng={handleDownloadPng}
              onOpenPublish={() => {
                setMobileCustomizeOpen(false);
                setPublishModalOpen(true);
              }}
              onClearBoard={handleClearBoard}
            />
          </div>
        </ModalBackdrop>
      )}

      {/* Search & Custom Upload Modal */}
      {searchTarget && (
        <SearchModal
          year={searchTarget.year}
          slot={searchTarget.slot}
          onClose={() => setSearchTarget(null)}
          onSelect={handleSelectItem}
        />
      )}

      {/* Slot Detail Modal */}
      {detailTargetKey && detailItem && (
        <SlotDetailModal
          item={detailItem}
          onClose={() => setDetailTargetKey(null)}
          onUpdateTitle={(newTitle) => {
            setItems((prev) => ({
              ...prev,
              [detailTargetKey]: { ...prev[detailTargetKey], title: newTitle },
            }));
            setDetailTargetKey(null);
          }}
          onReplace={() => {
            const [y, s] = detailTargetKey.split('-').map(Number);
            setDetailTargetKey(null);
            setSearchTarget({ year: y, slot: s });
          }}
          onStartSwap={() => {
            setSwapSourceKey(detailTargetKey);
            setDetailTargetKey(null);
          }}
          onRemove={() => {
            setItems((prev) => {
              const next = { ...prev };
              delete next[detailTargetKey];
              return next;
            });
            setDetailTargetKey(null);
          }}
        />
      )}

      {/* Publish + Location Modal */}
      {publishModalOpen && (
        <PublishModal
          isEditing={Boolean(editPostId)}
          initialCaption={initialCaption}
          initialLocation={initialLocation}
          submitting={publishing}
          onClose={() => setPublishModalOpen(false)}
          onConfirm={handlePublishConfirm}
        />
      )}
    </div>
  );
}

export default function ArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
          Loading Archive Studio...
        </div>
      }
    >
      <ArchiveStudioContent />
    </Suspense>
  );
}

'use client';

import React, { useState } from 'react';
import { X, Trash2, ArrowLeftRight, RefreshCw, Check } from 'lucide-react';
import type { ArchiveItemData } from '@/types/archive';
import { ModalBackdrop } from '@/components/ModalBackdrop';

interface SlotDetailModalProps {
  item: ArchiveItemData;
  onClose: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onReplace: () => void;
  onStartSwap: () => void;
  onRemove: () => void;
}

export function SlotDetailModal({
  item,
  onClose,
  onUpdateTitle,
  onReplace,
  onStartSwap,
  onRemove,
}: SlotDetailModalProps) {
  const [titleInput, setTitleInput] = useState(item.title);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;
    onUpdateTitle(titleInput.trim());
  };

  return (
    <ModalBackdrop
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClose={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
              {item.year} · Slot #{item.slot}
            </span>
            <h3 className="text-base font-bold text-zinc-100">Manage Slot</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-100">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {item.subtitle}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 uppercase">
              {item.category}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
            Display Title
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-[#f7f9f2] hover:bg-amber-500"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </form>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onStartSwap}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-200 hover:border-amber-400/60 hover:text-amber-300"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Move/Swap
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

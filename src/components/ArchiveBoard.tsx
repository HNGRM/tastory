'use client';

import React, { useState } from 'react';
import { Plus, GripVertical, ArrowLeftRight } from 'lucide-react';
import {
  YEARS,
  SLOTS,
  slotKey,
  type AspectRatioOption,
  type FontStyleOption,
  type SlotMap,
} from '@/types/archive';
import {
  getEffectiveTextColor,
  getFontCss,
  isColorLight,
} from '@/lib/colorUtils';

interface ArchiveBoardProps {
  title: string;
  items: SlotMap;
  bgColor: string;
  textColor?: string | null;
  fontStyle: FontStyleOption;
  aspectRatio: AspectRatioOption;
  showLabels: boolean;
  locationText?: string;
  editable?: boolean;
  compact?: boolean;
  swapSourceKey?: string | null;
  boardRef?: React.Ref<HTMLDivElement>;
  onSlotClick?: (year: number, slot: number) => void;
  onSwapSlots?: (sourceKey: string, targetKey: string) => void;
}

export function ArchiveBoard({
  title,
  items,
  bgColor,
  textColor,
  fontStyle,
  aspectRatio,
  showLabels,
  locationText,
  editable = false,
  compact = false,
  swapSourceKey = null,
  boardRef,
  onSlotClick,
  onSwapSlots,
}: ArchiveBoardProps) {
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const lightBg = isColorLight(bgColor);
  const fg = getEffectiveTextColor(bgColor, textColor);
  const fontCss = getFontCss(fontStyle);

  const cardBg = lightBg ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.055)';
  const cardBorder = lightBg ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.13)';
  const mutedFg = lightBg ? 'rgba(17,24,39,0.58)' : 'rgba(248,250,252,0.58)';

  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16]'
      : aspectRatio === '1:1'
        ? 'aspect-square'
        : 'aspect-[4/5]';

  return (
    <div
      ref={boardRef}
      style={{
        backgroundColor: bgColor,
        color: fg,
        fontFamily: fontCss,
      }}
      className={`relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-colors duration-200 ${aspectClass} ${
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
      }`}
    >
      {/* Header Title */}
      <div
        className={`shrink-0 text-center ${
          aspectRatio === '9:16' ? 'py-2 sm:py-4' : 'pb-2 pt-0.5'
        }`}
      >
        <h2
          className={`truncate font-extrabold tracking-wide uppercase ${
            compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          }`}
        >
          {title || 'MY 5-YEAR TASTORY'}
        </h2>
      </div>

      {/* 5x4 Grid */}
      <div
        className={`grid flex-1 grid-rows-5 ${
          compact ? 'gap-1.5 sm:gap-2' : 'gap-2'
        } ${aspectRatio === '9:16' ? 'my-auto max-h-[76%]' : 'min-h-0'}`}
      >
        {YEARS.map((year) => (
          <div
            key={year}
            className={`grid grid-cols-4 ${
              compact ? 'gap-1.5 sm:gap-2' : 'gap-2'
            } min-h-0`}
          >
            {/* Year Cell */}
            <div
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
              className="flex flex-col items-center justify-center rounded-xl border select-none"
            >
              <span
                style={{ color: mutedFg }}
                className={`font-bold tracking-widest uppercase ${
                  compact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'
                }`}
              >
                YEAR
              </span>
              <span
                className={`font-extrabold leading-tight ${
                  compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}
              >
                {year}
              </span>
            </div>

            {/* 3 Item Slots */}
            {SLOTS.map((slot) => {
              const key = slotKey(year, slot);
              const item = items[key];
              const isDropTarget = dragOverKey === key && draggedKey !== key;
              const isSwapCandidate = swapSourceKey && swapSourceKey !== key;
              const isSwapOrigin = swapSourceKey === key;

              return (
                <div
                  key={key}
                  draggable={editable && Boolean(item)}
                  onDragStart={(e) => {
                    if (!editable || !item) return;
                    setDraggedKey(key);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', key);
                  }}
                  onDragEnd={() => {
                    setDraggedKey(null);
                    setDragOverKey(null);
                  }}
                  onDragOver={(e) => {
                    if (!editable || !draggedKey) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverKey !== key) setDragOverKey(key);
                  }}
                  onDragLeave={() => {
                    if (dragOverKey === key) setDragOverKey(null);
                  }}
                  onDrop={(e) => {
                    if (!editable) return;
                    e.preventDefault();
                    const source =
                      draggedKey || e.dataTransfer.getData('text/plain');
                    setDraggedKey(null);
                    setDragOverKey(null);
                    if (source && source !== key && onSwapSlots) {
                      onSwapSlots(source, key);
                    }
                  }}
                  onClick={() => onSlotClick?.(year, slot)}
                  role={onSlotClick ? 'button' : undefined}
                  tabIndex={onSlotClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onSlotClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSlotClick(year, slot);
                    }
                  }}
                  style={{
                    backgroundColor: item ? '#111827' : cardBg,
                    borderColor: isDropTarget
                      ? '#f59e0b'
                      : isSwapOrigin
                        ? '#38bdf8'
                        : cardBorder,
                  }}
                  className={`group relative overflow-hidden rounded-xl border transition-all ${
                    onSlotClick ? 'cursor-pointer' : ''
                  } ${
                    !item ? 'border-dashed' : ''
                  } ${
                    isDropTarget
                      ? 'scale-[1.03] ring-2 ring-amber-400'
                      : isSwapCandidate
                        ? 'ring-2 ring-amber-400/70 animate-pulse'
                        : editable && onSlotClick
                          ? 'hover:brightness-110'
                          : ''
                  }`}
                >
                  {item ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />

                      {editable && (
                        <div
                          data-export-ignore="true"
                          className="pointer-events-none absolute top-1.5 right-1.5 hidden rounded-md bg-black/55 p-1 text-white/80 backdrop-blur-sm group-hover:block"
                        >
                          {swapSourceKey ? (
                            <ArrowLeftRight className="h-3 w-3 text-amber-300" />
                          ) : (
                            <GripVertical className="h-3 w-3" />
                          )}
                        </div>
                      )}

                      {showLabels && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 pt-5 pb-1.5 text-center">
                          <p
                            className={`line-clamp-2 font-bold leading-tight text-white ${
                              compact
                                ? 'text-[8px] sm:text-[10px]'
                                : 'text-[10px] sm:text-[11px]'
                            }`}
                          >
                            {item.title}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{ color: mutedFg }}
                      className="flex h-full w-full flex-col items-center justify-center gap-1 select-none"
                    >
                      {editable ? (
                        <>
                          <Plus
                            className={
                              compact ? 'h-3.5 w-3.5' : 'h-4 w-4 sm:h-5 sm:w-5'
                            }
                          />
                          <span
                            className={`font-semibold ${
                              compact ? 'text-[8px]' : 'text-[10px] sm:text-xs'
                            }`}
                          >
                            {swapSourceKey ? 'Move here' : `#${slot}`}
                          </span>
                        </>
                      ) : (
                        <span
                          className={`font-semibold ${
                            compact ? 'text-[8px]' : 'text-[10px]'
                          }`}
                        >
                          #{slot}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Subtle Footer Stamp */}
      <div className="shrink-0 pt-2 text-center">
        <p
          style={{ color: mutedFg }}
          className={`truncate font-semibold tracking-widest uppercase ${
            compact ? 'text-[8px]' : 'text-[9px]'
          }`}
        >
          {locationText
            ? `TASTORY IN ${locationText} · WHERE TASTE MEETS STORY`
            : 'TASTORY · WHERE TASTE MEETS STORY'}
        </p>
      </div>
    </div>
  );
}

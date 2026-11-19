'use client';

import React from 'react';
import {
  Download,
  RotateCcw,
  Send,
  Type,
  Palette,
  LayoutTemplate,
  Eye,
  Loader2,
} from 'lucide-react';
import {
  ASPECT_RATIO_OPTIONS,
  FONT_OPTIONS,
  THEME_PRESETS,
  type AspectRatioOption,
  type FontStyleOption,
} from '@/types/archive';

interface ControlPanelProps {
  title: string;
  onTitleChange: (val: string) => void;
  aspectRatio: AspectRatioOption;
  onAspectRatioChange: (val: AspectRatioOption) => void;
  bgColor: string;
  onBgColorChange: (val: string) => void;
  textColor: string | null;
  onTextColorChange: (val: string | null) => void;
  fontStyle: FontStyleOption;
  onFontStyleChange: (val: FontStyleOption) => void;
  showLabels: boolean;
  onShowLabelsChange: (val: boolean) => void;
  filledCount: number;
  exporting: boolean;
  isEditing: boolean;
  onDownloadPng: () => void;
  onOpenPublish: () => void;
  onClearBoard: () => void;
}

export function ControlPanel({
  title,
  onTitleChange,
  aspectRatio,
  onAspectRatioChange,
  bgColor,
  onBgColorChange,
  onTextColorChange,
  fontStyle,
  onFontStyleChange,
  showLabels,
  onShowLabelsChange,
  filledCount,
  exporting,
  isEditing,
  onDownloadPng,
  onOpenPublish,
  onClearBoard,
}: ControlPanelProps) {
  return (
    <div className="space-y-5">
      {/* Board Title */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-400 uppercase">
          <Type className="h-3.5 w-3.5 text-amber-400" />
          Story Title
        </label>
        <input
          type="text"
          maxLength={60}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="MY 5-YEAR TASTORY"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-400 uppercase">
          <LayoutTemplate className="h-3.5 w-3.5 text-amber-400" />
          Export Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIO_OPTIONS.map((opt) => {
            const active = aspectRatio === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onAspectRatioChange(opt.id)}
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  active
                    ? 'border-amber-400 bg-amber-400 text-[#f7f9f2]'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="block text-xs font-bold">{opt.label}</span>
                <span className="block text-[10px] opacity-80">
                  {opt.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Style */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-wider text-zinc-400 uppercase">
          Typography
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((f) => {
            const active = fontStyle === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFontStyleChange(f.id)}
                style={{ fontFamily: f.cssFont }}
                className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                  active
                    ? 'border-amber-400 bg-amber-400 text-[#f7f9f2]'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Colors */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-400 uppercase">
            <Palette className="h-3.5 w-3.5 text-amber-400" />
            Theme Background
          </label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
              onBgColorChange(e.target.value);
              onTextColorChange(null);
            }}
            aria-label="Custom background color"
            className="h-6 w-8 cursor-pointer rounded border border-zinc-700 bg-transparent"
          />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {THEME_PRESETS.map((preset) => {
            const selected =
              bgColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                title={preset.name}
                onClick={() => {
                  onBgColorChange(preset.hex);
                  onTextColorChange(null);
                }}
                style={{ backgroundColor: preset.hex }}
                className={`h-8 w-full rounded-lg border transition ${
                  selected
                    ? 'scale-105 border-amber-400 ring-2 ring-amber-400/50'
                    : 'border-zinc-700 hover:scale-105'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Show Labels Toggle */}
      <button
        type="button"
        onClick={() => onShowLabelsChange(!showLabels)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700"
      >
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-400" />
          Card Title Overlay
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            showLabels
              ? 'bg-amber-400 text-[#f7f9f2]'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {showLabels ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Primary Actions */}
      <div className="space-y-2.5 border-t border-zinc-800 pt-4">
        <button
          type="button"
          disabled={filledCount === 0}
          onClick={onOpenPublish}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-[#f7f9f2] shadow-md transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {isEditing
            ? 'Save Feed Post Updates'
            : `Publish to Feed (${filledCount}/15)`}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={onDownloadPng}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs font-bold text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PNG
          </button>

          <button
            type="button"
            onClick={onClearBoard}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-red-500/40 hover:text-red-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Board
          </button>
        </div>
      </div>
    </div>
  );
}

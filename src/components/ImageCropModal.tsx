'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import { ModalBackdrop } from '@/components/ModalBackdrop';

interface ImageCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
}

const PREVIEW_SIZE = 320;
const OUTPUT_SIZE = 600;

export function ImageCropModal({
  imageSrc,
  onCancel,
  onApply,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    const baseScale = Math.max(
      PREVIEW_SIZE / img.naturalWidth,
      PREVIEW_SIZE / img.naturalHeight,
    );
    const scale = baseScale * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (PREVIEW_SIZE - drawW) / 2 + offset.x;
    const dy = (PREVIEW_SIZE - drawH) / 2 + offset.y;

    ctx.drawImage(img, dx, dy, drawW, drawH);

    // Subtle rule-of-thirds crop guide overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const pos = (PREVIEW_SIZE / 3) * i;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, PREVIEW_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(PREVIEW_SIZE, pos);
      ctx.stroke();
    }
  }, [loaded, zoom, offset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    setOffset({
      x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleApply = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const out = document.createElement('canvas');
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    const ratio = OUTPUT_SIZE / PREVIEW_SIZE;
    const baseScale = Math.max(
      PREVIEW_SIZE / img.naturalWidth,
      PREVIEW_SIZE / img.naturalHeight,
    );
    const scale = baseScale * zoom * ratio;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (OUTPUT_SIZE - drawW) / 2 + offset.x * ratio;
    const dy = (OUTPUT_SIZE - drawH) / 2 + offset.y * ratio;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(img, dx, dy, drawW, drawH);

    onApply(out.toDataURL('image/jpeg', 0.88));
  };

  return (
    <ModalBackdrop
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClose={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Crop Cover Image</h3>
            <p className="text-xs text-zinc-400">
              Drag to reposition and adjust zoom (1:1 square)
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="h-[280px] w-[280px] touch-none cursor-grab rounded-xl border border-zinc-700 bg-zinc-900 active:cursor-grabbing sm:h-[320px] sm:w-[320px]"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomOut className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 w-full accent-amber-400"
          />
          <ZoomIn className="h-4 w-4 shrink-0 text-zinc-400" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#f7f9f2] hover:bg-amber-500"
            >
              <Check className="h-3.5 w-3.5" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

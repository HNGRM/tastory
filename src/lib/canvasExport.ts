import { toCanvas } from 'html-to-image';
import {
  ASPECT_RATIO_OPTIONS,
  YEARS,
  SLOTS,
  slotKey,
  type AspectRatioOption,
  type FontStyleOption,
  type SlotMap,
} from '@/types/archive';
import { getEffectiveTextColor, getFontCanvas, isColorLight } from '@/lib/colorUtils';

export interface ExportArchiveOptions {
  title: string;
  items: SlotMap;
  bgColor: string;
  textColor?: string | null;
  fontStyle: FontStyleOption;
  aspectRatio: AspectRatioOption;
  showLabels: boolean;
  locationText?: string;
  boardElement?: HTMLElement | null;
}

function toSafeImageSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = toSafeImageSrc(src);
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Pre-renders every `<img>` inside `boardElement` into a same-origin `data:image/png` URL
 * with `object-fit: cover` already baked in at target export resolution, then returns a
 * cleanup function to restore the original `src` attributes after capture.
 */
async function prepareDomImagesForCapture(
  boardElement: HTMLElement,
  pixelRatio: number,
): Promise<() => void> {
  const imgElements = Array.from(boardElement.querySelectorAll('img'));
  const restorers: Array<() => void> = [];

  await Promise.all(
    imgElements.map(async (imgEl) => {
      const originalSrc = imgEl.getAttribute('src') || imgEl.src;
      const originalLoading = imgEl.getAttribute('loading');
      if (!originalSrc) return;

      const loaded = await loadImage(originalSrc);
      if (!loaded) return;

      const rect = imgEl.getBoundingClientRect();
      const targetW = Math.max(1, Math.round((rect.width || 120) * pixelRatio));
      const targetH = Math.max(1, Math.round((rect.height || 120) * pixelRatio));

      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      drawImageCover(offCtx, loaded, 0, 0, targetW, targetH);
      const dataUrl = offCanvas.toDataURL('image/png');

      imgEl.setAttribute('loading', 'eager');
      imgEl.src = dataUrl;
      try {
        await imgEl.decode();
      } catch {
        // ignore decode warning
      }

      restorers.push(() => {
        imgEl.src = originalSrc;
        if (originalLoading) {
          imgEl.setAttribute('loading', originalLoading);
        } else {
          imgEl.removeAttribute('loading');
        }
      });
    }),
  );

  return () => {
    restorers.forEach((restore) => restore());
  };
}

/**
 * Direct DOM-to-Canvas capture (`html-to-image` + HTML5 Canvas) that rasterizes the exact
 * live `<ArchiveBoard />` DOM node at 1080p resolution so fonts, font sizes, line-wrapping,
 * ellipses (`...`), and card styles match the on-screen DOM 1:1.
 */
export async function exportArchiveToPng(
  options: ExportArchiveOptions,
): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // continue if Font Loading API rejects
    }
  }

  const spec =
    ASPECT_RATIO_OPTIONS.find((o) => o.id === options.aspectRatio) ||
    ASPECT_RATIO_OPTIONS[0];

  const W = spec.width;
  const H = spec.height;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize Canvas 2D context');
  }

  // Primary path: Direct capture of the live on-screen DOM node
  if (options.boardElement) {
    const el = options.boardElement;
    const rect = el.getBoundingClientRect();
    const domW = Math.max(1, rect.width || el.offsetWidth || 440);
    const domH = Math.max(1, rect.height || el.offsetHeight || 550);
    const pixelRatio = W / domW;

    const restoreImages = await prepareDomImagesForCapture(el, pixelRatio);
    try {
      const capturedCanvas = await toCanvas(el, {
        width: domW,
        height: domH,
        canvasWidth: W,
        canvasHeight: H,
        pixelRatio,
        backgroundColor: options.bgColor,
        cacheBust: false,
        skipAutoScale: true,
        style: {
          borderRadius: '0px',
          border: 'none',
          boxShadow: 'none',
          margin: '0',
          transform: 'none',
        },
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset?.exportIgnore === 'true') {
            return false;
          }
          return true;
        },
      });

      ctx.fillStyle = options.bgColor;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(capturedCanvas, 0, 0, W, H);
    } finally {
      restoreImages();
    }
  } else {
    // Fallback Canvas 2D renderer if no DOM element ref was supplied
    await renderFallbackCanvas(ctx, W, H, options);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png', 0.98),
  );
  if (!blob) {
    throw new Error('Failed to generate PNG blob');
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const ratioSlug = options.aspectRatio.replace(':', 'x');
  link.download = `tastory-${ratioSlug}-${Date.now()}.png`;
  link.href = blobUrl;
  link.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

async function renderFallbackCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  options: ExportArchiveOptions,
) {
  const S = W / 440;
  const lightBg = isColorLight(options.bgColor);
  const fg = getEffectiveTextColor(options.bgColor, options.textColor);
  const fontFamily = getFontCanvas(options.fontStyle);

  ctx.fillStyle = options.bgColor;
  ctx.fillRect(0, 0, W, H);

  const pad = 16 * S;
  const contentW = W - pad * 2;
  const contentH = H - pad * 2;
  const headerH = (options.aspectRatio === '9:16' ? 52 : 30) * S;
  const footerH = 20 * S;
  const gap = 8 * S;
  const availGridH = contentH - headerH - footerH;
  const gridH =
    options.aspectRatio === '9:16'
      ? Math.min(availGridH, contentH * 0.76)
      : availGridH;

  const cellW = (contentW - gap * 3) / 4;
  const cellH = (gridH - gap * 4) / 5;
  const startX = pad;
  const startY = pad + headerH + (availGridH - gridH) / 2;

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${(14 * S).toFixed(2)}px ${fontFamily}`;
  ctx.fillText(
    (options.title || 'MY 5-YEAR TASTORY').toUpperCase(),
    W / 2,
    pad + headerH / 2,
  );

  const cardFill = lightBg ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.055)';
  YEARS.forEach((year, rowIdx) => {
    const y = startY + rowIdx * (cellH + gap);
    ctx.fillStyle = cardFill;
    ctx.fillRect(startX, y, cellW, cellH);
    ctx.fillStyle = fg;
    ctx.font = `800 ${(14 * S).toFixed(2)}px ${fontFamily}`;
    ctx.fillText(String(year), startX + cellW / 2, y + cellH / 2);

    SLOTS.forEach((slot, slotIdx) => {
      const x = startX + (slotIdx + 1) * (cellW + gap);
      const item = options.items[slotKey(year, slot)];
      ctx.fillStyle = item ? '#111827' : cardFill;
      ctx.fillRect(x, y, cellW, cellH);
    });
  });
}

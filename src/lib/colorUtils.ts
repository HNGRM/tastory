import { FONT_OPTIONS, FontStyleOption } from '@/types/archive';

export function isColorLight(hex: string): boolean {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 145;
}

export function getEffectiveTextColor(
  bgColor: string,
  customTextColor?: string | null,
): string {
  if (customTextColor) return customTextColor;
  return isColorLight(bgColor) ? '#111827' : '#f8fafc';
}

export function getFontCss(fontStyle: FontStyleOption): string {
  return (
    FONT_OPTIONS.find((f) => f.id === fontStyle)?.cssFont ||
    FONT_OPTIONS[0].cssFont
  );
}

export function getFontCanvas(fontStyle: FontStyleOption): string {
  const option =
    FONT_OPTIONS.find((f) => f.id === fontStyle) || FONT_OPTIONS[0];

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const rootStyle = window.getComputedStyle(document.documentElement);
    if (fontStyle === 'sans') {
      const geistSans = rootStyle.getPropertyValue('--font-geist-sans').trim();
      if (geistSans) {
        return `${geistSans}, ${option.canvasFont}`;
      }
    } else if (fontStyle === 'mono') {
      const geistMono = rootStyle.getPropertyValue('--font-geist-mono').trim();
      if (geistMono) {
        return `${geistMono}, ${option.canvasFont}`;
      }
    }
  }

  return option.canvasFont;
}

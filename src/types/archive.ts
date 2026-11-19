export const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
export const SLOTS = [1, 2, 3] as const;

export type AspectRatioOption = '4:5' | '9:16' | '1:1';
export type FontStyleOption = 'sans' | 'serif' | 'mono';
export type MainCategory = 'media' | 'music' | 'book' | 'game' | 'custom';

export interface ArchiveItemData {
  year: number;
  slot: number;
  title: string;
  subtitle: string;
  category: MainCategory;
  subCategory?: string | null;
  imageUrl: string;
}

export type SlotMap = Record<string, ArchiveItemData>; // key: `${year}-${slot}`

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: MainCategory;
  subCategory?: string;
  image: string;
}

export interface LocationInfo {
  city: string;
  country: string;
  countryCode: string;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  provider: string;
}

export interface PostCommentData {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export interface PostData {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
  title: string;
  caption?: string | null;
  city: string;
  country: string;
  countryCode: string;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  aspectRatio: AspectRatioOption;
  bgColor: string;
  textColor?: string | null;
  fontStyle: FontStyleOption;
  showLabels: boolean;
  remixCount: number;
  items: ArchiveItemData[];
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  comments?: PostCommentData[];
  createdAt: string;
  updatedAt: string;
}

export const THEME_PRESETS = [
  { name: 'Obsidian Black', hex: '#111827' },
  { name: 'Deep Olive', hex: '#3f5222' },
  { name: 'Cobalt Blue', hex: '#2563eb' },
  { name: 'Terracotta Coral', hex: '#d96b43' },
  { name: 'Mustard Gold', hex: '#eab308' },
  { name: 'Royal Plum', hex: '#7e22ce' },
  { name: 'Soft Olive', hex: '#e5ecd5' },
  { name: 'Warm Ivory', hex: '#f4efe6' },
  { name: 'Soft Rose', hex: '#fce7f3' },
  { name: 'Peach Coral', hex: '#ffedd5' },
  { name: 'Mint Breeze', hex: '#d1fae5' },
  { name: 'Baby Sky', hex: '#e0f2fe' },
];

export const FONT_OPTIONS: {
  id: FontStyleOption;
  label: string;
  cssFont: string;
  canvasFont: string;
}[] = [
  {
    id: 'sans',
    label: 'Modern Sans',
    cssFont: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
    canvasFont: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: 'serif',
    label: 'Editorial Serif',
    cssFont: 'Georgia, "Times New Roman", serif',
    canvasFont: 'Georgia, "Times New Roman", serif',
  },
  {
    id: 'mono',
    label: 'Mono Archive',
    cssFont: 'var(--font-geist-mono), ui-monospace, monospace',
    canvasFont: 'ui-monospace, "Cascadia Mono", Consolas, monospace',
  },
];

export const ASPECT_RATIO_OPTIONS: {
  id: AspectRatioOption;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}[] = [
  { id: '4:5', label: '4:5 Feed', sublabel: 'Instagram Post', width: 1080, height: 1350 },
  { id: '9:16', label: '9:16 Story', sublabel: 'Reels / Story', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 Square', sublabel: 'Profile / Grid', width: 1080, height: 1080 },
];

export const POPULAR_CITIES: LocationInfo[] = [
  { city: 'Seoul', country: 'South Korea', countryCode: 'KR', locationText: 'Seoul, KR', latitude: 37.57, longitude: 126.98 },
  { city: 'Busan', country: 'South Korea', countryCode: 'KR', locationText: 'Busan, KR', latitude: 35.18, longitude: 129.08 },
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP', locationText: 'Tokyo, JP', latitude: 35.68, longitude: 139.65 },
  { city: 'New York', country: 'United States', countryCode: 'US', locationText: 'New York, US', latitude: 40.71, longitude: -74.01 },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', locationText: 'London, GB', latitude: 51.51, longitude: -0.13 },
  { city: 'Paris', country: 'France', countryCode: 'FR', locationText: 'Paris, FR', latitude: 48.86, longitude: 2.35 },
  { city: 'San Francisco', country: 'United States', countryCode: 'US', locationText: 'San Francisco, US', latitude: 37.77, longitude: -122.42 },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', locationText: 'Singapore, SG', latitude: 1.35, longitude: 103.82 },
];

export function slotKey(year: number, slot: number): string {
  return `${year}-${slot}`;
}

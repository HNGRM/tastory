import type {
  ArchiveItemData,
  AspectRatioOption,
  FontStyleOption,
  MainCategory,
  PostData,
} from '@/types/archive';

export interface RawPostRecord {
  id: string;
  userId: string;
  title: string;
  caption: string | null;
  city: string;
  country: string;
  countryCode: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  aspectRatio: string;
  bgColor: string;
  textColor: string | null;
  fontStyle: string;
  showLabels: boolean;
  remixCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  items: {
    year: number;
    slot: number;
    title: string;
    subtitle: string;
    category: string;
    subCategory: string | null;
    imageUrl: string;
  }[];
  likes: { userId: string }[];
  _count: {
    likes: number;
    comments: number;
  };
  comments?: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      image: string | null;
    };
  }[];
}

export function serializePost(
  post: RawPostRecord,
  currentUserId: string | null,
): PostData {
  const items: ArchiveItemData[] = post.items
    .map((item) => ({
      year: item.year,
      slot: item.slot,
      title: item.title,
      subtitle: item.subtitle,
      category: item.category as MainCategory,
      subCategory: item.subCategory,
      imageUrl: item.imageUrl,
    }))
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.slot - b.slot));

  return {
    id: post.id,
    userId: post.userId,
    user: post.user,
    title: post.title,
    caption: post.caption,
    city: post.city,
    country: post.country,
    countryCode: post.countryCode,
    locationText: post.locationText,
    latitude: post.latitude,
    longitude: post.longitude,
    aspectRatio: (post.aspectRatio || '4:5') as AspectRatioOption,
    bgColor: post.bgColor,
    textColor: post.textColor,
    fontStyle: (post.fontStyle || 'sans') as FontStyleOption,
    showLabels: post.showLabels,
    remixCount: post.remixCount,
    items,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    isLikedByMe: currentUserId
      ? post.likes.some((l) => l.userId === currentUserId)
      : false,
    comments: post.comments?.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function sanitizePostItems(rawItems: unknown): ArchiveItemData[] {
  if (!Array.isArray(rawItems)) return [];
  const seen = new Set<string>();
  const valid: ArchiveItemData[] = [];

  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const year = Number(item.year);
    const slot = Number(item.slot);
    if (
      !Number.isInteger(year) ||
      year < 2021 ||
      year > 2025 ||
      !Number.isInteger(slot) ||
      slot < 1 ||
      slot > 3
    ) {
      continue;
    }

    const key = `${year}-${slot}`;
    if (seen.has(key)) continue;

    const title = String(item.title || '').trim().slice(0, 120);
    const subtitle = String(item.subtitle || '').trim().slice(0, 120);
    const imageUrl = String(item.imageUrl || '').trim();
    const category = String(item.category || 'custom') as MainCategory;
    const subCategory = item.subCategory ? String(item.subCategory) : null;

    if (!title || !imageUrl) continue;

    seen.add(key);
    valid.push({
      year,
      slot,
      title,
      subtitle: subtitle || 'Custom Entry',
      category,
      subCategory,
      imageUrl,
    });
  }

  return valid;
}

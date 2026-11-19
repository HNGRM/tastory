import type { SearchResultItem } from '@/types/archive';

export const MOCK_MEDIA: SearchResultItem[] = [
  { id: 'mock-m1', title: 'Squid Game', subtitle: 'Drama · 2021 (Demo)', category: 'media', subCategory: 'drama', image: '/seed/squid-game.svg' },
  { id: 'mock-m2', title: 'Spider-Man: No Way Home', subtitle: 'Movie · 2021 (Demo)', category: 'media', subCategory: 'movie', image: '/seed/spiderman-nwh.svg' },
  { id: 'mock-m3', title: 'Dune: Part Two', subtitle: 'Movie · 2024 (Demo)', category: 'media', subCategory: 'movie', image: '/seed/dune-2.svg' },
  { id: 'mock-m4', title: 'Everything Everywhere All at Once', subtitle: 'Movie · 2022 (Demo)', category: 'media', subCategory: 'movie', image: '/seed/everything-everywhere.svg' },
  { id: 'mock-m5', title: 'Frieren: Beyond Journey\'s End', subtitle: 'Anime · 2023 (Demo)', category: 'media', subCategory: 'anime', image: '/seed/frieren.svg' },
  { id: 'mock-m6', title: 'Culinary Class Wars', subtitle: 'Variety · 2024 (Demo)', category: 'media', subCategory: 'variety', image: '/seed/culinary-class.svg' },
  { id: 'mock-m7', title: 'Severance', subtitle: 'Drama · 2025 (Demo)', category: 'media', subCategory: 'drama', image: '/seed/severance.svg' },
  { id: 'mock-m8', title: 'Oppenheimer', subtitle: 'Movie · 2023 (Demo)', category: 'media', subCategory: 'movie', image: '/seed/oppenheimer.svg' },
];

export const MOCK_MUSIC: SearchResultItem[] = [
  { id: 'mock-mu1', title: 'Hype Boy', subtitle: 'Song · NewJeans · 2022 (Demo)', category: 'music', subCategory: 'song', image: '/seed/hype-boy.svg' },
  { id: 'mock-mu2', title: 'I AM', subtitle: 'Song · IVE · 2023 (Demo)', category: 'music', subCategory: 'song', image: '/seed/i-am-ive.svg' },
  { id: 'mock-mu3', title: 'GNX', subtitle: 'Album · Kendrick Lamar · 2024 (Demo)', category: 'music', subCategory: 'album', image: '/seed/gnx.svg' },
  { id: 'mock-mu4', title: 'BRAT', subtitle: 'Album · Charli xcx · 2024 (Demo)', category: 'music', subCategory: 'album', image: '/seed/brat.svg' },
  { id: 'mock-mu5', title: 'HOME SWEET HOME', subtitle: 'Song · G-DRAGON · 2024 (Demo)', category: 'music', subCategory: 'song', image: '/seed/home-sweet-home.svg' },
];

export const MOCK_BOOKS: SearchResultItem[] = [
  { id: 'mock-b1', title: 'Human Acts', subtitle: 'Han Kang · 2014 (Demo)', category: 'book', image: '/seed/human-acts.svg' },
  { id: 'mock-b2', title: 'Project Hail Mary', subtitle: 'Andy Weir · 2021 (Demo)', category: 'book', image: '/seed/project-hail-mary.svg' },
  { id: 'mock-b3', title: 'Klara and the Sun', subtitle: 'Kazuo Ishiguro · 2021 (Demo)', category: 'book', image: '/seed/klara-sun.svg' },
];

export const MOCK_GAMES: SearchResultItem[] = [
  { id: 'mock-g1', title: 'Elden Ring', subtitle: 'Game · FromSoftware · 2022 (Demo)', category: 'game', image: '/seed/elden-ring.svg' },
  { id: 'mock-g2', title: 'The Legend of Zelda: Tears of the Kingdom', subtitle: 'Game · Nintendo · 2023 (Demo)', category: 'game', image: '/seed/zelda-totk.svg' },
  { id: 'mock-g3', title: 'Balatro', subtitle: 'Game · Indie · 2024 (Demo)', category: 'game', image: '/seed/balatro.svg' },
  { id: 'mock-g4', title: 'Palworld', subtitle: 'Game · Pocketpair · 2024 (Demo)', category: 'game', image: '/seed/palworld.svg' },
  { id: 'mock-g5', title: 'Monster Hunter Wilds', subtitle: 'Game · Capcom · 2025 (Demo)', category: 'game', image: '/seed/monster-hunter-wilds.svg' },
  { id: 'mock-g6', title: 'Pokemon Legends: Z-A', subtitle: 'Game · Nintendo · 2025 (Demo)', category: 'game', image: '/seed/pokemon-za.svg' },
];

export function filterMockResults(
  items: SearchResultItem[],
  query: string,
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const matched = items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q),
  );
  return matched.length > 0 ? matched : items;
}

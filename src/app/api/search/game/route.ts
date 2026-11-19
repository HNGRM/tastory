import { NextRequest, NextResponse } from 'next/server';
import { filterMockResults, MOCK_GAMES } from '@/../data/mockFallback';
import type { SearchResultItem } from '@/types/archive';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || '';
  if (!query) {
    return NextResponse.json({ results: [], source: 'empty' });
  }

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      results: filterMockResults(MOCK_GAMES, query),
      source: 'demo-fallback',
    });
  }

  try {
    const rawgUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=20`;
    const res = await fetch(rawgUrl, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`RAWG responded with ${res.status}`);
    }

    const data = await res.json();
    const results: SearchResultItem[] = (data.results || [])
      .filter((game: { background_image?: string; name?: string }) => game.background_image && game.name)
      .map(
        (game: {
          id: number;
          name: string;
          released?: string;
          background_image: string;
          platforms?: { platform?: { name?: string } }[];
        }) => {
          const year = (game.released || '').split('-')[0];
          const platforms = (game.platforms || [])
            .map((p) => p.platform?.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(', ');
          return {
            id: `rawg-${game.id}`,
            title: game.name,
            subtitle: `Game${platforms ? ` · ${platforms}` : ''}${year ? ` · ${year}` : ''}`,
            category: 'game',
            image: game.background_image,
          };
        },
      );

    return NextResponse.json({ results, source: 'rawg' });
  } catch (error) {
    console.error('RAWG game search error:', error);
    return NextResponse.json({
      results: filterMockResults(MOCK_GAMES, query),
      source: 'demo-fallback',
    });
  }
}

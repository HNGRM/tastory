import { NextRequest, NextResponse } from 'next/server';
import { filterMockResults, MOCK_MEDIA } from '@/../data/mockFallback';
import type { SearchResultItem } from '@/types/archive';

const HANGUL_REGEX = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || '';
  if (!query) {
    return NextResponse.json({ results: [], source: 'empty' });
  }

  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({
      results: filterMockResults(MOCK_MEDIA, query),
      source: 'demo-fallback',
    });
  }

  try {
    const lang = HANGUL_REGEX.test(query) ? 'ko-KR' : 'en-US';
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=${lang}&page=1`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`TMDB responded with ${res.status}`);
    }

    const data = await res.json();
    const results: SearchResultItem[] = (data.results || [])
      .filter(
        (item: { media_type?: string; poster_path?: string }) =>
          (item.media_type === 'movie' || item.media_type === 'tv') &&
          Boolean(item.poster_path),
      )
      .slice(0, 24)
      .map(
        (item: {
          id: number;
          media_type: string;
          title?: string;
          name?: string;
          release_date?: string;
          first_air_date?: string;
          genre_ids?: number[];
          origin_country?: string[];
          poster_path: string;
        }) => {
          const isMovie = item.media_type === 'movie';
          const title = item.title || item.name || 'Untitled';
          const rawDate = item.release_date || item.first_air_date || '';
          const year = rawDate ? rawDate.split('-')[0] : '';
          const genres = item.genre_ids || [];
          const origin = item.origin_country || [];

          let subCategory = isMovie ? 'movie' : 'drama';
          let typeLabel = isMovie ? 'Movie' : 'TV Series';

          if (genres.includes(16) && (origin.includes('JP') || lang === 'ko-KR')) {
            subCategory = 'anime';
            typeLabel = 'Anime';
          } else if (!isMovie && (genres.includes(10764) || genres.includes(10767))) {
            subCategory = 'variety';
            typeLabel = 'Variety';
          }

          return {
            id: `tmdb-${item.media_type}-${item.id}`,
            title,
            subtitle: year ? `${typeLabel} · ${year}` : typeLabel,
            category: 'media',
            subCategory,
            image: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          };
        },
      );

    return NextResponse.json({ results, source: 'tmdb' });
  } catch (error) {
    console.error('TMDB search error:', error);
    return NextResponse.json({
      results: filterMockResults(MOCK_MEDIA, query),
      source: 'demo-fallback',
    });
  }
}

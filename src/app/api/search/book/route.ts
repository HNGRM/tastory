import { NextRequest, NextResponse } from 'next/server';
import { filterMockResults, MOCK_BOOKS } from '@/../data/mockFallback';
import type { SearchResultItem } from '@/types/archive';

async function searchOpenLibrary(query: string): Promise<SearchResultItem[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || [])
    .filter((doc: { cover_i?: number; title?: string }) => doc.cover_i && doc.title)
    .slice(0, 20)
    .map(
      (
        doc: {
          key: string;
          title: string;
          author_name?: string[];
          first_publish_year?: number;
          cover_i: number;
        },
        idx: number,
      ) => ({
        id: `ol-${idx}-${doc.key ? doc.key.replace(/\//g, '-') : idx}`,
        title: doc.title,
        subtitle: `${doc.author_name?.[0] || 'Unknown Author'}${doc.first_publish_year ? ` · ${doc.first_publish_year}` : ''}`,
        category: 'book',
        image: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
      }),
    );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || '';
  if (!query) {
    return NextResponse.json({ results: [], source: 'empty' });
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;

  if (kakaoKey) {
    try {
      const kakaoUrl = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=24`;
      const res = await fetch(kakaoUrl, {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const results: SearchResultItem[] = (data.documents || [])
          .filter((doc: { thumbnail?: string; title?: string }) => doc.thumbnail && doc.title)
          .map(
            (
              doc: {
                isbn?: string;
                title: string;
                authors?: string[];
                publisher?: string;
                datetime?: string;
                thumbnail: string;
              },
              idx: number,
            ) => {
              const authors = (doc.authors || []).join(', ') || 'Unknown Author';
              const year = (doc.datetime || '').split('-')[0];
              const cleanIsbn = (doc.isbn || '').trim().replace(/\s+/g, '-');
              return {
                id: `kakao-${idx}-${cleanIsbn || idx}`,
                title: doc.title,
                subtitle: `${authors}${year ? ` · ${year}` : ''}`,
                category: 'book',
                image: doc.thumbnail,
              };
            },
          );

        if (results.length > 0) {
          return NextResponse.json({ results, source: 'kakao' });
        }
      }
    } catch (error) {
      console.error('Kakao book search failed, trying Open Library:', error);
    }
  }

  try {
    const olResults = await searchOpenLibrary(query);
    if (olResults.length > 0) {
      return NextResponse.json({ results: olResults, source: 'openlibrary' });
    }
  } catch (error) {
    console.error('Open Library search failed:', error);
  }

  return NextResponse.json({
    results: filterMockResults(MOCK_BOOKS, query),
    source: 'demo-fallback',
  });
}

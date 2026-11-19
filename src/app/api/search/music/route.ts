import { NextRequest, NextResponse } from 'next/server';
import { filterMockResults, MOCK_MUSIC } from '@/../data/mockFallback';
import type { SearchResultItem } from '@/types/archive';

const HANGUL_REGEX = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || '';
  if (!query) {
    return NextResponse.json({ results: [], source: 'empty' });
  }

  try {
    const encoded = encodeURIComponent(query);
    const country = HANGUL_REGEX.test(query) ? 'KR' : 'US';

    const [songRes, albumRes] = await Promise.all([
      fetch(
        `https://itunes.apple.com/search?term=${encoded}&country=${country}&media=music&entity=song&limit=20`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' },
      ),
      fetch(
        `https://itunes.apple.com/search?term=${encoded}&country=${country}&media=music&entity=album&limit=15`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' },
      ),
    ]);

    const songData = songRes.ok ? await songRes.json() : { results: [] };
    const albumData = albumRes.ok ? await albumRes.json() : { results: [] };

    const songs: SearchResultItem[] = (songData.results || [])
      .filter((item: { artworkUrl100?: string; trackName?: string }) => item.artworkUrl100 && item.trackName)
      .map((item: { trackId: number; trackName: string; artistName?: string; releaseDate?: string; artworkUrl100: string }) => {
        const year = (item.releaseDate || '').split('-')[0];
        return {
          id: `itunes-song-${item.trackId}`,
          title: item.trackName,
          subtitle: `Song · ${item.artistName || 'Unknown'}${year ? ` · ${year}` : ''}`,
          category: 'music',
          subCategory: 'song',
          image: item.artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg'),
        };
      });

    const albums: SearchResultItem[] = (albumData.results || [])
      .filter((item: { artworkUrl100?: string; collectionName?: string }) => item.artworkUrl100 && item.collectionName)
      .map((item: { collectionId: number; collectionName: string; artistName?: string; releaseDate?: string; artworkUrl100: string }) => {
        const year = (item.releaseDate || '').split('-')[0];
        return {
          id: `itunes-album-${item.collectionId}`,
          title: item.collectionName,
          subtitle: `Album · ${item.artistName || 'Unknown'}${year ? ` · ${year}` : ''}`,
          category: 'music',
          subCategory: 'album',
          image: item.artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg'),
        };
      });

    const merged: SearchResultItem[] = [];
    const maxLen = Math.max(songs.length, albums.length);
    for (let i = 0; i < maxLen; i++) {
      if (songs[i]) merged.push(songs[i]);
      if (albums[i]) merged.push(albums[i]);
    }

    return NextResponse.json({ results: merged.slice(0, 30), source: 'itunes' });
  } catch (error) {
    console.error('iTunes search error:', error);
    return NextResponse.json({
      results: filterMockResults(MOCK_MUSIC, query),
      source: 'demo-fallback',
    });
  }
}

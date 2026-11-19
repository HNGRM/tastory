import { NextRequest, NextResponse } from 'next/server';
import { POPULAR_CITIES } from '@/types/archive';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestKnownCity(lat: number, lng: number) {
  let best = POPULAR_CITIES[0];
  let bestDist = Infinity;
  for (const c of POPULAR_CITIES) {
    if (c.latitude == null || c.longitude == null) continue;
    const d = haversineKm(lat, lng, c.latitude, c.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return {
    city: best.city,
    country: best.country,
    countryCode: best.countryCode,
    locationText: best.locationText,
    latitude: Number(lat.toFixed(2)),
    longitude: Number(lng.toFixed(2)),
  };
}

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get('lat');
  const lngParam = request.nextUrl.searchParams.get('lng');

  const lat = latParam ? Number(latParam) : NaN;
  const lng = lngParam ? Number(lngParam) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: 'Valid lat and lng query parameters are required.' },
      { status: 400 },
    );
  }

  // Round coordinates to ~1km city precision for privacy
  const roundedLat = Number(lat.toFixed(2));
  const roundedLng = Number(lng.toFixed(2));

  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${roundedLat}&longitude=${roundedLng}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const city =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        'Unknown City';
      const country = data.countryName || 'Unknown Country';
      const countryCode = data.countryCode || '';
      const locationText = countryCode ? `${city}, ${countryCode}` : `${city}, ${country}`;

      return NextResponse.json({
        city,
        country,
        countryCode,
        locationText,
        latitude: roundedLat,
        longitude: roundedLng,
        source: 'bigdatacloud',
      });
    }
  } catch (error) {
    console.error('BigDataCloud reverse geocode failed:', error);
  }

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&accept-language=en`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': 'TASTORY/1.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.state ||
        'Unknown City';
      const country = addr.country || 'Unknown Country';
      const countryCode = (addr.country_code || '').toUpperCase();
      const locationText = countryCode ? `${city}, ${countryCode}` : `${city}, ${country}`;

      return NextResponse.json({
        city,
        country,
        countryCode,
        locationText,
        latitude: roundedLat,
        longitude: roundedLng,
        source: 'nominatim',
      });
    }
  } catch (error) {
    console.error('Nominatim reverse geocode failed:', error);
  }

  return NextResponse.json({
    ...nearestKnownCity(roundedLat, roundedLng),
    source: 'fallback',
  });
}

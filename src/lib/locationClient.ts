import type { LocationInfo } from '@/types/archive';

export async function detectBrowserLocation(): Promise<LocationInfo> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    });
  });

  const { latitude, longitude } = position.coords;
  const res = await fetch(
    `/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
  );

  if (!res.ok) {
    throw new Error('Failed to resolve city from coordinates.');
  }

  return (await res.json()) as LocationInfo;
}

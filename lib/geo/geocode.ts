export interface Place {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface OpenMeteoResult {
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * Looks up a birthplace with the free Open-Meteo geocoding API.
 * Only the place text is sent. It never sees the birth date, time or name.
 * "Toronto, Ontario, Canada" searches for "Toronto", then ranks matches that fit "Ontario" and "Canada".
 */
export async function searchPlaces(text: string): Promise<Place[]> {
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return [];
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&name=' +
    encodeURIComponent(parts[0]);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Place lookup failed. Check your connection and try again.');
  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  const hints = parts.slice(1).map((s) => s.toLowerCase());

  const scored = (data.results ?? [])
    .filter((r) => r.timezone)
    .map((r, i) => {
      const hay = [r.admin1, r.country, r.country_code].filter(Boolean).join(' ').toLowerCase();
      const score = hints.reduce((n, h) => n + (hay.includes(h) ? 1 : 0), 0);
      return { r, score, i };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i);

  return scored.map(({ r }) => ({
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone as string,
  }));
}

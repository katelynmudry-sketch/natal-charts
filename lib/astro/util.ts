export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

/** Wrap any angle into 0..360. */
export function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** Wrap any angle into -180..180. */
export function norm180(deg: number): number {
  const r = norm360(deg);
  return r > 180 ? r - 360 : r;
}

export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

export function signIndex(lon: number): number {
  return Math.floor(norm360(lon) / 30) % 12;
}

export function signOf(lon: number): Sign {
  return SIGNS[signIndex(lon)];
}

/** Degree within the sign, 0..30 (not rounded). */
export function degreeInSign(lon: number): number {
  return norm360(lon) % 30;
}

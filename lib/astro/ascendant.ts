import * as Astronomy from 'astronomy-engine';
import { norm360, toDeg, toRad } from './util';

/** Mean obliquity of the ecliptic in degrees (IAU 2006 polynomial, T in centuries from J2000). */
export function obliquity(date: Date): number {
  const T = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (36525 * 86400 * 1000);
  const arcsec = 84381.406 - 46.836769 * T - 0.0001831 * T * T + 0.0020034 * T ** 3;
  return arcsec / 3600;
}

/** Right ascension of the Midheaven, in degrees (local apparent sidereal time). */
export function ramc(date: Date, eastLongitude: number): number {
  const gastHours = Astronomy.SiderealTime(date);
  return norm360(gastHours * 15 + eastLongitude);
}

/**
 * Ascendant longitude in degrees.
 * atan2 handles the quadrant, so no extra correction is needed.
 * East longitude is positive, north latitude is positive.
 */
export function ascendant(date: Date, latitude: number, eastLongitude: number): number {
  const theta = toRad(ramc(date, eastLongitude));
  const eps = toRad(obliquity(date));
  const phi = toRad(latitude);
  const y = Math.cos(theta);
  const x = -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  return norm360(toDeg(Math.atan2(y, x)));
}

/** Midheaven longitude in degrees (display only). */
export function midheaven(date: Date, eastLongitude: number): number {
  const theta = toRad(ramc(date, eastLongitude));
  const eps = toRad(obliquity(date));
  return norm360(toDeg(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps))));
}

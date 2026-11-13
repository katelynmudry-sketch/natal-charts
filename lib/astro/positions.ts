import * as Astronomy from 'astronomy-engine';
import { degreeInSign, norm180, norm360, signOf, type Sign } from './util';

export const CLASSIC_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'] as const;
export const MODERN_PLANETS = ['uranus', 'neptune', 'pluto'] as const;
export const ALL_PLANETS = [...CLASSIC_PLANETS, ...MODERN_PLANETS] as const;
export type PlanetId = (typeof ALL_PLANETS)[number];

const BODY: Record<PlanetId, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

export interface PlanetPosition {
  id: PlanetId;
  /** Tropical ecliptic longitude, 0..360. */
  lon: number;
  sign: Sign;
  /** Degree inside the sign, 0..30. */
  degree: number;
  retrograde: boolean;
}

/** Geocentric tropical longitude (true ecliptic and equinox of date). */
export function longitude(id: PlanetId, date: Date): number {
  const time = Astronomy.MakeTime(date);
  const eqj = Astronomy.GeoVector(BODY[id], time, true);
  const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), eqj);
  return norm360(Astronomy.SphereFromVector(ect).lon);
}

export function planetPosition(id: PlanetId, date: Date): PlanetPosition {
  const lon = longitude(id, date);
  let retrograde = false;
  if (id !== 'sun' && id !== 'moon') {
    const HALF_DAY = 12 * 3600 * 1000;
    const before = longitude(id, new Date(date.getTime() - HALF_DAY));
    const after = longitude(id, new Date(date.getTime() + HALF_DAY));
    retrograde = norm180(after - before) < 0;
  }
  return { id, lon, sign: signOf(lon), degree: degreeInSign(lon), retrograde };
}

export function allPositions(date: Date): Record<PlanetId, PlanetPosition> {
  const out = {} as Record<PlanetId, PlanetPosition>;
  for (const id of ALL_PLANETS) out[id] = planetPosition(id, date);
  return out;
}

import { norm180 } from './util';
import type { PlanetId } from './positions';

/** Same aspects and orbs as the Solarium chart app. */
export const ASPECTS = [
  { name: 'Conjunction', degrees: 0, orb: 8, dotted: false },
  { name: 'Opposition', degrees: 180, orb: 8, dotted: false },
  { name: 'Trine', degrees: 120, orb: 8, dotted: false },
  { name: 'Square', degrees: 90, orb: 8, dotted: false },
  { name: 'Sextile', degrees: 60, orb: 6, dotted: false },
  { name: 'Quincunx', degrees: 150, orb: 3, dotted: true },
] as const;

export interface Aspect {
  planet1: PlanetId;
  planet2: PlanetId;
  type: string;
  dotted: boolean;
}

export function findAspects(lons: Partial<Record<PlanetId, number>>): Aspect[] {
  const ids = Object.keys(lons) as PlanetId[];
  const out: Aspect[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const diff = Math.abs(norm180((lons[ids[i]] as number) - (lons[ids[j]] as number)));
      for (const a of ASPECTS) {
        if (Math.abs(diff - a.degrees) <= a.orb) {
          out.push({ planet1: ids[i], planet2: ids[j], type: a.name, dotted: a.dotted });
        }
      }
    }
  }
  return out;
}

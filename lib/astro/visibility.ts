import { norm180 } from './util';

export const BEAMS_ORB_DEG = 15;

export interface Visibility {
  /** Signed elongation, -180..180. Negative = west of the Sun. */
  elongation: number;
  star: 'morning' | 'evening';
  underBeams: boolean;
}

/**
 * Morning star: longitude behind the Sun (rises before it).
 * Evening star: longitude ahead of the Sun (sets after it).
 * Skyscope logic (heliacal rising, cazimi, combust) can extend this later.
 */
export function visibility(planetLon: number, sunLon: number): Visibility {
  const elongation = norm180(planetLon - sunLon);
  return {
    elongation,
    star: elongation < 0 ? 'morning' : 'evening',
    underBeams: Math.abs(elongation) <= BEAMS_ORB_DEG,
  };
}

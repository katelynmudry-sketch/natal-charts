import { norm360 } from './util';

export const MOON_PHASES = [
  'New', 'Crescent', 'First quarter', 'Gibbous',
  'Full', 'Disseminating', 'Last quarter', 'Balsamic',
] as const;
export type MoonPhase = (typeof MOON_PHASES)[number];

export interface MoonPhaseResult {
  angle: number;
  index: number;
  phase: MoonPhase;
}

/** Rudhyar's 8 lunation phases, each 45° wide. */
export function moonPhase(moonLon: number, sunLon: number): MoonPhaseResult {
  const angle = norm360(moonLon - sunLon);
  const index = Math.floor(angle / 45) % 8;
  return { angle, index, phase: MOON_PHASES[index] };
}

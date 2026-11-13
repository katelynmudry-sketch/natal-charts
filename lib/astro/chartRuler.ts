import { signOf, type Sign } from './util';
import type { PlanetId } from './positions';

export const TRADITIONAL_RULER: Record<Sign, PlanetId> = {
  Aries: 'mars',
  Taurus: 'venus',
  Gemini: 'mercury',
  Cancer: 'moon',
  Leo: 'sun',
  Virgo: 'mercury',
  Libra: 'venus',
  Scorpio: 'mars',
  Sagittarius: 'jupiter',
  Capricorn: 'saturn',
  Aquarius: 'saturn',
  Pisces: 'jupiter',
};

export function chartRuler(ascLon: number): PlanetId {
  return TRADITIONAL_RULER[signOf(ascLon)];
}

/* ---------------------------------------------------------------------------
 * Essential dignity scoring, ported from the cosmic-weaver-chart-links console:
 * domicile +5, exaltation +4, triplicity +3, term +2, face +1, detriment -5, fall -4.
 * Egyptian terms and Chaldean decan faces, as in that app's defaults.
 * ------------------------------------------------------------------------ */

const SEVEN: PlanetId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
const SIGN_ORDER: Sign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const EXALTATION: Record<string, Sign> = {
  sun: 'Aries', moon: 'Taurus', mercury: 'Virgo', venus: 'Pisces', mars: 'Capricorn', jupiter: 'Cancer', saturn: 'Libra',
};
const FALL: Record<string, Sign> = {
  sun: 'Libra', moon: 'Scorpio', mercury: 'Pisces', venus: 'Virgo', mars: 'Cancer', jupiter: 'Capricorn', saturn: 'Aries',
};
const DETRIMENT: Record<string, Sign[]> = {
  sun: ['Aquarius'], moon: ['Capricorn'], mercury: ['Sagittarius', 'Pisces'], venus: ['Aries', 'Scorpio'],
  mars: ['Libra', 'Taurus'], jupiter: ['Gemini', 'Virgo'], saturn: ['Cancer', 'Leo'],
};

/** Triplicity rulers by sign: [day, night, participating]. */
const FIRE: [PlanetId, PlanetId, PlanetId] = ['sun', 'jupiter', 'saturn'];
const EARTH: [PlanetId, PlanetId, PlanetId] = ['venus', 'moon', 'mars'];
const AIR: [PlanetId, PlanetId, PlanetId] = ['saturn', 'mercury', 'jupiter'];
const WATER: [PlanetId, PlanetId, PlanetId] = ['mars', 'mars', 'moon'];
const TRIPLICITY: Record<Sign, [PlanetId, PlanetId, PlanetId]> = {
  Aries: FIRE, Leo: FIRE, Sagittarius: FIRE, Taurus: EARTH, Virgo: EARTH, Capricorn: EARTH,
  Gemini: AIR, Libra: AIR, Aquarius: AIR, Cancer: WATER, Scorpio: WATER, Pisces: WATER,
};

/** Egyptian terms: [ruler, end degree] in order through each sign. */
const EGYPTIAN: Record<Sign, [PlanetId, number][]> = {
  Aries: [['jupiter', 6], ['venus', 12], ['mercury', 20], ['mars', 25], ['saturn', 30]],
  Taurus: [['venus', 8], ['mercury', 14], ['jupiter', 22], ['saturn', 27], ['mars', 30]],
  Gemini: [['mercury', 6], ['jupiter', 12], ['venus', 17], ['mars', 24], ['saturn', 30]],
  Cancer: [['mars', 7], ['venus', 13], ['mercury', 19], ['jupiter', 26], ['saturn', 30]],
  Leo: [['jupiter', 6], ['venus', 11], ['saturn', 18], ['mercury', 24], ['mars', 30]],
  Virgo: [['mercury', 7], ['venus', 17], ['jupiter', 21], ['mars', 28], ['saturn', 30]],
  Libra: [['saturn', 6], ['mercury', 14], ['jupiter', 21], ['venus', 28], ['mars', 30]],
  Scorpio: [['mars', 7], ['venus', 11], ['mercury', 19], ['jupiter', 24], ['saturn', 30]],
  Sagittarius: [['jupiter', 12], ['venus', 17], ['mercury', 21], ['saturn', 26], ['mars', 30]],
  Capricorn: [['mercury', 7], ['jupiter', 14], ['venus', 22], ['saturn', 26], ['mars', 30]],
  Aquarius: [['mercury', 7], ['venus', 13], ['jupiter', 20], ['mars', 25], ['saturn', 30]],
  Pisces: [['venus', 12], ['jupiter', 16], ['mercury', 19], ['mars', 28], ['saturn', 30]],
};

/** Chaldean decan faces: 36 faces from Aries 0° starting with Mars. */
const CHALDEAN: PlanetId[] = ['mars', 'sun', 'venus', 'mercury', 'moon', 'saturn', 'jupiter'];

/**
 * Score one planet. `isDay` null means the birth time is unknown, so only triplicity points that
 * hold for both day and night count (the participating ruler, or a planet that rules both).
 */
export function dignityScore(planet: PlanetId, sign: Sign, degree: number, isDay: boolean | null): number {
  let score = 0;
  if (TRADITIONAL_RULER[sign] === planet) score += 5;
  if (EXALTATION[planet] === sign) score += 4;

  const [dayR, nightR, partR] = TRIPLICITY[sign];
  const triplicity = isDay === null ? dayR === planet && nightR === planet : (isDay ? dayR : nightR) === planet;
  if (triplicity || partR === planet) score += 3;

  const term = EGYPTIAN[sign].find(([, end]) => degree < end);
  if (term && term[0] === planet) score += 2;

  const face = CHALDEAN[(SIGN_ORDER.indexOf(sign) * 3 + Math.floor(degree / 10)) % 7];
  if (face === planet) score += 1;

  if (DETRIMENT[planet].includes(sign)) score -= 5;
  if (FALL[planet] === sign) score -= 4;
  return score;
}

/** The traditional planet with the highest score. Ties are all returned (Sun to Saturn order). */
export function mostDignified(
  placed: Record<PlanetId, { sign: Sign; degree: number }>,
  isDay: boolean | null,
): { planets: PlanetId[]; score: number } {
  const scored = SEVEN.map((id) => ({ id, score: dignityScore(id, placed[id].sign, placed[id].degree, isDay) }));
  const best = Math.max(...scored.map((s) => s.score));
  return { planets: scored.filter((s) => s.score === best).map((s) => s.id), score: best };
}

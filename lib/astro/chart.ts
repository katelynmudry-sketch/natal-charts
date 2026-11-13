import { allPositions, type PlanetId, type PlanetPosition } from './positions';
import { ascendant, midheaven } from './ascendant';
import { wholeSignHouse } from './houses';
import { sect, type Sect } from './sect';
import { chartRuler, mostDignified } from './chartRuler';
import { visibility, type Visibility } from './visibility';
import { moonPhase, type MoonPhaseResult } from './moonPhase';
import { degreeInSign, signOf, type Sign } from './util';
import { localDayBounds, toUtc, type LocalBirth } from '../time/toUtc';
import { longitude } from './positions';

export interface ChartInput extends LocalBirth {
  latitude: number;
  longitude: number; // east positive
}

export interface PlacedPlanet extends PlanetPosition {
  house: number | null;
}

export interface Chart {
  timeKnown: boolean;
  planets: Record<PlanetId, PlacedPlanet>;
  rising: { lon: number; sign: Sign; degree: number } | null;
  midheaven: { lon: number; sign: Sign; degree: number } | null;
  sect: Sect | null;
  /** Ruler of the Ascendant. Timed charts only. */
  chartRuler: { planet: PlanetId; sign: Sign; house: number } | null;
  /** Most dignified of the seven traditional planets. Always present; ties listed in `alsoTied`. */
  dignified: { planet: PlanetId; sign: Sign; house: number | null; alsoTied: PlanetId[]; score: number };
  stars: { mercury: Visibility; venus: Visibility };
  moonPhase: MoonPhaseResult;
  /** Unknown time only: both signs if the Moon changed sign during the local day. */
  moonSigns: Sign[];
}

export function buildChart(input: ChartInput): Chart {
  const timeKnown = input.time !== null;
  const when = toUtc(input);
  const positions = allPositions(when);
  const sunLon = positions.sun.lon;

  const ascLon = timeKnown ? ascendant(when, input.latitude, input.longitude) : null;
  const planets = {} as Record<PlanetId, PlacedPlanet>;
  for (const [id, p] of Object.entries(positions) as [PlanetId, PlanetPosition][]) {
    planets[id] = { ...p, house: ascLon === null ? null : wholeSignHouse(p.lon, ascLon) };
  }

  const stars = {
    mercury: visibility(positions.mercury.lon, sunLon),
    venus: visibility(positions.venus.lon, sunLon),
  };

  let moonSigns: Sign[] = [positions.moon.sign];
  if (!timeKnown) {
    const [start, end] = localDayBounds(input.date, input.zone);
    const s = signOf(longitude('moon', start));
    const e = signOf(longitude('moon', new Date(end.getTime() - 1)));
    moonSigns = s === e ? [s] : [s, e];
  }

  const rulerPlanet = ascLon === null ? null : chartRuler(ascLon);
  const sectInfo = timeKnown ? sect(when, input.latitude, input.longitude, stars.mercury.star === 'morning') : null;
  const best = mostDignified(planets, sectInfo ? sectInfo.isDay : null);
  const top = best.planets[0];
  return {
    timeKnown,
    planets,
    rising: ascLon === null ? null : { lon: ascLon, sign: signOf(ascLon), degree: degreeInSign(ascLon) },
    midheaven: timeKnown
      ? (() => {
          const mc = midheaven(when, input.longitude);
          return { lon: mc, sign: signOf(mc), degree: degreeInSign(mc) };
        })()
      : null,
    sect: sectInfo,
    chartRuler:
      rulerPlanet === null || ascLon === null
        ? null
        : { planet: rulerPlanet, sign: planets[rulerPlanet].sign, house: wholeSignHouse(planets[rulerPlanet].lon, ascLon) },
    dignified: { planet: top, sign: planets[top].sign, house: planets[top].house, alsoTied: best.planets.slice(1), score: best.score },
    stars,
    moonPhase: moonPhase(positions.moon.lon, sunLon),
    moonSigns,
  };
}

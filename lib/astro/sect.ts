import * as Astronomy from 'astronomy-engine';
import type { PlanetId } from './positions';

/** Standard sunrise/sunset: Sun's center 0.833° below the horizon. */
const HORIZON_ALT = -0.833;
const NEAR_HORIZON_DEG = 1;

export interface Sect {
  isDay: boolean;
  sunAltitude: number;
  nearHorizon: boolean;
  allyPlanet: PlanetId;
  teacherPlanet: PlanetId;
  dayTeam: PlanetId[];
  nightTeam: PlanetId[];
}

export function sunAltitude(date: Date, latitude: number, eastLongitude: number): number {
  const observer = new Astronomy.Observer(latitude, eastLongitude, 0);
  const eq = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
  return Astronomy.Horizon(date, observer, eq.ra, eq.dec).altitude;
}

/**
 * Mercury joins the day team as a morning star, the night team as an evening star.
 * `mercuryIsMorning` comes from visibility.ts.
 */
export function sect(
  date: Date,
  latitude: number,
  eastLongitude: number,
  mercuryIsMorning: boolean,
): Sect {
  const alt = sunAltitude(date, latitude, eastLongitude);
  const isDay = alt > HORIZON_ALT;
  const dayTeam: PlanetId[] = ['sun', 'jupiter', 'saturn'];
  const nightTeam: PlanetId[] = ['moon', 'venus', 'mars'];
  (mercuryIsMorning ? dayTeam : nightTeam).push('mercury');
  return {
    isDay,
    sunAltitude: alt,
    nearHorizon: Math.abs(alt - HORIZON_ALT) <= NEAR_HORIZON_DEG,
    allyPlanet: isDay ? 'jupiter' : 'venus',
    teacherPlanet: isDay ? 'mars' : 'saturn',
    dayTeam,
    nightTeam,
  };
}

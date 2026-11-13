import { describe, expect, it } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { longitude, planetPosition } from '../lib/astro/positions';
import { ascendant, obliquity } from '../lib/astro/ascendant';
import { wholeSignHouse } from '../lib/astro/houses';
import { moonPhase } from '../lib/astro/moonPhase';
import { visibility } from '../lib/astro/visibility';
import { chartRuler, dignityScore } from '../lib/astro/chartRuler';
import { sect } from '../lib/astro/sect';
import { buildChart } from '../lib/astro/chart';
import { norm180 } from '../lib/astro/util';
import { toUtc } from '../lib/time/toUtc';

const J2000 = new Date(Date.UTC(2000, 0, 1, 12));

describe('positions', () => {
  it('puts the Sun near 280.4° (10° Capricorn) at J2000', () => {
    expect(longitude('sun', J2000)).toBeCloseTo(280.37, 1);
  });
  it('puts the Moon near 223.3° at J2000', () => {
    expect(Math.abs(longitude('moon', J2000) - 223.3)).toBeLessThan(0.2);
  });
  it('flags Mercury retrograde on 2024-04-05 and direct on 2024-05-15', () => {
    expect(planetPosition('mercury', new Date(Date.UTC(2024, 3, 5))).retrograde).toBe(true);
    expect(planetPosition('mercury', new Date(Date.UTC(2024, 4, 15))).retrograde).toBe(false);
  });
  it('never marks the Sun or Moon retrograde', () => {
    expect(planetPosition('sun', J2000).retrograde).toBe(false);
    expect(planetPosition('moon', J2000).retrograde).toBe(false);
  });
});

describe('ascendant', () => {
  const cases = [
    { name: 'Toronto', lat: 43.65, lon: -79.38, when: new Date(Date.UTC(1990, 6, 1, 18, 30)) },
    { name: 'Sydney', lat: -33.87, lon: 151.21, when: new Date(Date.UTC(1985, 11, 3, 2, 15)) },
    { name: 'Reykjavik', lat: 64.15, lon: -21.94, when: new Date(Date.UTC(2001, 2, 20, 9, 0)) },
  ];
  for (const c of cases) {
    it(`sits on the eastern horizon: ${c.name}`, () => {
      const asc = ascendant(c.when, c.lat, c.lon);
      const eps = (obliquity(c.when) * Math.PI) / 180;
      const lam = (asc * Math.PI) / 180;
      const dec = (Math.asin(Math.sin(eps) * Math.sin(lam)) * 180) / Math.PI;
      const ra = (((Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * 180) / Math.PI + 360) % 360) / 15;
      const hor = Astronomy.Horizon(c.when, new Astronomy.Observer(c.lat, c.lon, 0), ra, dec);
      expect(Math.abs(hor.altitude)).toBeLessThan(0.05);
      expect(Math.abs(norm180(hor.azimuth - 90))).toBeLessThan(90);
    });
  }
});

describe('houses, rulers, phases', () => {
  it('numbers whole sign houses from the Rising sign', () => {
    expect(wholeSignHouse(10, 275)).toBe(4); // Aries is the 4th sign counting from Capricorn
    expect(wholeSignHouse(280, 275)).toBe(1);
    expect(wholeSignHouse(265, 275)).toBe(12);
  });
  it('maps rising signs to traditional rulers', () => {
    expect(chartRuler(5)).toBe('mars');
    expect(chartRuler(125)).toBe('sun');
    expect(chartRuler(305)).toBe('saturn');
    expect(chartRuler(345)).toBe('jupiter');
  });
  it('names the 8 moon phases at 45° steps', () => {
    const names = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => moonPhase(a, 0).phase);
    expect(names).toEqual(['New', 'Crescent', 'First quarter', 'Gibbous', 'Full', 'Disseminating', 'Last quarter', 'Balsamic']);
    expect(moonPhase(10, 350).phase).toBe('New');
  });
  it('splits morning and evening stars and flags the beams', () => {
    expect(visibility(100, 110).star).toBe('morning');
    expect(visibility(120, 110).star).toBe('evening');
    expect(visibility(5, 355).star).toBe('evening'); // across 0°
    expect(visibility(100, 110).underBeams).toBe(true);
    expect(visibility(150, 110).underBeams).toBe(false);
  });
});

describe('sect', () => {
  it('is a day chart at local noon and a night chart at local midnight', () => {
    const noon = sect(new Date(Date.UTC(2020, 5, 21, 17, 0)), 43.65, -79.38, true); // 13:00 EDT
    const night = sect(new Date(Date.UTC(2020, 5, 22, 4, 0)), 43.65, -79.38, true); // 00:00 EDT
    expect(noon.isDay).toBe(true);
    expect(noon.allyPlanet).toBe('jupiter');
    expect(noon.teacherPlanet).toBe('mars');
    expect(night.isDay).toBe(false);
    expect(night.allyPlanet).toBe('venus');
    expect(night.teacherPlanet).toBe('saturn');
  });
});

describe('time zones', () => {
  it('uses daylight time in summer and standard time in winter', () => {
    expect(toUtc({ date: '1990-07-01', time: '12:00', zone: 'America/Toronto' }).toISOString()).toBe('1990-07-01T16:00:00.000Z');
    expect(toUtc({ date: '1990-01-15', time: '12:00', zone: 'America/Toronto' }).toISOString()).toBe('1990-01-15T17:00:00.000Z');
  });
  it('uses noon when the time is unknown', () => {
    expect(toUtc({ date: '1990-01-15', time: null, zone: 'UTC' }).toISOString()).toBe('1990-01-15T12:00:00.000Z');
  });
  it('rejects an unknown zone', () => {
    expect(() => toUtc({ date: '1990-01-15', time: '12:00', zone: 'Not/AZone' })).toThrow();
  });
});

describe('dignity scoring (same rules as the Lovable console)', () => {
  it('stacks domicile, triplicity, term, face, detriment and fall', () => {
    expect(dignityScore('sun', 'Leo', 5, true)).toBe(8); // domicile 5 + day triplicity 3
    expect(dignityScore('saturn', 'Cancer', 15, true)).toBe(-5); // detriment
    expect(dignityScore('venus', 'Pisces', 5, true)).toBe(6); // exaltation 4 + own term 2
  });
  it('untimed charts only count triplicity that holds day or night', () => {
    expect(dignityScore('sun', 'Aries', 15, true)).toBe(8); // exaltation 4 + day triplicity 3 + own face 1
    expect(dignityScore('sun', 'Aries', 15, null)).toBe(5); // no day-only triplicity
    expect(dignityScore('mars', 'Cancer', 15, null)).toBe(-1); // fall -4 + rules water by day and night +3
  });
});

describe('buildChart', () => {
  const base = { date: '1990-07-01', zone: 'America/Toronto', latitude: 43.65, longitude: -79.38 };
  it('fills houses, rising, sect and ruler when the time is known', () => {
    const c = buildChart({ ...base, time: '14:15' });
    expect(c.timeKnown).toBe(true);
    expect(c.rising).not.toBeNull();
    expect(c.sect).not.toBeNull();
    expect(c.chartRuler).not.toBeNull();
    expect(c.dignified.house).not.toBeNull();
    expect(c.planets.sun.house).toBeGreaterThanOrEqual(1);
    expect(c.planets.sun.sign).toBe('Cancer');
  });
  it('hides time-based features when the time is unknown', () => {
    const c = buildChart({ ...base, time: null });
    expect(c.timeKnown).toBe(false);
    expect(c.rising).toBeNull();
    expect(c.sect).toBeNull();
    expect(c.chartRuler).toBeNull();
    expect(c.dignified.house).toBeNull();
    expect(c.planets.sun.house).toBeNull();
    expect(c.moonSigns.length).toBeGreaterThanOrEqual(1);
  });
});

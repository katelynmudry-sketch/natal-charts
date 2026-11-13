import planetsJson from '../content/planets.json';
import signsJson from '../content/signs.json';
import housesJson from '../content/houses.json';
import sectJson from '../content/sect.json';
import moonJson from '../content/moon-phases.json';
import promptsJson from '../content/prompts.json';
import type { PlanetId } from './astro/positions';

export interface Entry {
  id: string;
  title: string;
  text: string;
  source: string;
}
export interface PlanetEntry extends Entry {
  symbol: string;
  color: string;
  rules: string[];
}
export interface SignEntry extends Entry {
  keyword: string;
}

export const PLANET_CONTENT = planetsJson as PlanetEntry[];
export const SIGN_CONTENT = signsJson as SignEntry[];
export const HOUSE_CONTENT = housesJson as Entry[];
export const SECT_CONTENT = sectJson as Entry[];
export const MOON_CONTENT = moonJson as Entry[];
export const PROMPT_CONTENT = promptsJson as Entry[];

export const planetInfo = (id: PlanetId) => PLANET_CONTENT.find((p) => p.id === id) as PlanetEntry;
export const byId = (list: Entry[], id: string) => list.find((e) => e.id === id);

/** Placeholder copy stays hidden from visitors until Katelyn writes it. */
export const isTodo = (text: string | undefined) => !text || text.trim().toUpperCase().startsWith('TODO');

import solarium from '../config/events/solarium.json';
import classFall from '../config/events/class-2026-fall.json';

export interface EventConfig {
  id: string;
  title: string;
  brands: { name: string; logo: string }[];
  hosts: { name: string; bookingUrl: string; blurb: string }[];
  colors: { primary: string; accent: string; background: string };
}

export const EVENTS: Record<string, EventConfig> = {
  solarium,
  'class-2026-fall': classFall,
};

export const isTodoValue = (v: string | undefined) => !v || v.trim().toUpperCase().startsWith('TODO');

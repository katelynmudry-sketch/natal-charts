import { signIndex } from './util';

/** Whole sign house (1..12) for a longitude, given the Rising sign's longitude. */
export function wholeSignHouse(lon: number, ascLon: number): number {
  return ((signIndex(lon) - signIndex(ascLon) + 12) % 12) + 1;
}

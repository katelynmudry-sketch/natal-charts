'use client';

import { useState } from 'react';
import { searchPlaces, type Place } from '../lib/geo/geocode';
import type { ChartInput } from '../lib/astro/chart';

export interface FormResult {
  name: string;
  input: ChartInput;
  placeLabel: string;
  ally: { text: string; link: string };
  save?: boolean;
}

export default function BirthForm({ onSubmit }: { onSubmit: (r: FormResult) => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [placeText, setPlaceText] = useState('');
  const [matches, setMatches] = useState<Place[]>([]);
  const [picked, setPicked] = useState(0);
  const [searching, setSearching] = useState(false);
  const [manual, setManual] = useState(false);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [zone, setZone] = useState('');
  const [allyText, setAllyText] = useState('');
  const [allyLink, setAllyLink] = useState('');
  const [save, setSave] = useState(true);
  const [error, setError] = useState('');

  async function find() {
    setError('');
    setSearching(true);
    try {
      const found = await searchPlaces(placeText);
      setMatches(found);
      setPicked(0);
      if (found.length === 0) setError('No places found. Try a different spelling, or enter the coordinates yourself.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Place lookup failed.');
    } finally {
      setSearching(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!date) return setError('Add a birth date.');
    if (!unknownTime && !time) return setError('Add a birth time, or tick "I don\'t know my birth time".');

    let latitude: number, longitude: number, timezone: string, label: string;
    if (manual) {
      latitude = Number(lat);
      longitude = Number(lon);
      timezone = zone.trim();
      label = `${latitude}, ${longitude}`;
      if (!lat || !lon || Number.isNaN(latitude) || Number.isNaN(longitude) || !timezone)
        return setError('Enter latitude, longitude and a time zone like America/Toronto.');
    } else {
      const p = matches[picked];
      if (!p) return setError('Search for your birthplace first, then pick the right match.');
      ({ latitude, longitude, timezone } = p);
      label = p.label;
    }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return setError('That latitude or longitude is out of range.');

    onSubmit({
      name: name.trim() || 'Your chart',
      placeLabel: label,
      input: { date, time: unknownTime ? null : time, zone: timezone, latitude, longitude },
      ally: { text: allyText, link: allyLink },
      save,
    });
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Enter your birth info</h2>
      <p className="muted">
        Everything is calculated in your browser. Nothing is sent anywhere except the place name, which goes to a
        free lookup service to find its coordinates. If you tick the box below, your info is kept on this device only.
      </p>

      <label>Name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>

      <div className="row">
        <label>Birth date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>Birth time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={unknownTime} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={unknownTime} onChange={(e) => setUnknownTime(e.target.checked)} />
        I don't know my birth time
      </label>

      <label>Birthplace (city, province or state, country)
        <div className="row">
          <input
            value={placeText}
            onChange={(e) => setPlaceText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void find(); } }}
            placeholder="Toronto, Ontario, Canada"
            disabled={manual}
          />
          <button type="button" className="btn" onClick={find} disabled={searching || manual || !placeText.trim()}>
            {searching ? 'Searching…' : 'Find place'}
          </button>
        </div>
      </label>

      {matches.length > 0 && !manual && (
        <label>Pick the right match
          <select value={picked} onChange={(e) => setPicked(Number(e.target.value))}>
            {matches.map((m, i) => (
              <option key={i} value={i}>{m.label} ({m.latitude.toFixed(2)}, {m.longitude.toFixed(2)}, {m.timezone})</option>
            ))}
          </select>
        </label>
      )}

      <label className="check">
        <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
        Enter coordinates myself
      </label>
      {manual && (
        <div className="row">
          <label>Latitude<input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="43.65" inputMode="decimal" /></label>
          <label>Longitude (west is negative)<input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="-79.38" inputMode="decimal" /></label>
          <label>Time zone<input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="America/Toronto" /></label>
        </div>
      )}

      <details>
        <summary>Optional: herbal ally</summary>
        <div className="row">
          <label>Herb<input value={allyText} onChange={(e) => setAllyText(e.target.value)} /></label>
          <label>Link<input value={allyLink} onChange={(e) => setAllyLink(e.target.value)} placeholder="https://" /></label>
        </div>
      </details>

      <label className="check">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
        Save this chart on this device so I don't have to re-enter it
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn primary">Make my chart</button>
    </form>
  );
}

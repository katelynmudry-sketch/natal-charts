'use client';

import { useEffect, useState } from 'react';
import BirthForm, { type FormResult } from '../components/BirthForm';
import ChartLayout from '../components/ChartLayout';
import FeatureCards from '../components/FeatureCards';
import Sidebar from '../components/Sidebar';
import Notes from '../components/Notes';
import Booking from '../components/Booking';
import { buildChart, type Chart } from '../lib/astro/chart';
import { EVENTS } from '../lib/event';

const event = EVENTS.solarium;
const SAVED_KEY = 'natal-saved-charts';
const LAST_KEY = 'natal-last-chart';
const THEME_KEY = 'natal-theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "1990-01-15" -> "15 January 1990" (no Date object, so no time zone shifts). */
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatTime(t: string | null) {
  if (!t) return 'time unknown';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function Page() {
  const [result, setResult] = useState<{ form: FormResult; chart: Chart } | null>(null);
  const [error, setError] = useState('');
  const [light, setLight] = useState(false);
  const [saved, setSaved] = useState<FormResult[]>([]);

  const idOf = (f: FormResult) => `${f.name}|${f.input.date}|${f.input.time ?? ''}`;
  const store = (list: FormResult[], last?: string) => {
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      if (last !== undefined) window.localStorage.setItem(LAST_KEY, last);
    } catch { /* storage blocked: the app still works, it just can't remember */ }
  };

  // Remember dark/white mode.
  useEffect(() => {
    try { if (window.localStorage.getItem(THEME_KEY) === 'light') setLight(true); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    try { window.localStorage.setItem(THEME_KEY, light ? 'light' : 'dark'); } catch { /* ignore */ }
  }, [light]);

  // On load, bring back saved charts and reopen the last one used.
  useEffect(() => {
    try {
      const list: FormResult[] = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? '[]');
      setSaved(list);
      const last = window.localStorage.getItem(LAST_KEY);
      const f = list.find((x) => idOf(x) === last);
      if (f) setResult({ form: f, chart: buildChart(f.input) });
    } catch { /* ignore bad saved data */ }
  }, []);

  function handle(form: FormResult) {
    try {
      setResult({ form, chart: buildChart(form.input) });
      if (form.save) {
        const { save: _s, ...clean } = form;
        const list = [...saved.filter((x) => idOf(x) !== idOf(clean)), clean];
        setSaved(list);
        store(list, idOf(clean));
      }
      setError('');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Something went wrong calculating that chart.');
    }
  }

  function open(f: FormResult) {
    setResult({ form: f, chart: buildChart(f.input) });
    store(saved, idOf(f));
    window.scrollTo({ top: 0 });
  }

  function remove(f: FormResult) {
    const list = saved.filter((x) => idOf(x) !== idOf(f));
    setSaved(list);
    store(list);
  }

  const first = result?.form.name.split(' ')[0] ?? '';

  return (
    <main className="page">
      <div className="actions no-print">
        <button type="button" className="btn" onClick={() => setLight((l) => !l)} aria-pressed={light}>
          {light ? 'Dark mode' : 'White mode'}
        </button>
      </div>
      <header className="header">
        <p className="brand">{event.brands.map((b) => b.name).join(' × ').toUpperCase()}</p>
        <h1>{result ? result.form.name : event.title}</h1>
        {result && (
          <p className="muted birth-data">
            Born {formatDate(result.form.input.date)} · {formatTime(result.form.input.time)} · {result.form.placeLabel}
          </p>
        )}
      </header>

      {!result && (
        <>
          {saved.length > 0 && (
            <div className="card">
              <h2>Saved charts</h2>
              {saved.map((f) => (
                <div className="row" key={idOf(f)}>
                  <button type="button" className="btn primary" onClick={() => open(f)}>{f.name} · {f.input.date}</button>
                  <button type="button" className="btn" onClick={() => remove(f)} aria-label={`Delete ${f.name}`}>Delete</button>
                </div>
              ))}
            </div>
          )}
          <BirthForm onSubmit={handle} />
          {error && <p className="error center" role="alert">{error}</p>}
        </>
      )}

      {result && (
        <>
          <div className="actions no-print">
            <button type="button" className="btn" onClick={() => setResult(null)}>Enter different birth info</button>
            <button type="button" className="btn" onClick={() => window.print()}>Print this page</button>
          </div>
          <div className="layout">
            <div className="main-col">
              <ChartLayout chart={result.chart} />
              <FeatureCards chart={result.chart} ally={result.form.ally} />
              <Notes slug="local" firstName={first} />
              <Booking event={event} />
            </div>
            <Sidebar chart={result.chart} />
          </div>
        </>
      )}
    </main>
  );
}

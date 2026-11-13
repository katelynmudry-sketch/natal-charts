import type { Chart } from '../lib/astro/chart';
import { ALL_PLANETS } from '../lib/astro/positions';
import { planetInfo } from '../lib/content';

const fmt = (deg: number) => {
  let d = Math.floor(deg);
  let m = Math.round((deg - d) * 60);
  if (m === 60) { d += 1; m = 0; }
  return `${d}°${String(m).padStart(2, '0')}'`;
};

export default function Sidebar({ chart }: { chart: Chart }) {
  return (
    <aside className="sidebar">
      <h2>Your placements</h2>

      {chart.rising && (
        <div className="planet-row" style={{ borderLeftColor: '#d4a843' }}>
          <div className="glyph" style={{ background: '#d4a843' }}>↑</div>
          <div>
            <div className="planet-name" style={{ color: '#d4a843' }}>Rising</div>
            <div>{chart.rising.sign} {fmt(chart.rising.degree)}</div>
            {chart.midheaven && <div className="muted">Midheaven: {chart.midheaven.sign} {fmt(chart.midheaven.degree)}</div>}
          </div>
        </div>
      )}

      {ALL_PLANETS.map((id) => {
        const info = planetInfo(id);
        const p = chart.planets[id];
        const moonSplit = id === 'moon' && !chart.timeKnown && chart.moonSigns.length > 1;
        return (
          <div key={id} className="planet-row" style={{ borderLeftColor: info.color }}>
            <div className="glyph" style={{ background: info.color, color: id === 'pluto' ? '#fff' : '#0a0e27' }}>{info.symbol}</div>
            <div>
              <div className="planet-name" style={{ color: info.color }}>
                {info.title}{p.retrograde && <span className="tag">retrograde</span>}
              </div>
              <div>
                {moonSplit ? chart.moonSigns.join(' or ') : <>{p.sign} {fmt(p.degree)}</>}
                {p.house && <span className="muted"> · house {p.house}</span>}
              </div>
              {info.rules.length > 0 && <div className="muted italic">Rules: {info.rules.join(', ')}</div>}
              <div className="blurb">{info.text}</div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}

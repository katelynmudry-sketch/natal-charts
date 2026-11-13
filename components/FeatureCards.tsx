import type { Chart } from '../lib/astro/chart';
import { MOON_PHASES } from '../lib/astro/moonPhase';
import type { PlanetId } from '../lib/astro/positions';
import { MOON_CONTENT, SECT_CONTENT, byId, isTodo, planetInfo } from '../lib/content';

export interface HerbalAlly {
  text: string;
  link: string;
}

function MoonIcon({ angle }: { angle: number }) {
  const waning = angle > 180;
  const a = waning ? 360 - angle : angle;
  const r = 28;
  const c = Math.cos((a * Math.PI) / 180);
  const rx = Math.abs(c) * r;
  const sweepT = c > 0 ? 0 : 1;
  const d = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${sweepT} 0,${-r} Z`;
  return (
    <svg width="64" height="64" viewBox="-32 -32 64 64" aria-hidden="true">
      <circle r={r} fill="#1b2142" stroke="rgba(212,168,67,0.5)" />
      <path d={d} fill="#e8e0c8" transform={waning ? 'scale(-1,1)' : undefined} />
    </svg>
  );
}

function Blurb({ list, id }: { list: Parameters<typeof byId>[0]; id: string }) {
  const e = byId(list, id);
  if (!e || isTodo(e.text)) return null;
  return (
    <p className="blurb">
      {e.text}
    </p>
  );
}

function Star({ name, planet, v }: { name: string; planet: PlanetId; v: Chart['stars']['mercury'] }) {
  return (
    <li>
      <strong style={{ color: planetInfo(planet).color }}>{name}:</strong> {v.star} star
      {v.underBeams && <span className="tag">under the Sun's beams</span>}
    </li>
  );
}

export default function FeatureCards({ chart, ally }: { chart: Chart; ally: HerbalAlly }) {
  const { sect, chartRuler, dignified, stars, moonPhase, timeKnown } = chart;
  const phaseIdx = MOON_PHASES.indexOf(moonPhase.phase);

  return (
    <div className="cards">
      <section className="card">
        <h3>Day or night chart</h3>
        {sect ? (
          <>
            <p className="big">{sect.isDay ? 'Day chart' : 'Night chart'}</p>
            {sect.nearHorizon && <p className="muted">You were born right around {sect.isDay ? 'sunset' : 'sunrise'}.</p>}
            <ul>
              <li>Ally planet: <strong style={{ color: planetInfo(sect.allyPlanet).color }}>{planetInfo(sect.allyPlanet).title}</strong></li>
              <li>Teacher planet: <strong style={{ color: planetInfo(sect.teacherPlanet).color }}>{planetInfo(sect.teacherPlanet).title}</strong></li>
            </ul>
            <Blurb list={SECT_CONTENT} id={sect.isDay ? 'day' : 'night'} />
          </>
        ) : (
          <p className="muted">Day or night chart needs a birth time.</p>
        )}
      </section>

      {chartRuler && (
        <section className="card">
          <h3>Ascendant ruler</h3>
          <p className="big" style={{ color: planetInfo(chartRuler.planet).color }}>{planetInfo(chartRuler.planet).title}</p>
          <p>In {chartRuler.sign}, house {chartRuler.house}.</p>
          <Blurb list={SECT_CONTENT} id="chart-ruler" />
        </section>
      )}

      <section className="card">
        <h3>Most dignified planet</h3>
        <p className="big" style={{ color: planetInfo(dignified.planet).color }}>{planetInfo(dignified.planet).title}</p>
        <p>In {dignified.sign}{dignified.house ? `, house ${dignified.house}` : ''}.</p>
        {dignified.alsoTied.length > 0 && (
          <p className="muted">Tied with {dignified.alsoTied.map((id) => planetInfo(id).title).join(', ')}.</p>
        )}
        {dignified.score <= 0 && (
          <p className="muted">No planet holds a positive essential dignity, so none stands out.</p>
        )}
      </section>

      <section className="card">
        <h3>Morning or evening star</h3>
        <ul>
          <Star name="Mercury" planet="mercury" v={stars.mercury} />
          <Star name="Venus" planet="venus" v={stars.venus} />
        </ul>
        <Blurb list={SECT_CONTENT} id={`${stars.venus.star}-star`} />
      </section>

      <section className="card">
        <h3>Birth moon phase</h3>
        <div className="moon-row">
          <MoonIcon angle={moonPhase.angle} />
          <div>
            <p className="big">{moonPhase.phase}</p>
            <p className="muted">Phase {phaseIdx + 1} of 8</p>
          </div>
        </div>
        <Blurb list={MOON_CONTENT} id={moonPhase.phase} />
      </section>

      {ally.text.trim() && (
        <section className="card">
          <h3>Herbal ally</h3>
          <p className="big">
            {ally.link.trim() ? <a href={ally.link} target="_blank" rel="noreferrer">{ally.text}</a> : ally.text}
          </p>
        </section>
      )}

      {!timeKnown && (
        <section className="card wide">
          <h3>Birth time unknown</h3>
          <p>
            Your chart is calculated for noon, so it shows planet signs only.
            {chart.moonSigns.length > 1 && <> Your Moon changed signs that day, so it could be in {chart.moonSigns.join(' or ')}.</>}
          </p>
          <p className="muted">Know your birth time later? Ask us to update your chart.</p>
        </section>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { Chart } from '../lib/astro/chart';
import { ALL_PLANETS, MODERN_PLANETS, type PlanetId } from '../lib/astro/positions';
import { findAspects } from '../lib/astro/aspects';
import { SIGNS, signIndex } from '../lib/astro/util';
import { HOUSE_CONTENT, PLANET_CONTENT, SIGN_CONTENT, planetInfo } from '../lib/content';

const CX = 400;
const CY = 400;
const WEB_R = 90;
const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Angle 0 = Rising sign's start, on the left. Houses run counter-clockwise, like the Solarium chart app. */
function pointAt(totalDegrees: number, radius: number) {
  const a = toRadians(180 - totalDegrees);
  return { x: CX + Math.cos(a) * radius, y: CY + Math.sin(a) * radius };
}

export default function ChartLayout({ chart }: { chart: Chart }) {
  const [showAspects, setShowAspects] = useState(false);
  const known = chart.timeKnown;
  const ascIdx = chart.rising ? signIndex(chart.rising.lon) : 0;

  /** Position inside the wheel: house number (0 to 11) times 30, plus degrees in sign. */
  const placed = useMemo(() => {
    const rows = ALL_PLANETS.map((id) => {
      const p = chart.planets[id];
      const houseIdx = known ? (p.house as number) - 1 : signIndex(p.lon);
      return { id, total: houseIdx * 30 + p.degree, retrograde: p.retrograde };
    }).sort((a, b) => a.total - b.total);

    // All glyphs sit on ONE ring between the aspect wheel and the zodiac band. Crowded planets
    // fan out sideways just enough not to overlap; the connector line links each glyph back to its
    // exact-degree dot on the inner aspect wheel.
    const RING = 138;
    const glyphR = (id: PlanetId) => ((MODERN_PLANETS as readonly string[]).includes(id) ? 12 : 16);
    const gapBetween = (a: PlanetId, b: PlanetId) =>
      (2 * Math.asin((glyphR(a) + glyphR(b) + 3) / 2 / RING) * 180) / Math.PI;
    const n = rows.length;
    const angles = rows.map((r) => r.total);
    for (let iter = 0; iter < 500; iter++) {
      let moved = false;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const wrap = j === 0 ? 360 : 0;
        const need = gapBetween(rows[i].id, rows[j].id);
        const have = angles[j] + wrap - angles[i];
        if (have < need - 0.01) {
          const push = (need - have) / 2;
          angles[i] -= push;
          angles[j] += push;
          moved = true;
        }
      }
      if (!moved) break;
    }
    return rows.map((r, i) => {
      const p = pointAt(angles[i], RING);
      return { ...r, angle: angles[i], radius: RING, x: p.x, y: p.y };
    });
  }, [chart, known]);

  const aspects = useMemo(
    () => (showAspects ? findAspects(Object.fromEntries(ALL_PLANETS.map((id) => [id, chart.planets[id].lon]))) : []),
    [showAspects, chart],
  );

  const rulerColor = (sign: string) => PLANET_CONTENT.find((p) => p.rules.includes(sign))?.color ?? '#ffffff';
  const byIdPlaced = Object.fromEntries(placed.map((p) => [p.id, p])) as Record<PlanetId, (typeof placed)[number]>;

  return (
    <div className="chart-wrap">
      <svg viewBox="-95 -5 990 820" role="img" aria-label="Natal chart wheel" className="chart-svg">
        <circle cx={CX} cy={CY} r="265" fill="var(--wheel-outer)" stroke="var(--gold-line)" strokeWidth="2" />

        {Array.from({ length: 12 }).map((_, i) => {
          const sign = SIGNS[(ascIdx + i) % 12];
          const keyword = SIGN_CONTENT.find((s) => s.id === sign)?.keyword ?? '';
          const a = toRadians(180 - i * 30);
          const mid = toRadians(180 - (i * 30 + 15));
          const c = rulerColor(sign);
          return (
            <g key={i}>
              <line
                x1={CX + Math.cos(a) * 175} y1={CY + Math.sin(a) * 175}
                x2={CX + Math.cos(a) * 265} y2={CY + Math.sin(a) * 265}
                stroke={c} strokeWidth={i === 0 && known ? 3 : 1} strokeOpacity={i === 0 && known ? 0.8 : 0.3}
              />
              <text x={CX + Math.cos(mid) * 230} y={CY + Math.sin(mid) * 230 - 10} textAnchor="middle" dominantBaseline="middle"
                fill="var(--ink)" fontSize="15" fontWeight="700" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{sign}</text>
              <text x={CX + Math.cos(mid) * 230} y={CY + Math.sin(mid) * 230 + 11} textAnchor="middle" dominantBaseline="middle"
                fill="var(--gold)" fontSize="11" fontWeight="500" style={{ fontStyle: 'italic', opacity: 0.9 }}>{keyword}</text>
              {known && (
                <text x={CX + Math.cos(mid) * 192} y={CY + Math.sin(mid) * 192} textAnchor="middle" dominantBaseline="middle"
                  fill="var(--gold)" fontSize="17" fontWeight="700" opacity="0.9">{i + 1}</text>
              )}
            </g>
          );
        })}

        <circle cx={CX} cy={CY} r="175" fill="var(--wheel-inner)" stroke="var(--gold-line)" strokeWidth="2" />
        {/* Aspect web: a small inner circle where each planet's exact degree is a dot. */}
        <circle cx={CX} cy={CY} r={WEB_R} fill="var(--wheel-web)" stroke="var(--gold-line)" strokeWidth="1" />
        {!showAspects && (
          <>
            <text x={CX} y="397" textAnchor="middle" dominantBaseline="middle" fill="var(--gold)" fontSize="13" fontWeight="700" style={{ letterSpacing: '3px' }}>SOLARIUM</text>
            <text x={CX} y="413" textAnchor="middle" dominantBaseline="middle" fill="var(--gold-soft)" fontSize="7" style={{ letterSpacing: '2px' }}>· HERBS &amp; ASTROLOGY ·</text>
          </>
        )}

        {/* Ticks on the rim mark each planet's true degree. */}
        {placed.map((p) => {
          const a = pointAt(p.total, 175);
          const b = pointAt(p.total, 166);
          return <line key={`tick-${p.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={planetInfo(p.id).color} strokeWidth="2.5" />;
        })}

        {aspects.map((asp, i) => {
          const p1 = pointAt(byIdPlaced[asp.planet1].total, WEB_R);
          const p2 = pointAt(byIdPlaced[asp.planet2].total, WEB_R);
          return (
            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--gold)" strokeWidth="1.5"
              strokeDasharray={asp.dotted ? '4,4' : undefined} opacity="0.7" />
          );
        })}

        {placed.map((p) => {
          const info = planetInfo(p.id);
          const outer = (MODERN_PLANETS as readonly string[]).includes(p.id);
          const pos = { x: p.x, y: p.y };
          const dot = pointAt(p.total, WEB_R);
          const r = outer ? 12 : 16;
          const rim = pointAt(p.total, 166);
          return (
            <g key={p.id}>
              <line x1={rim.x} y1={rim.y} x2={pos.x} y2={pos.y} stroke={info.color} strokeWidth="1.5" opacity="0.8" />
              <line x1={dot.x} y1={dot.y} x2={pos.x} y2={pos.y} stroke={info.color} strokeWidth="1" opacity="0.6" />
              <circle cx={dot.x} cy={dot.y} r="3.5" fill={info.color} stroke="var(--glyph-stroke)" strokeWidth="1" />
              <circle cx={pos.x} cy={pos.y} r={outer ? 15 : 20} fill={info.color} opacity="0.2" style={{ filter: 'blur(8px)' }} />
              <circle cx={pos.x} cy={pos.y} r={r} fill={info.color} stroke="var(--glyph-stroke)" strokeWidth="2" />
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                fill={p.id === 'pluto' ? '#fff' : '#0a0e27'} fontSize={outer ? 13 : 18} fontWeight="700"
                style={{ pointerEvents: 'none' }}>{info.symbol}</text>
              {p.retrograde && (
                <text x={pos.x + r + 3} y={pos.y + r} fill="var(--ink)" fontSize="11" fontWeight="700">℞</text>
              )}
              <title>{`${info.title}${p.retrograde ? ' (retrograde)' : ''}`}</title>
            </g>
          );
        })}

        {known && (
          <g>
            <line x1={CX - 265} y1={CY} x2={CX - 282} y2={CY} stroke="var(--gold)" strokeWidth="3" opacity="0.9" />
            <text x={CX - 297} y={CY} textAnchor="middle" dominantBaseline="middle" fill="var(--gold)" fontSize="15" fontWeight="700">ASC</text>
          </g>
        )}

        {Array.from({ length: 12 }).map((_, i) => {
          const a = toRadians(180 - (i * 30 + 15));
          const side = Math.cos(a);
          const anchor = side > 0.35 ? 'start' : side < -0.35 ? 'end' : 'middle';
          const R = anchor === 'middle' ? 315 : 292;
          const x = CX + Math.cos(a) * R;
          const y = CY + Math.sin(a) * R;
          const words = HOUSE_CONTENT[i].text.split(', ');
          return (
            <g key={`sig-${i}`}>
              {words.map((w, wi) => (
                <text key={wi} x={x} y={y + (wi - words.length / 2 + 0.5) * 17} textAnchor={anchor}
                  dominantBaseline="middle" fill="var(--ink)" fontSize="15" fontWeight="600">{w}</text>
              ))}
            </g>
          );
        })}
      </svg>

      <button type="button" className="toggle no-print" onClick={() => setShowAspects((s) => !s)} aria-pressed={showAspects}>
        {showAspects ? 'Hide aspects' : 'Show aspects'}
      </button>

      {showAspects && (
        <div className="aspect-list">
          {aspects.length === 0 && <p className="muted">No aspects within orb.</p>}
          {aspects.map((a, i) => (
            <span key={i} className="aspect-chip">
              <span style={{ color: planetInfo(a.planet1).color }}>{planetInfo(a.planet1).symbol}</span>
              <span className="muted"> {a.type} </span>
              <span style={{ color: planetInfo(a.planet2).color }}>{planetInfo(a.planet2).symbol}</span>
            </span>
          ))}
        </div>
      )}
      {!known && (
        <p className="muted center">Birth time unknown, so the wheel starts at 0° Aries and houses are hidden.</p>
      )}
    </div>
  );
}

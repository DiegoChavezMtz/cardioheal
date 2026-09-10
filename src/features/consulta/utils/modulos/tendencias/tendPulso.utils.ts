import type { Expediente } from '@/types/expediente';
import { ejeMeses, marcoTend, mesesDelRango } from './marco.utils';

/** Portado de tendPulso(): media y rango mensual del pulso matutino en casa. */
export function tendPulso(D: Expediente): string {
  const meses = mesesDelRango(D);
  const g = marcoTend(140);
  const iw = g.W - g.l - g.r;
  const ih = g.H - g.t - g.b - 16;
  const by: Record<string, number[]> = {};
  D.presion.filter((r) => r.src === 'casa' && r.p && r.m === 'mañana').forEach((r) => { (by[r.f.slice(0, 7)] ??= []).push(r.p as number); });
  const todos = Object.values(by).flat();
  if (!todos.length) return '';

  const lo = Math.min(...todos) - 4;
  const hi = Math.max(...todos) + 4;
  const Y = (v: number) => g.t + ih * (1 - (v - lo) / (hi - lo));

  let s = `<rect x="${g.l}" y="${g.t}" width="${iw}" height="${ih}" fill="var(--sunk)"/>`;
  [60, 80, 100].forEach((v) => {
    if (v < lo || v > hi) return;
    const y = Y(v);
    s += `<line x1="${g.l}" y1="${y.toFixed(1)}" x2="${g.l + iw}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width=".6"/>` +
      `<text x="${g.l - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v}</text>`;
  });

  const bw = iw / meses.length;
  const pts: Array<[number, number, number, string]> = [];
  meses.forEach((k, i) => {
    const v = by[k];
    if (!v || v.length < 3) return;
    const x = g.l + (i + 0.5) * bw;
    const mn = Math.min(...v);
    const mx = Math.max(...v);
    const me = v.reduce((a, b) => a + b, 0) / v.length;
    s += `<line x1="${x.toFixed(1)}" y1="${Y(mn).toFixed(1)}" x2="${x.toFixed(1)}" y2="${Y(mx).toFixed(1)}" stroke="var(--blue-deep)" stroke-width="7" opacity=".65" stroke-linecap="round"/>`;
    pts.push([x, Y(me), Math.round(me), k]);
  });
  if (pts.length > 1) {
    s += `<polyline points="${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="1.8" stroke-linejoin="round"/>`;
  }
  pts.forEach((p) => {
    s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--blue-2)" stroke="var(--sunk)" stroke-width="1.2"/>` +
      `<text x="${p[0].toFixed(1)}" y="${(p[1] - 8).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="var(--ink-2)" font-family="IBM Plex Mono,monospace">${p[2]}</text>`;
  });

  return s + ejeMeses(g, meses);
}

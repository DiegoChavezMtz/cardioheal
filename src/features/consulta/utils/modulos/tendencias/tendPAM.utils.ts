import type { Expediente } from '@/types/expediente';
import { ejeMeses, marcoTend, mesesDelRango } from './marco.utils';

const PAM_UMBRAL = 65;

/** Portado de tendPAM(): % de tomas caseras bajo PAM 65, mes a mes. */
export function tendPAM(D: Expediente): string {
  const meses = mesesDelRango(D);
  const g = marcoTend(150);
  const iw = g.W - g.l - g.r;
  const ih = g.H - g.t - g.b - 16;
  const by: Record<string, number[]> = {};
  D.presion.filter((r) => r.src === 'casa' && r.a).forEach((r) => { (by[r.f.slice(0, 7)] ??= []).push(r.a); });
  const bw = iw / meses.length;

  let s = `<rect x="${g.l}" y="${g.t}" width="${iw}" height="${ih}" fill="var(--sunk)"/>`;
  [0, 25, 50, 75, 100].forEach((v) => {
    const y = g.t + ih * (1 - v / 100);
    s += `<line x1="${g.l}" y1="${y.toFixed(1)}" x2="${g.l + iw}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width=".6"/>` +
      `<text x="${g.l - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v}%</text>`;
  });

  meses.forEach((k, i) => {
    const v = by[k];
    const x = g.l + i * bw;
    if (!v || v.length < 5) {
      s += `<rect x="${(x + bw * 0.18).toFixed(1)}" y="${g.t}" width="${(bw * 0.64).toFixed(1)}" height="${ih}" fill="url(#nodata)" opacity=".5"/>`;
      return;
    }
    const pct = (100 * v.filter((z) => z < PAM_UMBRAL).length) / v.length;
    const h = (ih * pct) / 100;
    s += `<rect x="${(x + bw * 0.18).toFixed(1)}" y="${(g.t + ih - h).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" fill="${pct >= 40 ? 'var(--red)' : pct >= 15 ? 'var(--amber)' : 'var(--ok)'}" opacity=".85" rx="2"/>` +
      `<text x="${(x + bw * 0.5).toFixed(1)}" y="${(g.t + ih - h - 4).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="var(--ink-2)" font-family="IBM Plex Mono,monospace">${Math.round(pct)}</text>`;
  });

  const C = D.consulta_cardio;
  if (C?.f) {
    const i = meses.indexOf(C.f.slice(0, 7));
    if (i >= 0) {
      const x = g.l + (i + 0.5) * bw;
      s += `<line x1="${x.toFixed(1)}" y1="${g.t}" x2="${x.toFixed(1)}" y2="${g.t + ih}" stroke="var(--amber)" stroke-width="1.4" stroke-dasharray="3 3"/>`;
    }
  }

  s += '<defs><pattern id="nodata" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--line)" stroke-width="2"/></pattern></defs>';
  return s + ejeMeses(g, meses);
}

import type { Expediente } from '@/types/expediente';
import { day } from '@/utils/expediente.utils';
import { ejeMeses, marcoTend, mesesDelRango, rangoFechas } from './marco.utils';

/** Portado de tendIndice(): series indexadas a 100 en su primer valor, para comparar forma. */
export function tendIndice(D: Expediente, nombres: string[], colores: string[]): string {
  const meses = mesesDelRango(D);
  const g = marcoTend(150);
  g.r = 152;
  const iw = g.W - g.l - g.r;
  const ih = g.H - g.t - g.b - 16;
  const { T_MIN, T_MAX } = rangoFechas(D);

  const series = nombres
    .map((n) => {
      const S = D.labs[n];
      if (!S || S.puntos.length < 3) return null;
      const base = S.puntos[0].v || 1;
      return { n, pts: S.puntos.map((p) => ({ f: p.f, v: (100 * p.v) / base })) };
    })
    .filter((s): s is { n: string; pts: { f: string; v: number }[] } => s !== null);
  if (!series.length) return '';

  const vals = series.flatMap((s) => s.pts.map((p) => p.v));
  const lo = Math.min(60, Math.min(...vals));
  const hi = Math.max(140, Math.max(...vals));
  const Y = (v: number) => g.t + ih * (1 - (v - lo) / (hi - lo));
  const X = (f: string) => g.l + ((day(f) - T_MIN) / (T_MAX - T_MIN)) * iw;

  let s = `<rect x="${g.l}" y="${g.t}" width="${iw}" height="${ih}" fill="var(--sunk)"/>`;
  [50, 100, 150, 200].forEach((v) => {
    if (v < lo || v > hi) return;
    const y = Y(v);
    s += `<line x1="${g.l}" y1="${y.toFixed(1)}" x2="${g.l + iw}" y2="${y.toFixed(1)}" stroke="${v === 100 ? 'var(--ink-2)' : 'var(--line)'}" stroke-width="${v === 100 ? '.9' : '.6'}" opacity="${v === 100 ? '.5' : '1'}"/>` +
      `<text x="${g.l - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v}</text>`;
  });

  const usados: number[] = [];
  series.forEach((se, i) => {
    const col = colores[i % colores.length];
    s += `<polyline points="${se.pts.map((p) => `${X(p.f).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>`;
    se.pts.forEach((p) => { s += `<circle cx="${X(p.f).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2" fill="${col}"/>`; });
    const u = se.pts[se.pts.length - 1];
    let y = Y(u.v);
    while (usados.some((v) => Math.abs(v - y) < 13)) y += 13;
    usados.push(y);
    s += `<text x="${(X(u.f) + 7).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" font-size="11" font-weight="700" fill="${col}" font-family="Nunito,sans-serif">${se.n}</text>`;
  });

  return s + ejeMeses(g, meses);
}

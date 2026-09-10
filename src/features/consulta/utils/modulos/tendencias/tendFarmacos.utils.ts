import type { Expediente } from '@/types/expediente';
import { day } from '@/utils/expediente.utils';
import { ejeMeses, marcoTend, mesesDelRango, rangoFechas } from './marco.utils';

/** Portado de tendFarmacos(): conteo de fármacos con intervalo abierto a mitad de cada mes. */
export function tendFarmacos(D: Expediente): string {
  const meses = mesesDelRango(D);
  const g = marcoTend(130);
  const iw = g.W - g.l - g.r;
  const ih = g.H - g.t - g.b - 16;
  const { T_MAX } = rangoFechas(D);

  const conteo = meses.map((k) => {
    const t = day(`${k}-15`);
    return D.meds.filter((m) => day(m.inicio) <= t && (m.fin ? day(m.fin) >= t : t <= T_MAX)).length;
  });
  const hi = Math.max(...conteo) + 1;
  const Y = (v: number) => g.t + ih * (1 - v / hi);
  const bw = iw / meses.length;

  let s = `<rect x="${g.l}" y="${g.t}" width="${iw}" height="${ih}" fill="var(--sunk)"/>`;
  [0, 5, 10, 15].forEach((v) => {
    if (v > hi) return;
    const y = Y(v);
    s += `<line x1="${g.l}" y1="${y.toFixed(1)}" x2="${g.l + iw}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width=".6"/>` +
      `<text x="${g.l - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${v}</text>`;
  });

  conteo.forEach((c, i) => {
    const x = g.l + i * bw;
    const h = ih - Y(c) + g.t;
    s += `<rect x="${(x + bw * 0.16).toFixed(1)}" y="${Y(c).toFixed(1)}" width="${(bw * 0.68).toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" fill="var(--blue)" opacity=".55" rx="2"/>` +
      `<text x="${(x + bw * 0.5).toFixed(1)}" y="${(Y(c) - 4).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="var(--ink-2)" font-family="IBM Plex Mono,monospace">${c}</text>`;
  });

  return s + ejeMeses(g, meses);
}

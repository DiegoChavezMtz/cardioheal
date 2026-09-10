import type { Expediente } from '@/types/expediente';
import { day, fmtS, MES, MS } from '@/utils/expediente.utils';
import { MARGEN, W, X, type Dominio } from './rango.utils';

/**
 * Portado de drawAxis(): un mes centrado por tramo, con el año cuando
 * cambia; los extremos del periodo se recogen hacia adentro para no
 * quedar cortados contra el borde.
 */
export function generarEje(D: Expediente, dom: Dominio): string {
  let s = '';
  const meses = (dom[1] - dom[0]) / MS / 30.44;
  const paso = meses > 26 ? 3 : meses > 15 ? 2 : 1;
  const d = new Date(dom[0]);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  if (d.getTime() < dom[0]) d.setUTCMonth(d.getUTCMonth() + 1);

  let i = 0;
  let anioPrev: number | null = null;
  while (d.getTime() <= dom[1]) {
    const x = X(dom, d.getTime());
    if (x >= -1 && x <= W + 1 && i % paso === 0) {
      const fin = new Date(d);
      fin.setUTCMonth(fin.getUTCMonth() + paso);
      const xc = Math.min(W, Math.max(0, (x + Math.min(W, X(dom, fin.getTime()))) / 2));
      const anio = d.getUTCFullYear();
      const poneAnio = anio !== anioPrev;
      anioPrev = anio;
      s += `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="6" stroke="var(--line)"/>`;
      s += `<text x="${xc.toFixed(1)}" y="17" text-anchor="middle" font-size="11.5" font-weight="700" fill="${poneAnio ? 'var(--ink)' : 'var(--ink-2)'}" font-family="Nunito,sans-serif">${MES[d.getUTCMonth()]}${poneAnio ? ` ${anio}` : ''}</text>`;
    }
    d.setUTCMonth(d.getUTCMonth() + paso);
    i += paso;
  }

  const a = fmtS(new Date(dom[0] + MARGEN).toISOString().slice(0, 10));
  const b = fmtS(new Date(dom[1] - MARGEN).toISOString().slice(0, 10));
  s += `<text x="3" y="30" text-anchor="start" font-size="10" fill="var(--blue-2)" font-family="IBM Plex Mono,monospace">${a}</text>`;
  s += `<text x="${W - 3}" y="30" text-anchor="end" font-size="10" fill="var(--blue-2)" font-family="IBM Plex Mono,monospace">${b}</text>`;

  const C = D.consulta_cardio;
  if (C?.f) {
    const xc = X(dom, day(C.f));
    if (xc >= 0 && xc <= W) s += `<line x1="${xc.toFixed(1)}" y1="0" x2="${xc.toFixed(1)}" y2="9" stroke="var(--amber)" stroke-width="2"/>`;
  }
  return s;
}

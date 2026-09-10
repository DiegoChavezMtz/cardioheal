import type { Expediente } from '@/types/expediente';
import { day, nf, refOf, serie, U } from '@/utils/expediente.utils';
import { W, X, type Dominio } from '../rango.utils';

export const ALTO_GENERICA = 58;

/** Portado de rowGeneric(): serie de un marcador cualquiera, con su banda de referencia. */
export function filaGenerica(D: Expediente, nombre: string, color: string, dom: Dominio): string | null {
  const S = serie(D, nombre);
  if (!S.length) return null;
  const h = ALTO_GENERICA;
  const pt = 11;
  const pb = 10;
  const ih = h - pt - pb;
  const r = refOf(D, nombre);
  const vs = S.map((p) => p.v);
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  const span = hi - lo || Math.abs(hi) * 0.2 || 1;
  if (r) {
    if (r[0] > lo - span * 0.6) lo = Math.min(lo, r[0]);
    if (r[1] < hi + span * 0.6) hi = Math.max(hi, r[1]);
  }
  const pad = (hi - lo || 1) * 0.14;
  lo -= pad;
  hi += pad;
  const Y = (v: number) => pt + ih * (1 - (v - lo) / (hi - lo));

  let s = '';
  if (r) {
    const y1 = Math.max(Math.min(Y(r[1]), pt + ih), pt);
    const y2 = Math.max(Math.min(Y(r[0]), pt + ih), pt);
    if (y2 - y1 > 0.6) s += `<rect x="0" y="${y1.toFixed(1)}" width="${W}" height="${(y2 - y1).toFixed(1)}" fill="rgba(59,142,245,.07)"/>`;
  }
  const pts = S.map((p) => [X(dom, day(p.f)), Y(p.v), p.v] as [number, number, number]).filter((p) => p[0] >= -80 && p[0] <= W + 80);
  if (pts.length > 1) {
    s += `<polyline points="${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  const dense = pts.length > 60;
  pts.forEach((p) => {
    const out = !!r && (p[2] < r[0] || p[2] > r[1]);
    s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${dense ? 1.4 : out ? 2.9 : 2.1}" fill="${out ? 'var(--red)' : color}"${dense ? '' : ' stroke="var(--surface)" stroke-width="1.1"'}/>`;
  });

  return `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${s}</svg>`;
}

export function unidadFila(D: Expediente, nombre: string): string {
  const r = refOf(D, nombre);
  return ((r ? `ref ${nf(r[0])}–${nf(r[1])} ` : '') + U(nombre)).trim() || '—';
}

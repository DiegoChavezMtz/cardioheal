import type { Expediente } from '@/types/expediente';
import { day, fmtD, fmtS, MES, MS, nf, refOf, serie, tramos, U } from './expediente.utils';

// Portado de AGREGADA en app/consola.html original: series donde cada punto
// ya es un promedio del día, no una toma individual.
export const AGREGADA: Record<string, string> = {
  PAM: 'cada punto es el promedio de TODAS las tomas de ese día',
  'Presión arterial': 'cada punto es el promedio de las tomas matutinas de ese día',
  'Pulso en reposo': 'cada punto es el promedio de las tomas matutinas de ese día',
};

const DW = 1000;
const DH = 340;
const DP = { l: 66, r: 22, t: 20, b: 38 };

/** Portado de ticksNice(): valores "redondos" para las líneas de referencia del eje Y. */
function ticksNice(lo: number, hi: number, n: number): number[] {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

export type PuntoDetalle = { x: number; y: number; valor: number; fecha: string; fuera: boolean };
export type FilaDetalle = { fecha: string; fechaCorta: string; valor: string; estado: string; fuera: boolean; fuente: string };
export type EstadisticaDetalle = { etiqueta: string; valor: string; malo: boolean };

export type DetalleGrafica = {
  nombre: string;
  svgFondo: string;
  puntos: PuntoDetalle[];
  unidadTexto: string;
  stats: EstadisticaDetalle[];
  filas: FilaDetalle[];
  totalFilas: number;
  agregadaTexto: string | null;
  tieneCorte: boolean;
};

/** Portado de abrirDetalle(): arma todo lo que necesita el modal para un marcador. */
export function calcularDetalle(D: Expediente, nombre: string): DetalleGrafica | null {
  const S = serie(D, nombre);
  if (!S.length) return null;

  const r = refOf(D, nombre);
  const vs = S.map((p) => p.v);
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (r) {
    const sp = hi - lo || Math.abs(hi) * 0.2 || 1;
    if (r[0] > lo - sp * 0.8) lo = Math.min(lo, r[0]);
    if (r[1] < hi + sp * 0.8) hi = Math.max(hi, r[1]);
  }
  const pad = (hi - lo || Math.abs(hi) * 0.2 || 1) * 0.12;
  lo -= pad;
  hi += pad;

  const t0 = day(S[0].f);
  const t1 = day(S[S.length - 1].f);
  const span = t1 - t0 || MS * 30;
  const iw = DW - DP.l - DP.r;
  const ih = DH - DP.t - DP.b;
  const X2 = (t: number) => DP.l + ((t - t0) / span) * iw;
  const Y2 = (v: number) => DP.t + ih * (1 - (v - lo) / (hi - lo));

  let g = `<rect x="${DP.l}" y="${DP.t}" width="${iw}" height="${ih}" fill="var(--sunk)"/>`;
  if (r) {
    const y1 = Math.max(Math.min(Y2(r[1]), DP.t + ih), DP.t);
    const y2 = Math.max(Math.min(Y2(r[0]), DP.t + ih), DP.t);
    if (y2 - y1 > 0.5) {
      g += `<rect x="${DP.l}" y="${y1.toFixed(1)}" width="${iw}" height="${(y2 - y1).toFixed(1)}" fill="rgba(51,189,163,.10)"/>` +
        `<text x="${DP.l + iw - 4}" y="${(y1 + 13).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--ok)" font-family="Nunito,sans-serif">rango de referencia ${nf(r[0])}–${nf(r[1])}</text>`;
    } else {
      const arriba = r[0] > hi;
      const yl = arriba ? DP.t + 3 : DP.t + ih - 3;
      g += `<line x1="${DP.l}" y1="${yl}" x2="${DP.l + iw}" y2="${yl}" stroke="var(--ok)" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>` +
        `<text x="${DP.l + iw - 4}" y="${arriba ? DP.t + 16 : DP.t + ih - 8}" text-anchor="end" font-size="11" fill="var(--ok)" font-family="Nunito,sans-serif">rango de referencia ${nf(r[0])}–${nf(r[1])} · fuera de escala ${arriba ? '↑' : '↓'}</text>`;
    }
  }
  ticksNice(lo, hi, 5).forEach((v) => {
    const y = Y2(v);
    if (y < DP.t - 1 || y > DP.t + ih + 1) return;
    g += `<line x1="${DP.l}" y1="${y.toFixed(1)}" x2="${DP.l + iw}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width=".7"/>` +
      `<text x="${DP.l - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${nf(v)}</text>`;
  });

  const d = new Date(t0);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const meses = span / MS / 30;
  const paso = meses > 15 ? 3 : meses > 7 ? 2 : 1;
  let i = 0;
  while (d.getTime() <= t1) {
    const x = X2(d.getTime());
    if (x >= DP.l && x <= DP.l + iw && i % paso === 0) {
      g += `<line x1="${x.toFixed(1)}" y1="${DP.t + ih}" x2="${x.toFixed(1)}" y2="${DP.t + ih + 5}" stroke="var(--line)"/>` +
        `<text x="${x.toFixed(1)}" y="${DP.t + ih + 20}" text-anchor="middle" font-size="11.5" fill="var(--muted)" font-family="Nunito,sans-serif">${MES[d.getUTCMonth()]}${d.getUTCMonth() === 0 ? ` ${String(d.getUTCFullYear()).slice(2)}` : ''}</text>`;
    }
    d.setUTCMonth(d.getUTCMonth() + 1);
    i++;
  }
  g += `<text x="${DP.l}" y="${DP.t + ih + 20}" text-anchor="start" font-size="11.5" fill="var(--ink-2)" font-family="Nunito,sans-serif">${fmtS(S[0].f)}</text>`;
  g += `<text x="${DP.l + iw}" y="${DP.t + ih + 20}" text-anchor="end" font-size="11.5" fill="var(--ink-2)" font-family="Nunito,sans-serif">${fmtS(S[S.length - 1].f)}</text>`;

  const puntos: PuntoDetalle[] = S.map((p) => ({
    x: X2(day(p.f)), y: Y2(p.v), valor: p.v, fecha: p.f, fuera: !!r && (p.v < r[0] || p.v > r[1]),
  }));
  const tramosSerie = tramos(S);
  tramosSerie.forEach((t) => {
    if (t.length < 2) return;
    const q = t.map((p) => [X2(day(p.f)), Y2(p.v)] as [number, number]);
    g += `<polyline points="${q.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  const pocos = puntos.length <= 26;
  puntos.forEach((p, idx) => {
    g += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${pocos ? 4 : 2}" fill="${p.fuera ? 'var(--red)' : 'var(--blue-2)'}" stroke="var(--surface)" stroke-width="${pocos ? 1.6 : 0.8}"/>`;
    if (pocos) {
      const arriba = idx === 0 || p.y <= puntos[Math.max(0, idx - 1)].y;
      g += `<text x="${p.x.toFixed(1)}" y="${(p.y + (arriba ? -11 : 18)).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${p.fuera ? 'var(--red)' : 'var(--ink)'}" font-family="IBM Plex Mono,monospace">${nf(p.valor)}</text>`;
    }
  });

  const fuera = r ? S.filter((p) => p.v < r[0] || p.v > r[1]).length : 0;
  const sorted = vs.slice().sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  const last = S[S.length - 1];
  const lastOut = !!r && (last.v < r[0] || last.v > r[1]);
  const agregada = AGREGADA[nombre] ?? null;

  const stats: EstadisticaDetalle[] = [
    { etiqueta: 'Último', valor: nf(last.v), malo: lastOut },
    { etiqueta: 'Fecha', valor: fmtS(last.f), malo: false },
    { etiqueta: 'Mínimo', valor: nf(Math.min(...vs)), malo: false },
    { etiqueta: 'Máximo', valor: nf(Math.max(...vs)), malo: false },
    { etiqueta: 'Mediana', valor: nf(med), malo: false },
    { etiqueta: agregada ? 'Días' : 'Mediciones', valor: String(S.length), malo: false },
  ];
  if (r) stats.push({ etiqueta: 'Fuera de rango', valor: `${fuera} de ${S.length}`, malo: fuera > 0 });

  const invertida = S.slice().reverse().slice(0, 200);
  const filas: FilaDetalle[] = invertida.map((p) => {
    const fuera2 = !!r && (p.v < r[0] || p.v > r[1]);
    const fuente = (D.labs[nombre] && D.labs[nombre].puntos.find((x) => x.f === p.f)?.src) || '';
    return {
      fecha: p.f, fechaCorta: fmtD(p.f), valor: nf(p.v),
      estado: fuera2 ? (p.v < r![0] ? 'bajo' : 'alto') : 'en rango',
      fuera: fuera2, fuente: String(fuente).split('/').pop() || '',
    };
  });

  const unidadTexto = `${r ? `referencia ${nf(r[0])}–${nf(r[1])} ` : ''}${U(nombre) || ''} · ${S.length}${agregada ? ' días con registro · ' : ' mediciones · '}${fmtD(S[0].f)} a ${fmtD(last.f)}${agregada ? ` · ${agregada}` : ''}`;

  return {
    nombre, svgFondo: g, puntos, unidadTexto, stats, filas,
    totalFilas: S.length, agregadaTexto: agregada, tieneCorte: tramosSerie.length > 1,
  };
}

export const DIMENSIONES_DETALLE = { DW, DH, DP };

import type { Expediente } from '@/types/expediente';
import { day, MES } from '@/utils/expediente.utils';

export type Marco = { W: number; H: number; l: number; r: number; t: number; b: number };
export const marcoTend = (alto: number): Marco => ({ W: 1000, H: alto, l: 44, r: 14, t: 12, b: 20 });

/** Rango fijo del expediente (agosto 2025 en adelante) hasta el dato más reciente. */
export function rangoFechas(D: Expediente) {
  const T_MIN = day('2025-08-01');
  let T_MAX = day(D.hoy);
  D.presion.forEach((r) => { T_MAX = Math.max(T_MAX, day(r.f)); });
  Object.values(D.labs).forEach((L) => L.puntos.forEach((p) => { T_MAX = Math.max(T_MAX, day(p.f)); }));
  D.peso.forEach((r) => { T_MAX = Math.max(T_MAX, day(r.f)); });
  return { T_MIN, T_MAX };
}

export function mesesDelRango(D: Expediente): string[] {
  const { T_MIN, T_MAX } = rangoFechas(D);
  const out: string[] = [];
  const d = new Date(T_MIN);
  d.setUTCDate(1);
  while (d.getTime() <= T_MAX) {
    out.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export const mesCorto = (k: string) => MES[+k.slice(5, 7) - 1] + (k.slice(5, 7) === '01' ? ` ${k.slice(2, 4)}` : '');

/** Ejes de meses al pie de un gráfico de tendencias: devuelve SVG interno. */
export function ejeMeses(g: Marco, meses: string[]): string {
  let s = '';
  meses.forEach((k, i) => {
    const x = g.l + ((i + 0.5) / meses.length) * (g.W - g.l - g.r);
    if (i % 2 === 0 || meses.length < 10) {
      s += `<text x="${x.toFixed(1)}" y="${g.H - 5}" text-anchor="middle" font-size="9.5" fill="var(--muted)" font-family="Nunito,sans-serif">${mesCorto(k)}</text>`;
    }
  });
  return s;
}

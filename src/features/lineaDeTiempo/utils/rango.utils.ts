import type { Expediente } from '@/types/expediente';
import { day, MS } from '@/utils/expediente.utils';

export const W = 1000;
// el periodo deja un margen a cada lado para que ni los datos ni las fechas
// queden pegados al borde.
export const MARGEN = 9 * MS;

export function rangoCompleto(D: Expediente) {
  let T_MAX = day(D.hoy);
  D.presion.forEach((r) => { T_MAX = Math.max(T_MAX, day(r.f)); });
  Object.values(D.labs).forEach((L) => L.puntos.forEach((p) => { T_MAX = Math.max(T_MAX, day(p.f)); }));
  D.peso.forEach((r) => { T_MAX = Math.max(T_MAX, day(r.f)); });
  return { T_MIN: day('2025-08-01'), T_MAX };
}

export type Dominio = [number, number];

/** Portado de rangoDe(): el dominio [a,b] en ms para cada botón de periodo. */
export function rangoDe(D: Expediente, r: 'all' | '12' | '6' | '3'): Dominio {
  const { T_MIN, T_MAX } = rangoCompleto(D);
  if (r === 'all') return [T_MIN - MARGEN, T_MAX + MARGEN];
  return [day(D.hoy) - Number(r) * 30.44 * MS - MARGEN, T_MAX + MARGEN];
}

export const X = (dom: Dominio, t: number) => ((t - dom[0]) / (dom[1] - dom[0])) * W;

/** Todas las fechas con algún dato — para "pegar" el cursor a la más cercana al hacer clic. */
export function fechasCandidatas(D: Expediente): string[] {
  const s = new Set<string>();
  Object.values(D.labs).forEach((S) => S.puntos.forEach((p) => s.add(p.f)));
  D.presion.forEach((r) => s.add(r.f));
  D.peso.forEach((r) => s.add(r.f));
  D.eventos.forEach((e) => s.add(e.fecha));
  return [...s].sort();
}

export function fechaMasCercana(candidatas: string[], t: number): string {
  let best = candidatas[0];
  let bd = Infinity;
  candidatas.forEach((f) => {
    const dd = Math.abs(day(f) - t);
    if (dd < bd) { bd = dd; best = f; }
  });
  return best;
}

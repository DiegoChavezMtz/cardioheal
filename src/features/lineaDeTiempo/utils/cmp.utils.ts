import type { Expediente } from '@/types/expediente';
import { day, fmtS, MS, serie } from '@/utils/expediente.utils';
import type { Dominio } from './rango.utils';

export type FilaCmp = {
  fecha: string;
  cambios: string[];
  celdas: Array<{ sinDato: true } | { sinDato: false; antes: number; despues: number; delta: number; diasAntes: number; diasDespues: number }>;
};

export type ResultadoCmp = { columnas: string[]; filas: FilaCmp[]; multi: boolean };

/**
 * Portado de cmpTable(): qué pasó con cada marcador visible alrededor de
 * cada inicio/suspensión de fármaco, dentro del periodo visible.
 */
export function calcularCmp(D: Expediente, vars: string[], dom: Dominio): ResultadoCmp {
  const porFecha: Record<string, string[]> = {};
  D.meds.forEach((m) => {
    (porFecha[m.inicio] ??= []).push(`inicia ${m.farmaco}`);
    if (m.fin) (porFecha[m.fin] ??= []).push(`suspende ${m.farmaco}`);
  });

  const columnas = vars.filter((n) => n !== 'Presión arterial').slice(0, 4);
  let multi = false;
  const filas: FilaCmp[] = [];

  Object.keys(porFecha).sort().forEach((f) => {
    const t = day(f);
    if (t < dom[0] || t > dom[1]) return;
    const cambios = porFecha[f];
    if (cambios.length > 1) multi = true;
    const celdas = columnas.map((c): FilaCmp['celdas'][number] => {
      const S = serie(D, c);
      const before = S.filter((x) => day(x.f) <= t).pop();
      const after = S.find((x) => day(x.f) > t);
      if (!before || !after) return { sinDato: true };
      return {
        sinDato: false,
        antes: before.v,
        despues: after.v,
        delta: after.v - before.v,
        diasAntes: Math.round((t - day(before.f)) / MS),
        diasDespues: Math.round((day(after.f) - t) / MS),
      };
    });
    filas.push({ fecha: fmtS(f), cambios, celdas });
  });

  return { columnas, filas, multi };
}

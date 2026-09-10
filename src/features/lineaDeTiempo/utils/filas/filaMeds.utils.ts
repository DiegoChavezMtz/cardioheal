import type { Expediente } from '@/types/expediente';
import { day } from '@/utils/expediente.utils';
import { rangoCompleto, W, X, type Dominio } from '../rango.utils';

export type ResultadoFilaMeds = { svg: string; alto: number; grupos: string[] };

/** Portado de rowMeds(): una franja por grupo terapéutico, con el color según confianza del dato. */
export function filaMeds(D: Expediente, dom: Dominio, estrecho: boolean): ResultadoFilaMeds {
  const { T_MAX } = rangoCompleto(D);
  const grupos = [...new Set(D.meds.map((m) => m.grupo))];
  const lane = 15;
  const top = estrecho ? 4 : 46;
  const alto = top + grupos.length * lane + 6;

  let s = '';
  D.meds.forEach((m) => {
    const gi = grupos.indexOf(m.grupo);
    const a = day(m.inicio);
    const b = m.fin ? day(m.fin) : T_MAX;
    let x1 = X(dom, a);
    let x2 = X(dom, b);
    if (x2 < 0 || x1 > W) return;
    x1 = Math.max(x1, 0);
    x2 = Math.min(x2, W);
    const col = m.confianza === 'documentado' ? 'var(--blue)' : /conflicto/.test(m.confianza) ? 'var(--red)' : 'var(--amber)';
    s += `<rect x="${x1.toFixed(1)}" y="${top + 3 + gi * lane}" width="${Math.max(x2 - x1, 1.5).toFixed(1)}" height="9" rx="2" fill="${col}" opacity="${m.fin ? 0.85 : 0.5}"/>`;
  });

  return { svg: `<svg viewBox="0 0 ${W} ${alto}" preserveAspectRatio="none" style="height:${alto}px">${s}</svg>`, alto, grupos };
}

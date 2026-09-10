import type { Expediente } from '@/types/expediente';
import { day } from '@/utils/expediente.utils';
import { W, X, type Dominio } from '../rango.utils';

export function filaEventos(D: Expediente, dom: Dominio): string {
  const h = 34;
  let s = `<line x1="0" y1="17" x2="${W}" y2="17" stroke="var(--line)"/>`;
  D.eventos.forEach((e) => {
    const x = X(dom, day(e.fecha));
    if (x < -4 || x > W + 4) return;
    const big = e.peso === 'alto';
    s += `<line x1="${x.toFixed(1)}" y1="8" x2="${x.toFixed(1)}" y2="26" stroke="var(--red)" stroke-width="${big ? 1.6 : 1}" opacity="${big ? 1 : 0.5}"/>` +
      `<circle cx="${x.toFixed(1)}" cy="17" r="${big ? 4 : 2.8}" fill="var(--red)" stroke="var(--surface)" stroke-width="1.4"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${s}</svg>`;
}

export const ALTO_EVENTOS = 34;

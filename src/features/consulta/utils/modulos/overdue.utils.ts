import type { Expediente } from '@/types/expediente';
import { ago, fmtS } from '@/utils/expediente.utils';

export type FilaVencida = { n: string; c: number; f: string | null };

const RELEVANTES = [
  'NT-proBNP / BNP', 'HbA1c', 'Troponina I', 'TSH', 'Ferritina', 'Hierro sérico', 'PCR', 'VSG',
  'INR', 'Potasio', 'TFG estimada', 'Plaquetas', 'GGT',
];

/** Portado de M_overdue(). */
export function calcularVencidos(D: Expediente): FilaVencida[] {
  return RELEVANTES.map((n) => {
    const S = D.labs[n];
    return { n, c: S ? S.puntos.length : 0, f: S && S.puntos.length ? S.puntos[S.puntos.length - 1].f : null };
  }).sort((a, b) => (b.f ? ago(D, b.f) : 9999) - (a.f ? ago(D, a.f) : 9999));
}

export const fmtUltimo = (f: string | null) => (f ? fmtS(f) : '—');

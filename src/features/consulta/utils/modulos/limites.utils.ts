import type { Expediente } from '@/types/expediente';
import { ago, fmtD, nf, U, ultimo } from '@/utils/expediente.utils';

export type Limite = { k: string; e: string; v: string; d: string; old: boolean };

const EXTRA: Array<[string, string]> = [
  ['Potasio', 'limita ARM y ARNI'],
  ['TFG estimada', 'limita ARM, ARNI e iSGLT2'],
  ['Creatinina', ''],
  ['Plaquetas', 'condiciona el antiagregante'],
  ['Sodio', ''],
];

/** Portado de M_limites(). */
export function calcularLimites(D: Expediente): Limite[] {
  const L: Limite[] = [];
  const pas = ultimo(D, 'Presión arterial');
  const fc = ultimo(D, 'Pulso en reposo');
  if (pas) L.push({ k: 'Presión sistólica', e: 'limita ARNI y betabloqueador', v: `${Math.round(pas.v)} mmHg`, d: fmtD(pas.f), old: ago(D, pas.f) > 90 });
  if (fc) L.push({ k: 'Frecuencia cardiaca', e: 'limita betabloqueador', v: `${Math.round(fc.v)} lpm`, d: fmtD(fc.f), old: ago(D, fc.f) > 90 });
  EXTRA.forEach(([m, e]) => {
    const u = ultimo(D, m);
    if (!u) return;
    L.push({ k: m, e, v: `${nf(u.v)} ${U(m)}`, d: fmtD(u.f), old: ago(D, u.f) > 120 });
  });
  return L;
}

import type { Expediente } from '@/types/expediente';
import { day, fmtS, nf, refOf, serie } from '@/utils/expediente.utils';

export type EtiquetaAhora = { texto: string; sub: string; out: boolean; vivo: boolean; vacio?: boolean };

function valorEn(D: Expediente, nombre: string, t: number) {
  const S = serie(D, nombre);
  let v = null;
  for (const p of S) {
    if (day(p.f) <= t) v = p;
    else break;
  }
  return v;
}

function textoPresion(D: Expediente, f: string) {
  const rs = D.presion.filter((r) => r.f === f);
  if (!rs.length) return null;
  const smin = Math.min(...rs.map((r) => r.s));
  const smax = Math.max(...rs.map((r) => r.s));
  const dmin = Math.min(...rs.map((r) => r.d));
  const dmax = Math.max(...rs.map((r) => r.d));
  const pam = Math.round(rs.reduce((a, r) => a + r.a, 0) / rs.length);
  const s = smin === smax ? String(smin) : `${smin}–${smax}`;
  const d = dmin === dmax ? String(dmin) : `${dmin}–${dmax}`;
  return { txt: `${s}/${d} · PAM ${pam}`, out: pam < 65, n: rs.length };
}

/**
 * Portado de syncLabels(): la etiqueta ".now" de cada fila, evaluada en el
 * instante `t` bajo el cursor (o en el último valor si no hay cursor).
 */
export function calcularEtiquetaAhora(D: Expediente, nombre: string, t: number | null): EtiquetaAhora {
  const vivo = t !== null;
  if (nombre === 'Presión arterial') {
    const S = serie(D, 'PAM');
    const p = vivo ? valorEn(D, 'PAM', t as number) : S[S.length - 1];
    if (!p) return { texto: 'sin registro', sub: '', out: false, vivo, vacio: true };
    const tp = textoPresion(D, p.f);
    return { texto: tp ? tp.txt : nf(p.v), sub: `${vivo ? '' : 'últ. '}${fmtS(p.f)}${tp && tp.n > 1 ? ` · ${tp.n} tomas` : ''}`, out: !!tp?.out, vivo };
  }
  const S = serie(D, nombre);
  const p = vivo ? valorEn(D, nombre, t as number) : S[S.length - 1];
  const r = refOf(D, nombre);
  if (!p) return { texto: 'aún sin dato', sub: '', out: false, vivo, vacio: true };
  const out = !!r && (p.v < r[0] || p.v > r[1]);
  return { texto: nf(p.v) + (out ? '  ▲' : ''), sub: `${vivo ? '' : 'últ. '}${fmtS(p.f)}`, out, vivo };
}

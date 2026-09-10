import type { Expediente } from '@/types/expediente';
import { ago, fmtD, nf, pamStats, serie, ultimo } from '@/utils/expediente.utils';

export type Tile = {
  k: string;
  v: string;
  u: string;
  m: string;
  cls: 'crit' | 'warn' | 'good' | '';
  sp: string;
  stale: boolean;
};

export type SparkPunto = { x: number; y: number };

/** Portado de sparkline(): normaliza una serie a coordenadas de un viewBox w×h. */
export function calcularSparkline(D: Expediente, nombre: string, w: number, h: number): SparkPunto[] {
  const S = serie(D, nombre);
  if (S.length < 2) return [];
  const vs = S.map((p) => p.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const rng = hi - lo || 1;
  const t0 = new Date(S[0].f + 'T12:00:00Z').getTime();
  const t1 = new Date(S[S.length - 1].f + 'T12:00:00Z').getTime();
  const span = t1 - t0 || 1;
  return S.map((p) => ({
    x: ((new Date(p.f + 'T12:00:00Z').getTime() - t0) / span) * (w - 3) + 1.5,
    y: h - 2 - ((p.v - lo) / rng) * (h - 4),
  }));
}

/** Portado de M_tiles(). Devuelve null si falta algún dato base (expediente incompleto). */
export function calcularTiles(D: Expediente): Tile[] | null {
  const fev = D.fevi[D.fevi.length - 1];
  const plq = ultimo(D, 'Plaquetas');
  const tfg = ultimo(D, 'TFG estimada');
  const cr = ultimo(D, 'Creatinina');
  const k = ultimo(D, 'Potasio');
  const pas = ultimo(D, 'Presión arterial');
  const fc = ultimo(D, 'Pulso en reposo');
  const pam = ultimo(D, 'PAM');
  const pz = ultimo(D, 'Peso');
  if (!fev || !plq || !tfg || !cr || !k || !pas || !fc || !pam || !pz) return null;
  const ps = pamStats(D);

  return [
    { k: 'FEVI', v: String(fev.valor), u: '%', m: `${fmtD(fev.fecha)} · hace ${ago(D, fev.fecha)} d`,
      cls: fev.valor < 40 ? 'crit' : fev.valor < 50 ? 'warn' : 'good', sp: 'FEVI', stale: ago(D, fev.fecha) > 180 },
    { k: 'Plaquetas', v: nf(plq.v), u: 'mil/µL', m: `${fmtD(plq.f)} · ref 150–450`,
      cls: plq.v < 100 ? 'crit' : plq.v < 150 ? 'warn' : 'good', sp: 'Plaquetas', stale: false },
    { k: 'TFG estimada', v: nf(tfg.v), u: 'mL/min', m: `${fmtD(tfg.f)} · Cr ${nf(cr.v)}`,
      cls: tfg.v < 60 ? 'warn' : 'good', sp: 'TFG estimada', stale: false },
    { k: 'Potasio', v: nf(k.v), u: 'mmol/L', m: `${fmtD(k.f)} · ref 3.5–5.1`,
      cls: k.v > 5 || k.v < 3.5 ? 'warn' : 'good', sp: 'Potasio', stale: false },
    { k: 'PA sistólica', v: String(Math.round(pas.v)), u: 'mmHg', m: `${fmtD(pas.f)} · hace ${ago(D, pas.f)} d`,
      cls: '', sp: 'Presión arterial', stale: ago(D, pas.f) > 90 },
    { k: 'PAM', v: String(Math.round(pam.v)), u: 'mmHg', m: `${fmtD(pam.f)} · ${ps.pct}% de ${ps.n} tomas bajo 65`,
      cls: pam.v < 65 ? 'crit' : pam.v < 70 ? 'warn' : 'good', sp: 'PAM', stale: ago(D, pam.f) > 90 },
    { k: 'FC en reposo', v: String(Math.round(fc.v)), u: 'lpm', m: `${fmtD(fc.f)} · hace ${ago(D, fc.f)} d`,
      cls: fc.v > 90 ? 'warn' : '', sp: 'Pulso en reposo', stale: ago(D, fc.f) > 90 },
    { k: 'Peso', v: nf(pz.v), u: 'kg', m: `${fmtD(pz.f)} · hace ${ago(D, pz.f)} d`, cls: '', sp: 'Peso', stale: false },
  ];
}

import type { Expediente } from '@/types/expediente';
import { fmtD, fmtS, nf, pamStats, serie, U } from '@/utils/expediente.utils';
import type { Flag } from './flags.utils';

const PAM_UMBRAL = 65;

const RUIDO = new Set([
  'Colesterol total', 'HDL', 'LDL', 'Triglicéridos', 'Amilasa', 'Lipasa', 'Índice HOMA', 'Insulina',
  'Ácido úrico', 'Basófilos %', 'Eosinófilos %', 'Monocitos %', 'CHCM', 'HCM', 'Eritrocitos',
]);

type Obs = { w: number; t: string; d: string; s: string };

/** Portado de M_obs(): observaciones calculadas, ordenadas por peso y recortadas a 6. */
export function calcularObservaciones(D: Expediente): Flag[] {
  const out: Obs[] = [];

  Object.entries(D.labs).forEach(([n, S]) => {
    const r = S.ref;
    if (!r || S.puntos.length < 6 || RUIDO.has(n)) return;
    const fuera = S.puntos.filter((p) => p.v < r[0] || p.v > r[1]).length;
    if (fuera === S.puntos.length) {
      const vs = S.puntos.map((p) => p.v);
      out.push({
        w: 1, t: `${n} fuera de rango en ${fuera} de ${fuera} mediciones`,
        d: `Ni una sola dentro de ${nf(r[0])}–${nf(r[1])} ${U(n)} en 13 meses. Rango observado ${nf(Math.min(...vs))}–${nf(Math.max(...vs))}.`,
        s: `n=${fuera} · ${fmtS(S.puntos[0].f)} a ${fmtS(S.puntos[S.puntos.length - 1].f)}`,
      });
    } else if (fuera / S.puntos.length >= 0.7) {
      out.push({
        w: 2, t: `${n} fuera de rango en ${fuera} de ${S.puntos.length}`,
        d: `Referencia ${nf(r[0])}–${nf(r[1])} ${U(n)}. Último valor ${nf(S.puntos[S.puntos.length - 1].v)}.`,
        s: `n=${S.puntos.length}`,
      });
    }
  });

  const ps = pamStats(D);
  if (ps.n > 30 && ps.pct >= 15) {
    const mes: Record<string, number[]> = {};
    D.presion.filter((r) => r.a).forEach((r) => { (mes[r.f.slice(0, 7)] ??= []).push(r.a); });
    const linea = Object.keys(mes).sort()
      .filter((k) => mes[k].length >= 10)
      .map((k) => `${k} ${Math.round((100 * mes[k].filter((v) => v < PAM_UMBRAL).length) / mes[k].length)}%`)
      .join(' · ');
    out.unshift({
      w: 0, t: `La PAM estuvo bajo 65 mmHg en ${ps.pct}% de las tomas`,
      d: `${ps.bajas} de ${ps.n} tomas caseras por debajo del umbral de perfusión de 65 mmHg, repartidas en ${ps.dbajos} de los ${ps.dias} días con registro. Mínimo ${ps.min} mmHg. Por mes, proporción de tomas bajo 65: ${linea}. El umbral de 65 es el que usa la propia hoja de registro; interpretarlo junto con la titulación de sacubitrilo/valsartán y vericiguat de esas semanas.`,
      s: `n=${ps.n} tomas · ${ps.dias} días`,
    });
  }

  const hr = serie(D, 'Pulso en reposo');
  if (hr.length > 20) {
    let best: { d: number; ma: number; mb: number; f: string } | null = null;
    for (let i = 8; i < hr.length - 8; i++) {
      const a = hr.slice(Math.max(0, i - 14), i);
      const b = hr.slice(i, i + 14);
      const ma = a.reduce((s, x) => s + x.v, 0) / a.length;
      const mb = b.reduce((s, x) => s + x.v, 0) / b.length;
      if (!best || Math.abs(mb - ma) > Math.abs(best.d)) best = { d: mb - ma, ma, mb, f: hr[i].f };
    }
    if (best && Math.abs(best.d) >= 12) {
      out.unshift({
        w: 0, t: `El pulso en reposo da un escalón de ${Math.round(Math.abs(best.d))} lpm`,
        d: `Media de ${Math.round(best.ma)} lpm en las 2 semanas previas al ${fmtD(best.f)} y ${Math.round(best.mb)} lpm en las 2 posteriores, sin transición. Puede ser un cambio clínico o un cambio de aparato o de captura: verificarlo antes de interpretarlo.`,
        s: `n=${hr.length} tomas matutinas`,
      });
    }
  }

  Object.entries(D.labs).forEach(([n, S]) => {
    if (S.puntos.length < 8 || RUIDO.has(n)) return;
    const vs = S.puntos.map((p) => p.v).slice().sort((a, b) => a - b);
    const med = vs[Math.floor(vs.length / 2)];
    const q1 = vs[Math.floor(vs.length * 0.25)];
    const q3 = vs[Math.floor(vs.length * 0.75)];
    const iqr = q3 - q1;
    if (iqr <= 0) return;
    S.puntos.forEach((p) => {
      if (p.v > q3 + 3 * iqr || p.v < q1 - 3 * iqr) {
        out.push({
          w: 4, t: `${n}: el valor del ${fmtD(p.f)} rompe el patrón`,
          d: `${nf(p.v)} ${U(n)} contra una mediana de ${nf(med)} en el resto del expediente. Confirmar método y laboratorio antes de leerlo como cambio real.`,
          s: `archivo: ${p.src || '—'}`,
        });
      }
    });
  });

  out.sort((a, b) => a.w - b.w);
  return out.slice(0, 6).map((o): Flag => ({ c: 'blue', t: o.t, d: o.d, s: o.s }));
}

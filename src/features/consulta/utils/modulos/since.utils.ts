import type { Expediente } from '@/types/expediente';
import { activeMeds, ago, day, fmtD, fmtS, nf } from '@/utils/expediente.utils';

/** Un fragmento del párrafo de "since": texto plano o énfasis (<b>, con .up si sale de rango). */
export type FragmentoDesde = { texto: string; b?: boolean; up?: boolean };

export type ResultadoDesde = {
  parrafo: FragmentoDesde[];
  opciones: Array<{ value: string; label: string; selected: boolean }>;
  fuenteConsulta?: string;
};

const MARCADORES_CLAVE = ['Plaquetas', 'GGT', 'Leucocitos', 'Hemoglobina', 'ALT (TGP)', 'Fosfatasa alcalina', 'Creatinina', 'Potasio'];
const PAM_UMBRAL = 65;

/** Portado de M_since(). */
export function calcularDesde(D: Expediente, refDate: string): ResultadoDesde {
  const t0 = day(refDate);
  const after = (f: string) => day(f) > t0;
  const C = D.consulta_cardio;
  const esConsulta = !!C?.f && refDate === C.f;

  type Movida = { n: string; a: number; b: number; dpc: number; ref: [number, number] | null };
  const moves: Movida[] = [];
  MARCADORES_CLAVE.forEach((n) => {
    const S = D.labs[n];
    if (!S) return;
    const before = S.puntos.filter((p) => day(p.f) <= t0).pop();
    const now = S.puntos[S.puntos.length - 1];
    if (!before || !now || !after(now.f)) return;
    const dpc = ((now.v - before.v) / Math.abs(before.v)) * 100;
    if (Math.abs(dpc) >= 8) moves.push({ n, a: before.v, b: now.v, dpc, ref: S.ref });
  });
  moves.sort((x, y) => Math.abs(y.dpc) - Math.abs(x.dpc));

  const nLabs = new Set(Object.values(D.labs).flatMap((S) => S.puntos.filter((p) => after(p.f)).map((p) => p.f))).size;
  const evs = D.eventos.filter((e) => after(e.fecha));

  const P: FragmentoDesde[] = [];
  if (esConsulta && C) {
    P.push({ texto: `Desde que lo vio ${C.quien.toLowerCase()} el ${fmtD(C.f)} han pasado ` });
    P.push({ texto: `${ago(D, C.f)} días`, b: true });
    P.push({ texto: '. ' });
  }
  if (!nLabs) {
    P.push({ texto: 'No hay estudios nuevos posteriores a esa fecha en el expediente.' });
  } else {
    P.push({ texto: nLabs === 1 ? 'Hay ' : 'Hay ' });
    P.push({ texto: nLabs === 1 ? 'un control de laboratorio nuevo' : `${nLabs} controles nuevos`, b: true });
    if (moves.length) {
      P.push({ texto: '. ' });
      moves.slice(0, 3).forEach((m, i) => {
        const out = !!m.ref && (m.b < m.ref[0] || m.b > m.ref[1]);
        if (i > 0) P.push({ texto: ', ' });
        P.push({ texto: `${m.n}${m.dpc > 0 ? ' subió' : ' bajó'} de ${nf(m.a)} a ${nf(m.b)}`, b: true, up: out });
      });
      P.push({ texto: '.' });
    } else {
      P.push({ texto: ', sin cambios mayores al 8% en los marcadores clave.' });
    }
  }
  if (evs.length) {
    P.push({ texto: ` Eventos en el periodo: ${evs.map((e) => `${e.titulo.toLowerCase()} (${fmtS(e.fecha)})`).join(', ')}.` });
  }

  const casa = D.presion.filter((r) => r.src === 'casa' && after(r.f));
  if (casa.length) {
    const dias = new Set(casa.map((r) => r.f)).size;
    const pamVals = casa.map((r) => r.a);
    const bajas = pamVals.filter((v) => v < PAM_UMBRAL).length;
    const med = Math.round(pamVals.reduce((a, b) => a + b, 0) / pamVals.length);
    P.push({
      texto: ` En casa se tomó la presión ${casa.length} veces en ${dias} días desde entonces: PAM media ${med} mmHg, ` +
        (bajas ? `${bajas} tomas (${Math.round((100 * bajas) / pamVals.length)}%) bajo 65` : 'ninguna bajo 65') + '.',
    });
    const pz = D.peso.filter((r) => after(r.f));
    if (pz.length) P.push({ texto: ` Peso más reciente ${nf(pz[pz.length - 1].v)} kg (${fmtS(pz[pz.length - 1].f)}).` });
  } else {
    const pas = D.presion.filter((r) => r.m === 'mañana' || r.src === 'consulta').filter((r) => r.s).pop();
    if (pas) P.push({ texto: ` Sin signos nuevos: los últimos son del ${fmtD(pas.f)}, hace ${ago(D, pas.f)} días.` });
  }
  P.push({ texto: ' Tratamiento vigente: ' });
  P.push({ texto: `${activeMeds(D, D.hoy).length} fármacos`, b: true });
  P.push({ texto: '.' });

  const labDates = [...new Set(Object.values(D.labs).flatMap((S) => S.puntos.map((p) => p.f)))].sort();
  const opciones = [
    ...(C?.f ? [{ value: C.f, label: `${C.f} · última consulta`, selected: esConsulta }] : []),
    ...labDates.map((f) => ({ value: f, label: f, selected: f === refDate })),
  ];

  return { parrafo: P, opciones, fuenteConsulta: esConsulta ? C?.fuente : undefined };
}

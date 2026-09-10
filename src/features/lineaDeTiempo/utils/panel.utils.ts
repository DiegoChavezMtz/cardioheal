import type { Expediente } from '@/types/expediente';
import { activeMeds, ago, nf, U } from '@/utils/expediente.utils';

export type PanelDia = {
  fecha: string;
  relativo: string;
  eventos: Array<{ titulo: string; detalle: string }>;
  estudios: Array<{ titulo: string; conclusion: string }>;
  signos: { filas: Array<{ etiqueta: string; valor: string; out: boolean }>; masTomas: number } | null;
  labs: { filas: Array<{ nombre: string; valor: string; out: boolean }>; masLabs: number } | null;
  tratamiento: { n: number; farmacos: Array<{ nombre: string; dosis: string; color: 'blue' | 'red' | 'amber' }> };
};

const ORDEN_LABS = [
  'Plaquetas', 'Leucocitos', 'Linfocitos absolutos', 'Hemoglobina', 'Potasio', 'Sodio', 'Creatinina',
  'TFG estimada', 'NT-proBNP / BNP', 'GGT', 'Fosfatasa alcalina', 'ALT (TGP)', 'AST (TGO)', 'Bilirrubina total', 'Glucosa',
];

/** Portado de panel(): todo lo que pasó en una fecha concreta. */
export function calcularPanel(D: Expediente, f: string): PanelDia {
  const eventos = D.eventos.filter((e) => e.fecha === f).map((e) => ({ titulo: e.titulo, detalle: e.detalle }));
  const estudios = D.estudios.filter((s) => s.f === f).map((s) => ({ titulo: s.t, conclusion: s.concl }));

  const pr = D.presion.filter((r) => r.f === f);
  const pe = D.peso.filter((r) => r.f === f);
  const gl = D.glucosa.filter((r) => r.f === f);
  let signos: PanelDia['signos'] = null;
  if (pr.length || pe.length || gl.length) {
    const filasReales: Array<{ etiqueta: string; valor: string; out: boolean }> = [];
    pr.slice(0, 8).forEach((r) => {
      filasReales.push({
        etiqueta: r.h || r.m || '',
        valor: `${r.s}/${r.d} mmHg${r.a ? ` · PAM ${r.a}` : ''}${r.p ? ` · ${r.p} lpm` : ''}${r.o ? ` · ${r.o}%` : ''}`,
        out: !!r.a && r.a < 65,
      });
    });
    gl.forEach((r) => filasReales.push({ etiqueta: 'Glucosa capilar', valor: `${nf(r.v)} mg/dL (registro casero)`, out: false }));
    pe.forEach((r) => filasReales.push({ etiqueta: 'Peso', valor: `${nf(r.v)} kg`, out: false }));
    signos = { filas: filasReales, masTomas: Math.max(0, pr.length - 8) };
  }

  const labsDelDia: Array<[string, number, [number, number] | null]> = [];
  Object.keys(D.labs).forEach((n) => {
    const p = D.labs[n].puntos.find((x) => x.f === f);
    if (p) labsDelDia.push([n, p.v, D.labs[n].ref]);
  });
  let labs: PanelDia['labs'] = null;
  if (labsDelDia.length) {
    labsDelDia.sort((a, b) => {
      const ia = ORDEN_LABS.indexOf(a[0]);
      const ib = ORDEN_LABS.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a[0].localeCompare(b[0]);
    });
    const filas = labsDelDia.slice(0, 15).map(([nombre, v, ref]) => ({
      nombre, valor: `${nf(v)} ${U(nombre)}`, out: !!ref && (v < ref[0] || v > ref[1]),
    }));
    labs = { filas, masLabs: Math.max(0, labsDelDia.length - 15) };
  }

  const ms = activeMeds(D, f);
  const tratamiento = {
    n: ms.length,
    farmacos: ms.map((m) => ({
      nombre: m.farmaco,
      dosis: m.dosis,
      color: (m.confianza === 'documentado' ? 'blue' : /conflicto/.test(m.confianza) ? 'red' : 'amber') as 'blue' | 'red' | 'amber',
    })),
  };

  return { fecha: f, relativo: ago(D, f) === 0 ? 'hoy' : `hace ${ago(D, f)} días`, eventos, estudios, signos, labs, tratamiento };
}

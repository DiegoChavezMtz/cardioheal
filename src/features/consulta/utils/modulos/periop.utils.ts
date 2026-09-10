import type { Expediente } from '@/types/expediente';
import { fmtD, nf, ultimo } from '@/utils/expediente.utils';

/** Portado de M_periop(): filas [etiqueta, valor]. Null si falta un dato base. */
export function calcularPeriop(D: Expediente): Array<[string, string]> | null {
  const f = D.fevi[D.fevi.length - 1];
  const plq = ultimo(D, 'Plaquetas');
  const inr = ultimo(D, 'INR');
  const tp = ultimo(D, 'TP (segundos)');
  if (!f || !plq || !inr || !tp) return null;

  return [
    ['FEVI', `${f.valor}% · ${fmtD(f.fecha)} · ${f.fuente}`],
    ['⚠ FEVI discordante',
      'El informe de la ecocardioscopia del 25 abr 2026, dentro de la valoración preoperatoria, escribe «FEVI 79%». ' +
      'Ese mismo informe describe hipocinesia anteroapical e inferoapical y un gasto cardiaco de 3.74 L/min. No se puede saber desde ' +
      'aquí si es un error de captura, una estimación visual o un parámetro distinto transcrito como FEVI: hay que verlo contra el ' +
      'estudio original. NO se incorporó a la serie, que sigue siendo 22 → 23 → 37 → 48 → 43.'],
    ['Capacidad funcional', '8.88 METS en prueba de esfuerzo del 20 dic 2025; CF I NYHA'],
    ['Coronarias', 'Sin lesiones epicárdicas; ectasia Markis I y flujo lento pancoronario (10 ene 2026)'],
    ['Arritmia', 'TV polimórfica no sostenida (Holter ago-2025) y FV con desfibrilación durante el cateterismo (ene-2026)'],
    ['Plaquetas', `${nf(plq.v)} mil/µL (${fmtD(plq.f)}); nadir 22 mil en feb-2026 con aféresis`],
    ['Coagulación', `INR ${nf(inr.v)} · TP ${nf(tp.v)} s (${fmtD(inr.f)})`],
    ['Antitrombóticos', 'ASA en situación no documentada desde abr-2026; rivaroxabán suspendido desde sep-2025'],
    ['Hepatopatía', 'Child-Pugh A · fibrosis F3 Metavir · porta 15 mm · índice esplénico 904 · várices pequeñas'],
    ['Sangrado digestivo', 'Gastropatía eritematosa y hemorrágica subepitelial leve (endoscopia 28 mar 2026)'],
    ['Cirugía previa', 'Hernioplastia inguinal bilateral con malla, 25 abr 2026, sin complicaciones'],
  ];
}

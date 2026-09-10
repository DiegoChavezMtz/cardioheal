import type { Expediente } from '@/types/expediente';
import { ago, fmtD, ultimo } from '@/utils/expediente.utils';

export type Flag = { c: 'red' | 'amber' | 'blue'; t: string; d: string; s: string };

const FIJAS: Flag[] = [
  { c: 'red', t: 'El antiagregante quedó sin documento desde abril',
    d: 'ASA 100 mg se indicó el 10 ene 2026 como «no suspender por tiempo indefinido». Los planes del 25 y 26 abr no lo incluyen, y ningún documento posterior lo suspende ni lo reinicia. Entre medias aparecieron várices esofágicas y gastropatía hemorrágica.',
    s: '[CORO] + [EGR0111] vs [VPO] + [EGR0426]' },
  { c: 'red', t: 'Nadir real de plaquetas: 22 mil en feb-2026, con aféresis plaquetaria',
    d: 'Solo consta en la nota de egreso de abril. Ni el valor ni el procedimiento aparecen en la serie de laboratorio ni en ningún otro documento del expediente. El valor más bajo con fecha registrada es 23 mil del 11 oct 2025.',
    s: '[EGR0426]' },
  { c: 'red', t: 'Hepatopatía estadificada: fibrosis F3 de Metavir con várices e hipertensión portal',
    d: 'Fibroscan en F3 (fibrosis avanzada) con esteatosis S0; endoscopia del 28 mar con várice esofágica pequeña de Baveno y gastropatía hemorrágica; TC con porta de 15 mm e índice esplénico 904. Clasificada Child-Pugh A al ingreso quirúrgico.',
    s: '[VPO] + [TC0424] + [EGR0426]' },
  { c: 'red', t: 'Fibrilación ventricular durante el cateterismo del 10 ene 2026',
    d: 'Al canular la coronaria derecha cursó con FV que requirió desfibrilación con 200 J, seguida de bloqueo AV resuelto con atropina. Suma al antecedente de TV polimórfica no sostenida del Holter de agosto.',
    s: '[CORO]' },
  { c: 'red', t: 'Hallazgo pendiente de resolver: adenomegalias mediastinales calcificadas',
    d: 'La TC de feb-2026 describe adenomegalias mediastinales múltiples, algunas calcificadas, con bronquiolitis y árbol en gemación, sugestivas de probable infección granulomatosa a considerar por micobacterias. La TC de abril las vuelve a describir. No hay ningún estudio que lo aborde.',
    s: '[TC0224] + [TC0424]' },
  { c: 'amber', t: 'El betabloqueador cambió a carvedilol y quedó al 6% de la dosis objetivo',
    d: 'El 25 abr 2026 pasó de metoprolol succinato ¼ tab (23.75 mg/día) a carvedilol 6.25 mg ½ tab (3.125 mg/día). El carvedilol es además el betabloqueador de elección en hipertensión portal: ver el módulo de patrones.',
    s: '[VPO] + [EGR0426]' },
  { c: 'amber', t: 'Tres antiinflamatorios no esteroideos en trece meses',
    d: 'Ibuprofeno (ago-2025), meloxicam al egreso de la hernioplastia (abr-2026) y diclofenaco (jun-2026). Los tres con ARNI y espironolactona activos; los dos últimos con várices y gastropatía hemorrágica ya documentadas.',
    s: '[HOJA] + [EGR0426] + [CRONO]' },
  { c: 'amber', t: 'La trombocitopenia no empezó en 2025: se conoce desde hace ~10 años',
    d: 'Hematología documentó el 22 ene 2026 que al intentar donar sangre le detectaron trombocitopenia y nunca se estudió. Eso cambia la lectura de todo el descenso de 2025.',
    s: '[HEM]' },
  { c: 'amber', t: 'La FEVI del eco de abril (79%) no es plausible',
    d: 'El mismo informe describe hipocinesia anteroapical e inferoapical, y en enero la FEVI biplanar fue de 43%. No se incorporó a la serie; hay que verificarla contra el estudio original.',
    s: '[VPO]' },
  { c: 'blue', t: 'La coronariografía cambió el diagnóstico: no hay enfermedad coronaria obstructiva',
    d: 'El 10 ene 2026 las arterias epicárdicas resultaron sin lesiones angiográficamente significativas. Lo documentado es ectasia Markis I con flujo lento pancoronario, y el egreso lo llama enfermedad microvascular. La resonancia de ago-2025 sí muestra cicatriz transmural en el 58% de la masa del VI.',
    s: '[CORO] + [EGR0111]' },
  { c: 'blue', t: 'Rehabilitación cardiaca: sí se realizó',
    d: 'Prueba de esfuerzo el 8 nov 2025 con 7.3 METS, cinco sesiones más sin síntomas, y control el 20 dic con 8.88 METS. Al egreso de enero se indicó continuar en fase IV.',
    s: '[NC0901] + [EGR0111]' },
];

/** Portado de M_flags(): 11 fijas + 1 calculada (última toma casera). */
export function calcularFlags(D: Expediente): Flag[] {
  const pas = ultimo(D, 'Presión arterial');
  const dinamica: Flag[] = pas
    ? [{ c: 'amber', t: `Sin signos nuevos desde el ${fmtD(pas.f)}`,
        d: `Hace ${ago(D, pas.f)} días. El registro casero diario se detuvo en nov-2025; los últimos signos son los tomados en consulta.`,
        s: '[HOJA] + [VPO]' }]
    : [];
  return [...FIJAS.slice(0, 9), ...dinamica, ...FIJAS.slice(9)];
}

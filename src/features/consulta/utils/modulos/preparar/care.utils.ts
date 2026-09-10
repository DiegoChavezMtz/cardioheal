import type { Expediente } from '@/types/expediente';
import { csvLabs, csvMeds, csvPresion } from './csv.utils';
import { borradorMD } from './borrador.utils';

export type EstadoCare = 'listo' | 'parcial' | 'pendiente' | 'falta';
export type FilaCare = { n: string; e: EstadoCare; q: string };

export const CARE: FilaCare[] = [
  { n: '1. Título', e: 'pendiente', q: 'Lo escribe el médico. El borrador propone un punto de partida.' },
  { n: '2. Palabras clave', e: 'listo', q: 'Nueve términos propuestos a partir de los diagnósticos del expediente.' },
  { n: '3. Resumen', e: 'parcial', q: 'La presentación y la evolución salen de los datos; los antecedentes y la conclusión los escribe el médico.' },
  { n: '4. Introducción', e: 'pendiente', q: 'Requiere el contexto y el argumento del autor.' },
  { n: '5. Información del paciente', e: 'listo', q: 'Edad, sexo, diagnósticos y antecedentes, con su fuente.' },
  { n: '6. Hallazgos clínicos', e: 'parcial', q: 'Hay signos de consulta, pero no exploración física: no consta en el expediente digital.' },
  { n: '7. Cronología', e: 'listo', q: 'Tabla con todos los eventos fechados del expediente.' },
  { n: '8. Evaluación diagnóstica', e: 'listo', q: 'Laboratorio completo, estudios de imagen y electrocardiogramas, con su conclusión textual.' },
  { n: '9. Intervención terapéutica', e: 'listo', q: 'Fármacos con dosis, fechas de inicio y fin, y el nivel de confianza de cada dato.' },
  { n: '10. Seguimiento y resultados', e: 'listo', q: 'Serie de fracción de eyección, automedición mes a mes y capacidad funcional.' },
  { n: '11. Discusión', e: 'parcial', q: 'Las limitaciones del expediente se listan solas; el razonamiento clínico y la lectura de la literatura son del autor.' },
  { n: '12. Perspectiva del paciente', e: 'falta', q: 'No está en el expediente. La guía CARE la pide y hay que recogerla.' },
  { n: '13. Consentimiento informado', e: 'falta', q: 'Obligatorio y ausente. Sin él no hay publicación posible.' },
];

export type Exportable = { id: 'borrador' | 'labs' | 'presion' | 'meds' | 'json'; n: string; d: string; f: 'markdown' | 'csv' | 'json' };

export function listaExportables(D: Expediente): Exportable[] {
  const nVals = Object.values(D.labs).reduce((a, S) => a + S.puntos.length, 0);
  const nFech = new Set(Object.values(D.labs).flatMap((S) => S.puntos.map((p) => p.f))).size;
  return [
    { id: 'borrador', n: 'Borrador del reporte de caso', d: 'Manuscrito completo con la estructura de la guía CARE, relleno con los datos reales y con cada hueco marcado como pendiente.', f: 'markdown' },
    { id: 'labs', n: 'Tabla de laboratorio', d: `${nVals} valores en ${Object.keys(D.labs).length} marcadores y ${nFech} fechas, con sus rangos de referencia. Lista para ser la Tabla 1.`, f: 'csv' },
    { id: 'presion', n: 'Automedición domiciliaria', d: `${D.presion.length} tomas con fecha, hora, franja, sistólica, diastólica, PAM, presión de pulso, pulso y saturación.`, f: 'csv' },
    { id: 'meds', n: 'Tratamiento', d: `${D.meds.length} intervalos de fármaco con dosis, fechas y confianza del dato.`, f: 'csv' },
    { id: 'json', n: 'Expediente completo', d: 'Todo el paquete de datos tal como lo consume esta consola, para reanalizarlo con otras herramientas.', f: 'json' },
  ];
}

/** Portado de contenidoExport(). */
export function contenidoExport(D: Expediente, id: Exportable['id']): { texto: string; archivo: string } {
  if (id === 'borrador') return { texto: borradorMD(D), archivo: 'borrador-reporte-caso.md' };
  if (id === 'labs') return { texto: csvLabs(D), archivo: 'laboratorio-antonio-velazquez.csv' };
  if (id === 'presion') return { texto: csvPresion(D), archivo: 'automedicion-presion.csv' };
  if (id === 'meds') return { texto: csvMeds(D), archivo: 'tratamiento.csv' };
  return { texto: JSON.stringify(D, null, 1), archivo: 'expediente-cardioheal.json' };
}

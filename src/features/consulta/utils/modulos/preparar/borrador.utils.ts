import type { Expediente } from '@/types/expediente';
import { day, fmtD, MS, pamStats } from '@/utils/expediente.utils';

function tablaMD(cab: string[], filas: (string | number)[][]): string {
  return `| ${cab.join(' | ')} |\n| ${cab.map(() => '---').join(' | ')} |\n${filas.map((r) => `| ${r.join(' | ')} |`).join('\n')}`;
}

/** Portado de borradorMD(): el andamio de reporte de caso con estructura CARE. */
export function borradorMD(D: Expediente): string {
  const ps = pamStats(D);
  const hoy = fmtD(new Date().toISOString().slice(0, 10));
  const corte = fmtD(D.hoy);
  const nVals = Object.values(D.labs).reduce((a, S) => a + S.puntos.length, 0);
  const fev = D.fevi.map((f) => `${f.valor}% (${fmtD(f.fecha)}, ${f.fuente})`).join(' → ');

  const L: string[] = [];
  L.push('# Borrador de reporte de caso', '');
  L.push(
    `> Generado por la consola Cardioheal el ${hoy} a partir del expediente. **Es un andamio, no un manuscrito.** ` +
      'Cada sección marcada `[PENDIENTE]` requiere información que no está en el expediente digital y que solo el médico tratante puede aportar. ' +
      'Las cifras vienen de los datos cargados y son verificables una por una en la consola.',
  );
  L.push('', 'Sigue la estructura de la guía **CARE** para reportes de caso (Gagnier JJ et al., 2013; care-statement.org).', '', '---', '');
  L.push('## 1. Título');
  L.push('`[PENDIENTE]` Debe incluir la frase «reporte de caso» y el fenómeno de mayor interés. Punto de partida sugerido:', '');
  L.push(
    '*Hipotensión sostenida detectada por automedición domiciliaria durante la optimización farmacológica en un paciente ' +
      'con insuficiencia cardiaca recuperada, enfermedad microvascular e hipertensión portal: reporte de caso.*',
  );
  L.push('', '## 2. Palabras clave');
  L.push(
    'Insuficiencia cardiaca con fracción de eyección reducida; automedición de la presión arterial; presión arterial media; ' +
      'sacubitrilo/valsartán; vericiguat; ectasia coronaria; trombocitopenia; hipertensión portal; reporte de caso.',
  );
  L.push('', '## 3. Resumen');
  L.push('**Antecedentes.** `[PENDIENTE: por qué este caso es único, en dos frases]`', '');
  L.push(
    '**Presentación.** Varón de 61 años con cardiopatía isquémica crónica y enfermedad microvascular, ' +
      'hepatopatía crónica con hipertensión portal y trombocitopenia de larga evolución.',
    '',
  );
  L.push(
    `**Intervenciones y evolución.** La fracción de eyección pasó de ${D.fevi[0].valor}% a ${D.fevi[D.fevi.length - 1].valor}% en ` +
      `${Math.round((day(D.fevi[D.fevi.length - 1].fecha) - day(D.fevi[0].fecha)) / MS / 30.44)} meses bajo tratamiento dirigido por guías a dosis submáximas. ` +
      `El registro domiciliario acumuló ${ps.n} tomas de presión en ${ps.dias} días, de las cuales ${ps.bajas} (${ps.pct}%) estuvieron por debajo de una presión arterial media de 65 mmHg.`,
  );
  L.push('', '**Conclusión.** `[PENDIENTE: la lección del caso, en una frase]`', '');
  L.push('## 4. Introducción');
  L.push('`[PENDIENTE]` Contexto y por qué el caso aporta. Referencias sugeridas al final de este documento.', '');
  L.push('## 5. Información del paciente');
  L.push('- Varón de 61 años (nacido el 13 de junio de 1965).');
  L.push(
    '- Diagnósticos activos: cardiopatía isquémica crónica con enfermedad microvascular; insuficiencia cardiaca recuperada, ' +
      'clase funcional I; ectasia coronaria Markis I con flujo lento pancoronario; trombocitopenia crónica; hepatopatía crónica ' +
      'F3 de Metavir, Child-Pugh A, con hipertensión portal y várices esofágicas pequeñas; diabetes mellitus tipo 2; hipertensión arterial.',
  );
  Object.entries(D.antecedentes).forEach(([g, items]) => L.push(`- **${g}:** ${items.join(' ')}`));
  L.push('', '## 6. Hallazgos clínicos');
  L.push('`[PENDIENTE]` Exploración física de cada momento relevante: no consta en el expediente digital.', '');
  L.push('Signos registrados en consulta:', '');
  L.push(
    tablaMD(
      ['Fecha', 'TA (mmHg)', 'PAM', 'FC', 'SpO₂', 'Peso'],
      D.signos_consulta.map((x) => [
        fmtD(x.f), `${x.s || ''}/${x.d || ''}`, x.s != null && x.d != null ? Math.round((x.s + 2 * x.d) / 3) : '—', x.p || '—', `${x.o || '—'}%`, `${x.peso || '—'} kg`,
      ]),
    ),
  );
  L.push('', '## 7. Cronología', '');
  L.push(tablaMD(['Fecha', 'Hecho', 'Detalle', 'Fuente'], D.eventos.map((e) => [fmtD(e.fecha), e.titulo, String(e.detalle).replace(/\|/g, '/'), e.fuente])));
  L.push('', '## 8. Evaluación diagnóstica', '');
  L.push(
    `Se reunieron **${nVals} resultados de laboratorio** en ${Object.keys(D.labs).length} marcadores y ` +
      `${new Set(Object.values(D.labs).flatMap((S) => S.puntos.map((p) => p.f))).size} fechas (tabla anexa), ` +
      `${D.estudios.length} estudios de imagen o funcionales y ${D.ecg.length} electrocardiogramas.`,
  );
  L.push('');
  [...D.estudios].sort((a, b) => a.f.localeCompare(b.f)).forEach((e) => {
    L.push(`**${fmtD(e.f)} · ${e.t}** — ${e.hall.join(' ')} *Conclusión:* ${e.concl} \`${e.src}\``, '');
  });
  L.push(`Fracción de eyección a lo largo del seguimiento: ${fev}.`, '');
  L.push('## 9. Intervención terapéutica', '');
  L.push(tablaMD(['Fármaco', 'Dosis', 'Inicio', 'Fin', 'Confianza del dato'], D.meds.map((m) => [m.farmaco, m.dosis, fmtD(m.inicio), m.fin ? fmtD(m.fin) : 'vigente', m.confianza])));
  L.push('', 'Dosis alcanzadas frente a la dosis objetivo de cada clase:', '');
  L.push(
    tablaMD(
      ['Clase', 'Fármaco', 'Dosis actual', 'Objetivo de referencia', '% del objetivo'],
      D.gdmt.map((g) => [g.clase, g.farmaco, g.actual, g.objetivo, g.pct !== null ? `${g.pct}%` : 'no calculable']),
    ),
  );
  L.push('', '## 10. Seguimiento y resultados', '');
  L.push(
    `- **Automedición domiciliaria:** ${ps.n} tomas en ${ps.dias} días. PAM mínima ${ps.min} mmHg; ` +
      `${ps.bajas} tomas (${ps.pct}%) por debajo de 65 mmHg, repartidas en ${ps.dbajos} días.`,
  );
  const mes: Record<string, number[]> = {};
  D.presion.filter((r) => r.src === 'casa' && r.a).forEach((r) => { (mes[r.f.slice(0, 7)] ??= []).push(r.a); });
  L.push('');
  L.push(
    tablaMD(
      ['Mes', 'Tomas', 'PAM media', 'Tomas bajo 65', '%'],
      Object.keys(mes).sort().map((k) => {
        const v = mes[k];
        const b = v.filter((x) => x < 65).length;
        return [k, v.length, `${Math.round(v.reduce((a, x) => a + x, 0) / v.length)} mmHg`, b, `${Math.round((100 * b) / v.length)}%`];
      }),
    ),
  );
  L.push('', '- **Capacidad funcional:** 7.3 METS (8 nov 2025) → 8.88 METS (20 dic 2025).');
  L.push(`- **Último control del expediente:** ${corte}.`, '');
  L.push('## 11. Discusión');
  L.push(
    '`[PENDIENTE]` Fortalezas y limitaciones del abordaje, literatura relevante y razonamiento clínico. ' +
      'Las referencias localizadas están al final; **sus textos completos no se leyeron desde la consola** y deben revisarse antes de citarlas.',
    '',
  );
  L.push('### Limitaciones que impone el propio expediente');
  D.conflictos.forEach((c) => L.push(`- **${c.t}:** una fuente dice «${c.a}» y otra «${c.b}». ${c.n}`));
  (D.huecos || []).forEach((h) => L.push(`- Sin registro domiciliario entre el ${fmtD(h.desde)} y el ${fmtD(h.hasta)} (${h.dias} días).`));
  L.push(`- El ${D.consulta_cardio ? fmtD(D.consulta_cardio.f) : '—'} es la última consulta con cardiología según el registro familiar; no hay nota clínica de esa visita en el expediente.`);
  L.push('', '## 12. Perspectiva del paciente');
  L.push('`[PENDIENTE]` En primera persona, si el paciente quiere aportarla. La guía CARE la pide explícitamente.', '');
  L.push('## 13. Consentimiento informado');
  L.push(
    '`[PENDIENTE — OBLIGATORIO]` Se requiere consentimiento informado firmado del paciente para publicar el caso. ' +
      'Ninguna revista lo acepta sin él. Este borrador contiene datos identificables (fecha de nacimiento, fechas exactas de atención) ' +
      'que deben anonimizarse antes de enviarlo.',
    '', '---', '',
  );
  L.push('## Referencias localizadas', '');
  let i = 0;
  (D.patrones || []).forEach((p) => (p.refs || []).forEach((r) => { i++; L.push(`${i}. ${r.c} — \`${r.id}\``); }));
  L.push('');
  L.push(
    '*Nota de método:* estas referencias se localizaron por búsqueda y se verificó que existen, con su revista, año e identificador. ' +
      'Los textos completos no se abrieron desde la consola, así que **no** están resumidos ni interpretados aquí.',
    '', '## Anexo · procedencia de los datos', '',
  );
  L.push(
    'Cada valor de este borrador viene de un archivo identificado en la consola: ' +
      '63 PDFs de laboratorio, la hoja de automedición domiciliaria y quince documentos clínicos. ' +
      'Las tablas completas se exportan en CSV desde la misma sección.',
  );
  return L.join('\n');
}

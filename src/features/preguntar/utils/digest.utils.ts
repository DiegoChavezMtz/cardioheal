import type { Expediente } from '@/types/expediente';
import { fmtD, nf, pamStats, serie, U } from '@/utils/expediente.utils';

// Portado de REGLAS en app/consola.html original. El comportamiento del
// original solo mandaba esto una vez (en el primer turno) y lo perdía al
// recortar el historial después de 8 turnos — un descuido del prototipo, no
// una decisión. Aquí el servidor lo antepone como mensaje "system" en cada
// solicitud (ver preguntar.server.service.ts), así la respuesta nunca pierde
// el contexto del expediente aunque la conversación sea larga.
const REGLAS = [
  'Eres un asistente de lectura de expediente. Respondes a un cardiólogo sobre UN paciente concreto, usando EXCLUSIVAMENTE los datos de abajo.',
  'REGLAS ESTRICTAS:',
  '1. Toda cifra que menciones debe existir literalmente en los datos, con su fecha. Nunca estimes ni interpoles.',
  "2. Si preguntan algo que los datos no contienen, dilo: 'eso no está en el expediente'.",
  '3. No consultas literatura y no tienes internet. Nunca cites artículos ni guías. Si la pregunta lo requiere, di que esta herramienta no puede responderlo.',
  '4. No des diagnósticos ni indicaciones de tratamiento ni de titulación. Describe lo que muestran los datos; coincidencia no es causa.',
  '5. Los signos caseros solo existen del 10 ago al 16 nov 2025; después solo hay tomas en consulta hasta el 22 ene 2026.',
  '6. Cuando el número de mediciones sea menor a 8, dilo al describir cualquier tendencia.',
  '7. Si la pregunta toca un punto donde dos documentos se contradicen, menciónalo explícitamente en vez de elegir uno.',
  '8. Español, breve, en prosa, máximo 180 palabras.',
  "9. Termina SIEMPRE con una línea que empiece con 'Fuente:' y las fechas y documentos exactos que usaste.",
  '',
  'DATOS DEL EXPEDIENTE:',
  '',
].join('\n');

/** Portado de digest(): el expediente completo en texto plano para el prompt. */
function digest(D: Expediente): string {
  const L: string[] = [
    `PACIENTE: Antonio Velázquez Rocha, 61 años, masculino. Expediente del 6 ago 2025 al ${fmtD(D.hoy)}.`,
    'PROBLEMAS ACTIVOS: cardiopatía isquémica crónica con enfermedad microvascular (coronariografía 10-ene-2026: arterias epicárdicas SIN lesiones, ectasia Markis I, flujo lento pancoronario); IC recuperada (FEVI 22%→48%); TV polimórfica no sostenida y FV durante el cateterismo; trombocitopenia crónica conocida desde hace ~10 años; hepatopatía crónica con HIPERTENSIÓN PORTAL confirmada por TC feb-2026; adenomegalias mediastinales calcificadas sugestivas de infección granulomatosa (a considerar micobacterias); DM2; HAS; post hernioplastia inguinal bilateral abr-2026.',
    '\nSERIES DE LABORATORIO (fecha=valor; ref entre corchetes):',
  ];
  Object.keys(D.labs).forEach((n) => {
    const S = D.labs[n];
    if (!S.puntos.length) return;
    L.push(`- ${n} [${S.ref ? `${nf(S.ref[0])}–${nf(S.ref[1])}` : 'sin ref'} ${U(n)}]: ${S.puntos.map((p) => `${p.f}=${nf(p.v)}`).join(', ')}`);
  });

  const uc = D.presion.filter((r) => r.src === 'casa').map((r) => r.f).sort();
  const psx = pamStats(D);
  L.push(
    `\nSIGNOS: registro casero del ${uc[0]} al ${uc[uc.length - 1]} (${psx.n} tomas en ${psx.dias} días, varias por día). ` +
      `Huecos sin registro: ${(D.huecos || []).map((g) => `${g.desde} a ${g.hasta} (${g.dias} d)`).join('; ') || 'ninguno mayor a 2 días'}` +
      `. Después solo hay signos tomados en consulta. NO hay registro casero posterior al ${uc[uc.length - 1]}.`,
  );
  L.push(`- Presión sistólica (promedio de las tomas matutinas de cada día): ${serie(D, 'Presión arterial').map((p) => `${p.f}=${Math.round(p.v)}`).join(', ')}`);
  L.push(`- PAM (promedio de TODAS las tomas de cada día; umbral de perfusión 65 mmHg): ${serie(D, 'PAM').map((p) => `${p.f}=${Math.round(p.v)}`).join(', ')}`);
  L.push(`- PAM: ${psx.bajas} de ${psx.n} tomas (${psx.pct}%) por debajo de 65 mmHg, en ${psx.dbajos} de ${psx.dias} días con registro. Mínimo ${psx.min} mmHg.`);
  L.push(`- Pulso: ${serie(D, 'Pulso en reposo').map((p) => `${p.f}=${Math.round(p.v)}`).join(', ')}`);
  L.push(`- Glucosa capilar casera (NO usar como serie de laboratorio; la glucosa de laboratorio está arriba): ${D.glucosa.map((p) => `${p.f}=${nf(p.v)}`).join(', ')}`);
  L.push(`\nPESO (kg): ${D.peso.map((p) => `${p.f}=${nf(p.v)}`).join(', ')}`);
  L.push(`\nFEVI (%): ${D.fevi.map((p) => `${p.fecha}=${p.valor} (${p.fuente})`).join(', ')}`);
  L.push('\nMEDICAMENTOS (fármaco | dosis | inicio | fin | fuente | confianza):');
  D.meds.forEach((m) => L.push(`- ${m.farmaco} | ${m.dosis} | ${m.inicio} | ${m.fin || 'sin fecha de fin'} | ${m.fuente} | ${m.confianza}`));
  L.push('\nDOSIS OBJETIVO DE REFERENCIA (no son indicación):');
  D.gdmt.forEach((g) => L.push(`- ${g.farmaco}: actual ${g.actual}, objetivo ${g.objetivo}${g.pct !== null ? ` (${g.pct}%)` : ' (no calculable)'}${g.nota ? `. ${g.nota}` : ''}`));
  L.push('\nEVENTOS:');
  D.eventos.forEach((e) => L.push(`- ${e.fecha}: ${e.titulo} — ${e.detalle} [${e.fuente}]`));
  L.push('\nESTUDIOS E INFORMES:');
  D.estudios.forEach((s) => L.push(`- ${s.f} ${s.t}: ${s.hall.join(' ')} CONCLUSIÓN: ${s.concl} [${s.src}]`));
  L.push('\nECG:');
  D.ecg.forEach((e) => L.push(`- ${e.f}: ${e.txt}`));
  L.push('\nANTECEDENTES:');
  Object.entries(D.antecedentes).forEach(([g, items]) => items.forEach((a) => L.push(`- [${g}] ${a}`)));
  L.push('\nCONTRADICCIONES ENTRE DOCUMENTOS (no resueltas):');
  D.conflictos.forEach((c) => L.push(`- ${c.t}: A) ${c.a} B) ${c.b} — ${c.n}`));
  L.push(`\nRIESGO QUIRÚRGICO calculado por cardiología el ${D.riesgo.f}: ${D.riesgo.scores.map((x) => `${x.n} ${x.v} (${x.i})`).join('; ')}`);
  L.push('\nPATRONES IDENTIFICADOS (con la literatura localizada para cada uno; los textos completos NO se leyeron):');
  D.patrones.forEach((p) => L.push(`- ${p.t} | datos: ${p.datos.join(' ')} | pregunta: ${p.q} | referencias: ${p.refs.map((r) => `${r.c} (${r.id})`).join(' ; ')} | NO establece: ${p.no}`));

  return L.join('\n');
}

/** El mensaje "system" completo: reglas + expediente. */
export function construirSistemaChat(D: Expediente): string {
  return REGLAS + digest(D);
}

import type { Expediente, Referencia } from '@/types/expediente';
import { pamStats } from '@/utils/expediente.utils';

export type CasoPublicable = {
  t: string;
  obs: string[];
  hip: string;
  falta: string[];
  no: string;
  tipo: string;
  refs: Referencia[];
};

// Portado de "const casos" dentro de M_publicar(). Contenido editorial fijo
// (como las descripciones de SISTEMAS en bienvenida): no sale de Supabase.
export const CASOS_PUBLICABLES: CasoPublicable[] = [
  {
    t: 'Hipotensión sostenida detectada solo por el registro domiciliario',
    obs: [
      // el primer renglón se recalcula en tiempo real; ver calcularCasosPublicables()
      '',
      'Por mes, la proporción bajo 65 va de 6% en agosto de 2025 a 66% en septiembre, y baja a 0% en agosto y septiembre de 2026.',
      'Ninguna nota clínica del expediente menciona hipotensión sintomática ni asintomática en ese periodo. Los signos tomados en consulta (cuatro registros) caen todos por arriba del umbral.',
    ],
    hip: 'En un paciente con insuficiencia cardiaca e hipertensión portal, la titulación de sacubitrilo/valsartán y vericiguat produjo hipotensión sostenida que la medición en consultorio no captó, porque las tomas de consulta caen sistemáticamente en el extremo alto de la distribución del paciente.',
    falta: [
      'Confirmar que las tomas de consulta y las de casa se hicieron con aparatos comparables y validados.',
      'Documentar si hubo síntomas —mareo, caídas, astenia— en ese periodo.',
      'Contrastar con un MAPA de 24 horas, que es el estándar contra el que se valida la automedición.',
    ],
    no: 'No establece que la titulación causara la hipotensión, ni que la hipotensión tuviera consecuencias clínicas. Es un caso: n = 1, sin control y sin desenlace medido.',
    tipo: 'Reporte de caso con serie temporal de automedición, o carta al editor sobre monitorización domiciliaria durante la titulación.',
    refs: [
      { c: '«Telemonitored standardized titration for heart failure with reduced ejection fraction, an open clinical cohort study», 2025.', id: 'PMID 40984989' },
      { c: '«Sacubitril/Valsartan-Related Hypotension in Patients With Heart Failure and Preserved or Mildly Reduced Ejection Fraction». JACC, 2024.', id: 'DOI 10.1016/j.jacc.2024.02.035' },
      { c: 'Møller S, Bendtsen F. «The pathophysiology of arterial vasodilatation and hyperdynamic circulation in cirrhosis». Liver International, 2018.', id: 'DOI 10.1111/liv.13589' },
    ],
  },
  {
    t: 'Recuperación de la fracción de eyección con dosis muy por debajo de las de guía',
    obs: [
      'La FEVI documentada pasa de 22% (9 ago 2025) a 48% (22 dic 2025), y está en 43% en enero de 2026.',
      'En ese mismo periodo el betabloqueador está en 3.125 mg/día de carvedilol, alrededor del 6% de la dosis objetivo de la clase, y el sacubitrilo/valsartán en 50 mg cada 12 horas, alrededor del 26%.',
      'El expediente documenta rehabilitación cardiaca con progresión de 7.3 a 8.88 METS entre noviembre y diciembre de 2025.',
    ],
    hip: 'La recuperación ventricular ocurrió con una exposición farmacológica muy inferior a la de guía, en un paciente cuya limitación para titular es la presión arterial. Vale preguntar si el fenotipo —enfermedad microvascular con ectasia y flujo lento, sin obstrucción epicárdica— responde distinto que la miocardiopatía dilatada en la que se calibraron las dosis objetivo.',
    falta: [
      'Descartar que la FEVI inicial estuviera subestimada por aturdimiento o por condiciones de carga en el estudio de agosto.',
      'Reunir las mediciones de FEVI con el mismo método y operador; las cinco de la serie vienen de cuatro estudios distintos.',
      'Registrar la exposición acumulada real, no la dosis nominal.',
    ],
    no: 'No sugiere que las dosis bajas sean suficientes ni recomendables. La literatura de dosis objetivo está construida sobre desenlaces duros en poblaciones grandes; un caso no la contradice.',
    tipo: 'Reporte de caso sobre recuperación de FEVI en enfermedad microvascular, o material para una serie de casos si el servicio reúne varios.',
    refs: [
      { c: '«Predictors of left ventricular ejection fraction recovery after guideline-directed medical therapy in patients with newly diagnosed dilated cardiomyopathy and baseline LVEF ≤35%», 2025.', id: 'PMID 42368855' },
      { c: '«Newly diagnosed heart failure with reduced ejection fraction: timing, sequencing, and titration of guideline-recommended medical therapy». European Heart Journal, 2025.', id: 'academic.oup.com/eurheartj/article/46/25/2394' },
    ],
  },
  {
    t: 'Decisión antitrombótica sin evidencia directa: ectasia con flujo lento, trombocitopenia y várices',
    obs: [
      'La coronariografía del 10 ene 2026 muestra ectasia Markis I con flujo lento pancoronario y sin lesiones epicárdicas significativas.',
      'Las plaquetas oscilan entre 23 y 121 mil en trece meses, y la nota de abril refiere un nadir de 22 mil en febrero de 2026 con aféresis plaquetaria.',
      'La endoscopia del 28 mar 2026 documenta várice esofágica pequeña y gastropatía hemorrágica.',
      'El ácido acetilsalicílico se indicó el 10 ene como «no suspender por tiempo indefinido» y desaparece de los planes del 25 y 26 de abril, sin documento que lo suspenda ni lo reinicie.',
    ],
    hip: 'Este paciente reúne a la vez una indicación antitrombótica por estasis coronaria y dos contraindicaciones relativas por riesgo de sangrado. Ninguna guía cubre la combinación, y el expediente muestra cómo se resuelve en la práctica: sin decisión escrita.',
    falta: [
      'Establecer qué se decidió realmente sobre la aspirina y con qué razonamiento.',
      'Documentar el episodio de febrero: valor, procedimiento e indicación de la aféresis.',
      'Buscar en la literatura si existen series de ectasia coronaria con trombocitopenia; si no existen, ese vacío es en sí el argumento del artículo.',
    ],
    no: 'No propone una conducta. Describe un vacío de evidencia y una ambigüedad documental; la decisión clínica es del médico tratante.',
    tipo: 'Reporte de caso con dilema terapéutico, del tipo que las revistas publican precisamente porque no hay guía.',
    refs: [
      { c: '«Slow Flow Phenomenon Impairs the Prognosis of Coronary Artery Ectasia as Well as Coronary Atherosclerosis». Brazilian Journal of Cardiovascular Surgery, 2021.', id: 'PMC8357380' },
      { c: '«Prognostic significance, angiographic characteristics and impact of antithrombotic and anticoagulant therapy on outcomes in high versus low grade coronary artery ectasia», 2019.', id: 'PMID 30393992' },
      { c: '«Platelet count threshold for hemorrhage in patients with immune thrombocytopenia treated with antiplatelet agents». Blood, 2023;142(12):1099.', id: 'ashpublications.org/blood/article/142/12/1099' },
    ],
  },
];

/** CASOS_PUBLICABLES con el primer renglón del primer caso recalculado del expediente real. */
export function calcularCasosPublicables(D: Expediente): CasoPublicable[] {
  const ps = pamStats(D);
  const [primero, ...resto] = CASOS_PUBLICABLES;
  const recalculado: CasoPublicable = {
    ...primero,
    obs: [
      `El registro de casa acumula ${ps.n} tomas en ${ps.dias} días. ${ps.bajas} (${ps.pct}%) están por debajo de una PAM de 65 mmHg, con un mínimo de ${ps.min} mmHg.`,
      ...primero.obs.slice(1),
    ],
  };
  return [recalculado, ...resto];
}

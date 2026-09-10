// El laboratorio no manda una columna de categoría: manda un nombre de panel
// en texto libre (columna `panel`, ej. "PB35 - QUIMICA DE 35 ELEMENTOS").
// Esta tabla lo traduce a una etiqueta legible y a un orden de despliegue
// estable. Confirmado contra datos/labs_raw.csv: cada regla se validó viendo
// qué analitos trae ese panel en los datos reales (ej. "RIESGO
// CARDIOVASCULAR" son puros lípidos: Colesterol, HDL, LDL, Triglicéridos).
const REGLAS: Array<{ prueba: RegExp; categoria: string }> = [
  { prueba: /BIOMETRIA HEMATICA|FROTIS/i, categoria: 'Biometría hemática' },
  { prueba: /QUIMICA/i, categoria: 'Química sanguínea' },
  { prueba: /HEPATIC/i, categoria: 'Perfil hepático' },
  { prueba: /RIESGO CARDIOVASCULAR/i, categoria: 'Perfil de lípidos' },
  { prueba: /FUNCI[OÓ]N RENAL|CREATININA EN ORINA/i, categoria: 'Función renal' },
  { prueba: /TIROIDE/i, categoria: 'Perfil tiroideo' },
  { prueba: /HIERRO/i, categoria: 'Metabolismo de hierro' },
  { prueba: /GLICOSILADA|HOMA/i, categoria: 'Control glucémico' },
  { prueba: /PRO ?BNP|TROPONINA/i, categoria: 'Cardíaco' },
  { prueba: /^TPOS|TP Y TPT|COAGULA/i, categoria: 'Coagulación' },
  { prueba: /PROTEINA C REACTIVA|SEDIMENTACION/i, categoria: 'Inflamación' },
  { prueba: /EXAMEN GENERAL DE ORINA/i, categoria: 'Examen general de orina' },
  { prueba: /CITOMEGALOVIRUS|PANEL VIRAL/i, categoria: 'Serología viral' },
  { prueba: /ANTI-DNA|ANTI-NUCLEARES|FOSFOLIPIDOS/i, categoria: 'Autoinmunidad' },
  { prueba: /HECES|\(FIT\)/i, categoria: 'Sangre oculta en heces' },
];

const OTROS_ESTUDIOS = 'Otros estudios';

// Orden de despliegue: primero lo más solicitado/clínicamente relevante para
// cardiología, el resto en el orden en que aparecen las reglas, "Otros" al final.
const ORDEN = [...new Set(REGLAS.map((r) => r.categoria)), OTROS_ESTUDIOS];

// Un símbolo por categoría, para el resumen visual de cada tarjeta de
// estudio (qué paneles trae, de un vistazo) y los chips de filtro.
const ICONOS: Record<string, string> = {
  'Biometría hemática': '⊚',
  'Química sanguínea': '◆',
  'Perfil hepático': '▲',
  'Perfil de lípidos': '◇',
  'Función renal': '□',
  'Perfil tiroideo': '◈',
  'Metabolismo de hierro': '●',
  'Control glucémico': '◐',
  'Cardíaco': '♥',
  Coagulación: '✦',
  Inflamación: '✱',
  'Examen general de orina': '○',
  'Serología viral': '◉',
  Autoinmunidad: '△',
  'Sangre oculta en heces': '▽',
  [OTROS_ESTUDIOS]: '·',
};

export function categoriaDe(panel: string): string {
  return REGLAS.find((r) => r.prueba.test(panel))?.categoria ?? OTROS_ESTUDIOS;
}

export function ordenCategoria(categoria: string): number {
  const i = ORDEN.indexOf(categoria);
  return i === -1 ? ORDEN.length : i;
}

export function iconoCategoria(categoria: string): string {
  return ICONOS[categoria] ?? '·';
}

export function ordenarCategorias(categorias: string[]): string[] {
  return [...categorias].sort((a, b) => ordenCategoria(a) - ordenCategoria(b));
}

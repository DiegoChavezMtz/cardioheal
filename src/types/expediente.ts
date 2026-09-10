// Entidades del expediente clínico. El shape espeja 1:1 el `datos.json` del
// proyecto original (ver datos/datos.json y scripts/bundle.py) para que la
// UI portada no tenga que cambiar su lógica de lectura, solo su fuente.

export type LabPunto = { f: string; v: number; src: string };
export type LabSerie = { ref: [number, number] | null; puntos: LabPunto[] };
export type Labs = Record<string, LabSerie>;

export type PresionLectura = {
  f: string;
  h: string;
  m: string;
  s: number;
  d: number;
  p: number | null;
  o: number | null;
  a: number;
  pp: number;
  src: string;
  nota?: string;
};

export type GlucosaLectura = { f: string; v: number };
export type PesoLectura = { f: string; v: number };

export type Medicamento = {
  grupo: string;
  farmaco: string;
  dosis: string;
  inicio: string;
  fin: string | null;
  fuente: string;
  confianza: string;
};

export type Evento = {
  fecha: string;
  titulo: string;
  detalle: string;
  peso: string;
  fuente: string;
};

export type FeviValor = { fecha: string; valor: number; fuente: string };

export type Estudio = {
  f: string;
  t: string;
  cat: string;
  hall: string[];
  concl: string;
  src: string;
};

export type EcgLectura = { f: string; txt: string; src: string };

export type Antecedentes = {
  Personales: string[];
  Familiares: string[];
  'Exposiciones y estilo de vida': string[];
};

export type Conflicto = { t: string; a: string; b: string; n: string };

export type GdmtFila = {
  clase: string;
  farmaco: string;
  actual: string;
  objetivo: string;
  pct: number;
  nota: string;
};

export type RiesgoScore = { n: string; v: string; i: string };
export type Riesgo = { f: string; src: string; scores: RiesgoScore[]; prep: string[] };

export type Referencia = { c: string; id: string };
export type Patron = { t: string; datos: string[]; q: string; refs: Referencia[]; no: string };

export type Hueco = { desde: string; hasta: string; dias: number };
export type NotaCasa = { f: string; h: string; txt: string };
export type LabsNotas = Record<string, Record<string, number>>;
// s/d/p/o/peso pueden venir null: no todas las tomas en consulta registran
// las cinco cosas (ej. peso null el 10-ene-2026 en los datos reales).
export type SignoConsulta = {
  f: string;
  s: number | null;
  d: number | null;
  p: number | null;
  o: number | null;
  peso: number | null;
  src: string;
};
export type ConsultaCardio = { f: string; quien: string; fuente: string };

// El objeto completo que hoy arma scripts/bundle.py y consume consola.html
// como `D`. La versión Next.js lo reconstruye desde Supabase con el mismo
// shape en `expediente.service.ts`.
export type Expediente = {
  labs: Labs;
  presion: PresionLectura[];
  glucosa: GlucosaLectura[];
  peso: PesoLectura[];
  meds: Medicamento[];
  eventos: Evento[];
  fevi: FeviValor[];
  estudios: Estudio[];
  ecg: EcgLectura[];
  antecedentes: Antecedentes;
  conflictos: Conflicto[];
  gdmt: GdmtFila[];
  riesgo: Riesgo;
  patrones: Patron[];
  lit_nota: string;
  hoy: string;
  signos_consulta: SignoConsulta[];
  huecos: Hueco[];
  notas_casa: NotaCasa[];
  labs_notas: LabsNotas;
  consulta_cardio: ConsultaCardio;
};

// Lo que escribe el paso "Confirmar y agregar" de Actualizar. Sin campos de
// auditoría (decisión: esta versión no rastrea quién ni cuándo confirma).
export type NuevoValorConfirmado = {
  marcador: string;
  fecha: string | null;
  valor: number;
  unidad: string;
  origen: string;
};

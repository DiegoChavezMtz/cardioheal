import type { Expediente } from '@/types/expediente';

// Cálculos puros sobre el expediente, portados de la sección `(function(){...})()`
// de app/consola.html (proyecto original, líneas ~700-775). Se comparten
// entre features (bienvenida hoy; consulta y línea de tiempo los van a
// reusar) — por eso viven en src/utils/ y no dentro de una sola feature.

export const MS = 864e5;
export const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const day = (f: string) => new Date(f + 'T12:00:00Z').getTime();

export const fmtD = (f: string) => {
  const d = new Date(f + 'T12:00:00Z');
  return `${d.getUTCDate()} ${MES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const fmtS = (f: string) => {
  const d = new Date(f + 'T12:00:00Z');
  return `${d.getUTCDate()} ${MES[d.getUTCMonth()]}`;
};

/** Días transcurridos entre `f` y la fecha de corte del expediente (D.hoy). */
export const ago = (D: Expediente, f: string) => Math.round((day(D.hoy) - day(f)) / MS);

export const pam = (s: number, d: number) => Math.round((s + 2 * d) / 3);

export const nf = (v: number) => {
  const s = Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
  return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, '');
};

const UNITS: Record<string, string> = {
  Plaquetas: 'mil/µL', Leucocitos: 'mil/µL', 'Linfocitos absolutos': 'mil/µL', 'Neutrófilos absolutos': 'mil/µL',
  Hemoglobina: 'g/dL', Hematocrito: '%', GGT: 'U/L', 'Fosfatasa alcalina': 'U/L', 'ALT (TGP)': 'U/L', 'AST (TGO)': 'U/L',
  LDH: 'U/L', 'Bilirrubina total': 'mg/dL', 'Bilirrubina directa': 'mg/dL', Albúmina: 'g/dL', Globulinas: 'g/dL',
  Glucosa: 'mg/dL', Creatinina: 'mg/dL', HbA1c: '%', Urea: 'mg/dL', 'NT-proBNP / BNP': 'pg/mL',
  'VPM (volumen plaquetario)': 'fL', 'Colesterol total': 'mg/dL', Triglicéridos: 'mg/dL', 'TFG estimada': 'mL/min',
  INR: '', VCM: 'fL', RDW: '%', Potasio: 'mmol/L', Sodio: 'mmol/L', Magnesio: 'mg/dL', Calcio: 'mg/dL',
  'Troponina I': 'ng/mL', 'CK total': 'U/L', 'CK-MB': 'U/L',
  PAM: 'mmHg', 'Presión arterial': 'mmHg', 'Pulso en reposo': 'lpm', Peso: 'kg', FEVI: '%',
};
export const U = (n: string) => UNITS[n] ?? '';

export const REF_EXTRA: Record<string, [number, number]> = {
  'Presión arterial': [90, 130], PAM: [65, 100], 'Pulso en reposo': [50, 80], FEVI: [50, 75],
};

export type PuntoSerie = { f: string; v: number };

/** Misma resolución de "qué serie es esta" que el `serie()` original. */
export function serie(D: Expediente, name: string): PuntoSerie[] {
  if (D.labs[name]) return D.labs[name].puntos.map((p) => ({ f: p.f, v: p.v }));
  if (name === 'Peso') return D.peso.map((p) => ({ f: p.f, v: p.v }));
  if (name === 'FEVI') return D.fevi.map((p) => ({ f: p.fecha, v: p.valor }));
  if (name === 'PAM') {
    const by: Record<string, number[]> = {};
    D.presion.filter((r) => r.a).forEach((r) => { (by[r.f] ??= []).push(r.a); });
    return Object.keys(by).sort().map((f) => ({ f, v: by[f].reduce((a, b) => a + b, 0) / by[f].length }));
  }
  const key = name === 'Pulso en reposo' ? 'p' : name === 'Presión arterial' ? 's' : null;
  if (key) {
    const by: Record<string, number[]> = {};
    D.presion
      .filter((r) => (r.m === 'mañana' || r.src === 'consulta') && r[key as 'p' | 's'])
      .forEach((r) => { (by[r.f] ??= []).push(r[key as 'p' | 's'] as number); });
    return Object.keys(by).sort().map((f) => ({ f, v: by[f].reduce((a, b) => a + b, 0) / by[f].length }));
  }
  return [];
}

export const refOf = (D: Expediente, n: string): [number, number] | null =>
  D.labs[n]?.ref ?? REF_EXTRA[n] ?? null;

export const ultimo = (D: Expediente, n: string): PuntoSerie | null => {
  const s = serie(D, n);
  return s.length ? s[s.length - 1] : null;
};

const PAM_UMBRAL = 65;

/** Fármacos con intervalo abierto en la fecha f (o hasta T_MAX si sigue vigente). */
export function activeMeds(D: Expediente, f: string, tMax?: number) {
  const t = day(f);
  const limite = tMax ?? Math.max(day(D.hoy), ...D.presion.map((r) => day(r.f)), ...D.peso.map((r) => day(r.f)));
  return D.meds.filter((m) => day(m.inicio) <= t && (m.fin ? day(m.fin) >= t : t <= limite));
}

/**
 * Corta una serie en tramos donde el hueco entre dos mediciones consecutivas
 * es desproporcionado (más de 4x la mediana de los huecos, o 21 días),
 * para no dibujar una línea recta donde no hay datos.
 */
export function tramos<T extends PuntoSerie>(S: T[]): T[][] {
  if (S.length < 3) return [S];
  const gaps = S.slice(1).map((p, i) => day(p.f) - day(S[i].f));
  const med = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] || MS;
  const lim = Math.max(med * 4, 21 * MS);
  const T: T[][] = [[S[0]]];
  for (let i = 1; i < S.length; i++) {
    if (day(S[i].f) - day(S[i - 1].f) > lim) T.push([]);
    T[T.length - 1].push(S[i]);
  }
  return T;
}

export function pamStats(D: Expediente, desde?: string) {
  const R = D.presion.filter((r) => r.a && r.src === 'casa' && (!desde || r.f >= desde));
  const bajas = R.filter((r) => r.a < PAM_UMBRAL).length;
  const dias: Record<string, number> = {};
  R.forEach((r) => { dias[r.f] = Math.min(dias[r.f] ?? 999, r.a); });
  const df = Object.keys(dias);
  const dbajos = df.filter((f) => dias[f] < PAM_UMBRAL).length;
  return {
    n: R.length,
    bajas,
    pct: R.length ? Math.round((100 * bajas) / R.length) : 0,
    dias: df.length,
    dbajos,
    min: R.length ? Math.min(...R.map((r) => r.a)) : null,
  };
}

// Series de "signos vitales" (no vienen de D.labs, serie() las arma con
// nombres especiales — ver serie() arriba). Se comparte entre línea de
// tiempo (picker de marcadores) y el modal de detalle (navegación
// anterior/siguiente).
export const BUILTIN = ['Presión arterial', 'PAM', 'Pulso en reposo', 'Peso', 'FEVI'];

/** Portado de allVars(): todo lo que puede graficarse, vitales + labs con más de un punto. */
export function todosLosMarcadores(D: Expediente): string[] {
  return [...BUILTIN, ...Object.keys(D.labs).filter((n) => D.labs[n].puntos.length > 1).sort()];
}

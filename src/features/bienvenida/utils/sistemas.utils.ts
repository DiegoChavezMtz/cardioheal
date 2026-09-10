import type { Expediente } from '@/types/expediente';
import { day, fmtD, nf, pamStats, ultimo } from '@/utils/expediente.utils';
import type { PuntoCuerpo } from './cuerpoGeometria.utils';

export type FilaNums = [valor: string, etiqueta: string, malo: boolean];
export type Desde = { t: string; d: string; ok: boolean } | null;

export type Sistema = {
  k: string;
  n: string;
  col: string;
  pos: [number, number, number];
  r: [number, number, number];
  nn: number;
  latido?: boolean;
  estado: string;
  fuente: string;
  nuevo: (D: Expediente) => Desde;
  nums: (D: Expediente) => FilaNums[];
};

/**
 * El cambio más grande, en proporción, entre el último valor previo a la
 * consulta de cardiología y el más reciente disponible. Portado de
 * cambioDesdeConsulta() en el consola.html original.
 */
function cambioDesdeConsulta(D: Expediente, marcadores: string[]) {
  const C = D.consulta_cardio;
  if (!C?.f) return null;
  const t0 = day(C.f);
  type Mejor = { n: string; antes: { f: string; v: number }; hoy: { f: string; v: number }; dpc: number; ref: [number, number] | null };
  const candidatos: Mejor[] = [];
  for (const n of marcadores) {
    const S = D.labs[n];
    if (!S || !S.puntos.length) continue;
    const antes = S.puntos.filter((p) => day(p.f) <= t0).pop();
    const hoy = S.puntos[S.puntos.length - 1];
    if (!antes || !hoy || day(hoy.f) <= t0 || !antes.v) continue;
    const dpc = ((hoy.v - antes.v) / Math.abs(antes.v)) * 100;
    candidatos.push({ n, antes, hoy, dpc, ref: S.ref });
  }
  if (!candidatos.length) return null;
  const b = candidatos.reduce((a, c) => (Math.abs(c.dpc) > Math.abs(a.dpc) ? c : a));
  const fuera = !!b.ref && (b.hoy.v < b.ref[0] || b.hoy.v > b.ref[1]);
  return {
    txt: `${b.n} ${b.dpc > 0 ? 'subió' : 'bajó'} de ${nf(b.antes.v)} a ${nf(b.hoy.v)}`,
    fuera,
    pct: Math.round(b.dpc),
  };
}

// Los 3 sistemas del caso, con su posición sobre el cuerpo esquemático y su
// texto clínico. Este texto es contenido editorial fijo (igual que en el
// original), no un dato de Supabase: solo las cifras de nums()/nuevo() salen
// del expediente.
export const SISTEMAS: Sistema[] = [
  {
    k: 'cardio', n: 'Cardiología', col: '#e23a3a', pos: [-0.03, 1.29, 0.05], r: [0.075, 0.085, 0.06], nn: 130, latido: true,
    estado:
      'Cardiopatía isquémica crónica con enfermedad microvascular: coronarias sin lesiones epicárdicas, ectasia Markis I y flujo lento. FEVI 43% (19 ene 2026), clase funcional I, 8 fármacos vigentes.',
    fuente: 'coronariografía 10 ene 2026 · ecocardioscopia 19 ene 2026 · plan de egreso 26 abr 2026',
    nuevo: (D) => {
      const C = D.consulta_cardio;
      if (!C?.f) return null;
      const post = D.presion.filter((r) => r.src === 'casa' && r.f > C.f);
      const pre = D.presion.filter((r) => r.src === 'casa' && r.f <= C.f && r.f > '2026-04-01');
      if (!post.length) return null;
      const bp = post.filter((r) => r.a < 65).length;
      const bpre = pre.filter((r) => r.a < 65).length;
      return {
        t: 'La presión dejó de caer bajo el umbral de perfusión',
        d:
          `${Math.round((100 * bp) / post.length)}% de las ${post.length} tomas caseras posteriores a la consulta están bajo PAM 65` +
          (pre.length ? `, contra ${Math.round((100 * bpre) / pre.length)}% en las ${pre.length} tomas de las semanas previas` : '') +
          `. Media actual ${Math.round(post.reduce((a, r) => a + r.a, 0) / post.length)} mmHg.`,
        ok: bp / post.length < 0.15,
      };
    },
    nums: (D) => {
      const f = D.fevi[D.fevi.length - 1];
      const ps = pamStats(D);
      const fc = ultimo(D, 'Pulso en reposo');
      const gd = D.gdmt.filter((g) => g.pct !== null);
      const bajo = gd.length ? gd.reduce((a, g) => (a.pct < g.pct ? a : g)) : null;
      const filas: FilaNums[] = [];
      if (f) filas.push([`${f.valor}%`, `FEVI · ${fmtD(f.fecha)}`, f.valor < 40]);
      filas.push([`${ps.pct}%`, 'de las tomas con PAM bajo 65 mmHg', ps.pct >= 15]);
      if (fc) filas.push([`${Math.round(fc.v)} lpm`, 'FC en reposo', fc.v > 90]);
      filas.push([bajo ? `${bajo.pct}%` : '—', bajo ? `${bajo.farmaco} respecto a la dosis objetivo` : 'terapia de guías', !!bajo && bajo.pct < 25]);
      return filas;
    },
  },
  {
    k: 'hema', n: 'Hematología', col: '#3b8ef5', pos: [-0.105, 1.1, -0.01], r: [0.055, 0.065, 0.045], nn: 110,
    estado:
      'Trombocitopenia crónica de alrededor de diez años, ahora sobre hipertensión portal confirmada. El ácido acetilsalicílico no aparece en los planes desde abril y ningún documento lo suspende ni lo reinicia.',
    fuente: 'nota de hematología 22 ene 2026 · TC feb 2026 · planes de 25 y 26 abr 2026',
    nuevo: (D) => {
      const c = cambioDesdeConsulta(D, ['Plaquetas', 'Leucocitos', 'Linfocitos absolutos', 'Hemoglobina']);
      return c ? { t: 'El cambio más grande desde la consulta', d: `${c.txt}.`, ok: !c.fuera } : null;
    },
    nums: (D) => {
      const p = ultimo(D, 'Plaquetas');
      const S = D.labs['Plaquetas']?.puntos ?? [];
      const mn = S.length ? Math.min(...S.map((x) => x.v)) : null;
      const l = ultimo(D, 'Leucocitos');
      const la = ultimo(D, 'Linfocitos absolutos');
      const filas: FilaNums[] = [];
      if (p) filas.push([nf(p.v), `plaquetas mil/µL`, p.v < 150]);
      if (mn != null) filas.push([nf(mn), 'mínimo de la serie', true]);
      if (l) filas.push([nf(l.v), 'leucocitos mil/µL', l.v < 4]);
      if (la) filas.push([nf(la.v), 'linfocitos absolutos mil/µL', la.v < 1]);
      return filas;
    },
  },
  {
    k: 'hepato', n: 'Hepatología', col: '#33bda3', pos: [0.105, 1.09, 0.04], r: [0.085, 0.058, 0.055], nn: 110,
    estado:
      'Hepatopatía crónica con fibrosis F3 de Metavir y Child-Pugh A, con várice esofágica pequeña y gastropatía hemorrágica. Patrón colestásico sostenido en toda la serie.',
    fuente: 'fibroscan · endoscopia 28 mar 2026 · TC 24 abr 2026',
    nuevo: (D) => {
      const c = cambioDesdeConsulta(D, ['GGT', 'Fosfatasa alcalina', 'ALT (TGP)', 'AST (TGO)', 'Bilirrubina total']);
      return c ? { t: 'El cambio más grande desde la consulta', d: `${c.txt}.`, ok: !c.fuera } : null;
    },
    nums: (D) => {
      const g = ultimo(D, 'GGT');
      const fa = ultimo(D, 'Fosfatasa alcalina');
      const bt = ultimo(D, 'Bilirrubina total');
      const al = ultimo(D, 'Albúmina');
      const S = D.labs['GGT']?.puntos ?? [];
      const ref = D.labs['GGT']?.ref;
      const fuera = ref ? S.filter((x) => x.v > ref[1]).length : 0;
      const filas: FilaNums[] = [];
      if (g) filas.push([nf(g.v), `GGT U/L · fuera de rango en ${fuera} de ${S.length}`, true]);
      if (fa) filas.push([nf(fa.v), 'fosfatasa alcalina U/L', fa.v > 111]);
      if (bt) filas.push([nf(bt.v), 'bilirrubina total mg/dL', bt.v > 1.2]);
      if (al) filas.push([nf(al.v), 'albúmina g/dL', al.v < 3.5]);
      return filas;
    },
  },
];

/** Puntos extra de la nube concentrados en la posición de cada sistema. */
export function generarPuntosSistemas(): PuntoCuerpo[] {
  const pts: PuntoCuerpo[] = [];
  SISTEMAS.forEach((s, i) => {
    for (let j = 0; j < s.nn; j++) {
      const u = Math.acos(2 * Math.random() - 1);
      const v = Math.random() * Math.PI * 2;
      const q = Math.cbrt(Math.random());
      pts.push([
        s.pos[0] + s.r[0] * q * Math.sin(u) * Math.cos(v),
        s.pos[1] + s.r[1] * q * Math.cos(u),
        s.pos[2] + s.r[2] * q * Math.sin(u) * Math.sin(v),
        i + 1,
      ]);
    }
  });
  return pts;
}

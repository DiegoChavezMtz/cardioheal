import type { Expediente } from '@/types/expediente';
import { fmtD, nf, U } from '@/utils/expediente.utils';

// Portado de const EXTRACT en app/consola.html original.
export const EXTRACT_PROMPT = [
  'Lee este resultado de laboratorio y devuelve SOLO JSON, sin texto alrededor.',
  'Formato: {"fecha":"YYYY-MM-DD"|null,"laboratorio":string|null,"valores":[{"marcador":string,"valor":number,"unidad":string,"ref":string|null}]}',
  'Usa exactamente los nombres de marcador que veas. No inventes valores. Si no distingues la fecha, pon null.',
  'Si no es un resultado de laboratorio, devuelve {"valores":[]}.',
].join('\n');

type ValorLeido = { marcador: string; valor: number; unidad?: string; ref?: string | null };
type RespuestaExtraccion = { fecha: string | null; laboratorio: string | null; valores: ValorLeido[] };

/** Quita los ```json ... ``` con los que algunos modelos envuelven el JSON, si los hay. */
function limpiarBloqueCodigo(texto: string): string {
  const m = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (m ? m[1] : texto).trim();
}

/** Parseo defensivo de la respuesta del modelo — nunca confía en su forma. */
export function parsearRespuestaExtraccion(texto: string): RespuestaExtraccion | null {
  let data: unknown;
  try {
    data = JSON.parse(limpiarBloqueCodigo(texto));
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const valoresRaw = Array.isArray(d.valores) ? d.valores : [];
  const valores: ValorLeido[] = valoresRaw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
    .filter((v) => typeof v.marcador === 'string' && typeof v.valor === 'number')
    .map((v) => ({
      marcador: v.marcador as string,
      valor: v.valor as number,
      unidad: typeof v.unidad === 'string' ? v.unidad : undefined,
      ref: typeof v.ref === 'string' ? v.ref : null,
    }));
  return { fecha: typeof d.fecha === 'string' ? d.fecha : null, laboratorio: typeof d.laboratorio === 'string' ? d.laboratorio : null, valores };
}

/** Portado del texto "why" dentro de pintaProps(): compara contra lo que ya hay en el expediente. */
export function calcularWhy(D: Expediente, marcador: string, fecha: string | null, valor: number): string {
  const S = D.labs[marcador];
  if (!S || !S.puntos.length) return 'Marcador nuevo para el expediente.';
  const last = S.puntos[S.puntos.length - 1];
  const conflicto = fecha ? S.puntos.find((x) => x.f === fecha) : undefined;
  if (conflicto) {
    return `⚠ Ya hay un valor de ${marcador} el ${fmtD(fecha as string)}: ${nf(conflicto.v)}. Este dice ${nf(valor)}. No se sobrescribe nada.`;
  }
  return `Último registrado: ${nf(last.v)} ${U(marcador)} el ${fmtD(last.f)}.`;
}

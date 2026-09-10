'use server';

import { expedienteService } from '@/services/expediente.service';
import type { NuevaObservacion, NuevoSignoConsulta, NuevoTratamiento } from '@/types/expediente';

export type ResultadoRegistro = { ok: true } | { error: string };

/**
 * Server Actions de "Registrar en consulta" — captura estructurada en vivo
 * (signos, observación, tratamiento). Vive en src/services/ y no dentro de
 * una feature porque el organismo que las invoca (RegistroConsulta) es
 * compartido: aparece en el encabezado de toda la app, no en una sola vista.
 */
export async function registrarSignosHoy(input: NuevoSignoConsulta): Promise<ResultadoRegistro> {
  try {
    await expedienteService.registrarSignos(input);
    return { ok: true };
  } catch {
    return { error: 'No se pudieron guardar los signos. Intenta de nuevo.' };
  }
}

export async function registrarObservacionConsulta(input: NuevaObservacion): Promise<ResultadoRegistro> {
  try {
    await expedienteService.registrarObservacion(input);
    return { ok: true };
  } catch {
    return { error: 'No se pudo guardar la observación. Intenta de nuevo.' };
  }
}

export async function registrarTratamientoConsulta(input: NuevoTratamiento): Promise<ResultadoRegistro> {
  try {
    await expedienteService.registrarTratamiento(input);
    return { ok: true };
  } catch {
    return { error: 'No se pudo guardar el cambio de tratamiento. Intenta de nuevo.' };
  }
}

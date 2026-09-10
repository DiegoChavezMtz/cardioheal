'use server';

import { minimaxChat } from '@/lib/minimax';
import { expedienteService } from '@/services/expediente.service';
import { calcularWhy, EXTRACT_PROMPT, parsearRespuestaExtraccion } from '../utils/extraccion.utils';
import type { Propuesta, ResultadoConfirmar, ResultadoExtraccion } from '../types';

/**
 * Portado de extraer()/handleFile() en app/consola.html original — solo la
 * ruta de texto: MiniMax en este plan no tiene visión, así que la opción de
 * foto se retiró (ver PasoUno, que lo explica en pantalla) en vez de
 * simularla o fallar en silencio.
 */
export async function extraerDeTexto(texto: string): Promise<ResultadoExtraccion> {
  const limpio = texto.trim();
  if (!limpio) return { error: 'Pega primero el texto.' };

  let respuesta: string;
  try {
    respuesta = await minimaxChat([{ role: 'user', content: `${EXTRACT_PROMPT}\n\nTEXTO:\n${limpio}` }]);
  } catch {
    return { error: 'No se pudo leer. Intenta de nuevo.' };
  }

  const datos = parsearRespuestaExtraccion(respuesta);
  if (!datos || !datos.valores.length) return { error: 'No se reconocieron valores de laboratorio.' };

  const expediente = await expedienteService.cargar();
  const propuestas: Propuesta[] = datos.valores.map((v) => ({
    marcador: v.marcador,
    valor: v.valor,
    unidad: v.unidad || '',
    fecha: datos.fecha,
    why: calcularWhy(expediente, v.marcador, datos.fecha, v.valor),
  }));
  return { propuestas };
}

/** Portado del botón "Confirmar y agregar": el único camino por el que un valor entra al expediente. */
export async function confirmarPropuesta(p: Propuesta): Promise<ResultadoConfirmar> {
  try {
    await expedienteService.confirmarValor({ marcador: p.marcador, fecha: p.fecha, valor: p.valor, unidad: p.unidad, origen: 'Actualizar (texto pegado)' });
    return { ok: true };
  } catch {
    return { error: 'No se pudo guardar. Intenta de nuevo.' };
  }
}

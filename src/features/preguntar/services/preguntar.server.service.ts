import 'server-only';
import { minimaxChatStream, type MensajeChat } from '@/lib/minimax';
import { expedienteService } from '@/services/expediente.service';
import { construirSistemaChat } from '../utils/digest.utils';
import type { Turno } from '../types';

const MAX_TURNOS = 8;

/**
 * Arma el mensaje "system" (reglas + expediente fresco de Supabase) y llama
 * a MiniMax en streaming. Vive en la feature (no en app/api directo) para
 * que el Route Handler sea un adaptador delgado — toda la lógica de
 * "cómo se responde una pregunta" queda aquí, no en app/.
 */
export async function responderPregunta(turnos: Turno[]): Promise<ReadableStream<Uint8Array>> {
  const expediente = await expedienteService.cargar();
  const sistema = construirSistemaChat(expediente);
  const recientes = turnos.slice(-MAX_TURNOS);
  const mensajes: MensajeChat[] = [{ role: 'system', content: sistema }, ...recientes];
  return minimaxChatStream(mensajes);
}

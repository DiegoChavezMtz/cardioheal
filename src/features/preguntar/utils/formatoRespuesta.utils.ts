import type { RespuestaFormateada } from '../types';

/**
 * Portado de fmtAnswer(): separa la línea final "Fuente: ..." del resto de
 * la respuesta para mostrarla como cita aparte. A diferencia del original
 * (que insertaba HTML con dangerouslySetInnerHTML-equivalente), esto solo
 * separa el texto — el componente lo renderiza como texto plano, nunca como
 * HTML: la respuesta viene de un modelo de lenguaje, no de datos propios.
 */
export function formatearRespuesta(texto: string): RespuestaFormateada {
  const i = texto.lastIndexOf('Fuente:');
  if (i <= 0) return { cuerpo: texto.trim(), fuente: null };
  return { cuerpo: texto.slice(0, i).trim(), fuente: texto.slice(i).trim() };
}

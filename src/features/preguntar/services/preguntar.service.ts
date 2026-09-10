import type { Turno } from '../types';

export class ErrorPreguntar extends Error {}

/**
 * Llama a /api/preguntar y va entregando el texto conforme llega
 * (equivalente al onText de sample() en el original). Lanza ErrorPreguntar
 * con un mensaje ya listo para mostrar si algo falla.
 */
export const preguntarService = {
  async preguntar(turnos: Turno[], onTexto: (acumulado: string) => void): Promise<string> {
    let res: Response;
    try {
      res = await fetch('/api/preguntar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnos }),
      });
    } catch {
      throw new ErrorPreguntar('No se pudo conectar con el servidor.');
    }

    if (!res.ok || !res.body) {
      const cuerpo = await res.json().catch(() => null);
      throw new ErrorPreguntar(cuerpo?.error || 'No se pudo completar la respuesta.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acumulado = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acumulado += decoder.decode(value, { stream: true });
      onTexto(acumulado);
    }
    return acumulado;
  },
};

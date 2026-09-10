import 'server-only';
import { serverEnv } from './env';

// Cliente mínimo para la API de chat de MiniMax. Formato compatible con
// OpenAI (model, messages:[{role,content}], stream) — verificado contra una
// cuenta real: /text/chatcompletion_v2, respuesta en choices[0].message.content
// (sin streaming) o choices[0].delta.content por chunk (con streaming). El
// modelo probado (MiniMax-M2.7) es "de razonamiento": manda primero varios
// chunks con choices[0].delta.reasoning_content antes de emitir
// choices[0].delta.content — eso ya se ignora correctamente abajo.

export type MensajeChat = { role: 'system' | 'user' | 'assistant'; content: string };

type MiniMaxChunk = {
  choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
};

async function endpoint() {
  const env = serverEnv();
  return { url: `${env.MINIMAX_API_URL}/text/chatcompletion_v2`, env };
}

/** Llamada sin streaming: espera la respuesta completa y regresa el texto. */
export async function minimaxChat(messages: MensajeChat[]): Promise<string> {
  const { url, env } = await endpoint();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({ model: env.MINIMAX_MODEL, messages, stream: false }),
  });
  if (!res.ok) {
    throw new Error(`MiniMax respondió ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as MiniMaxChunk;
  return data.choices?.[0]?.message?.content ?? '';
}

function extraerTexto(payload: string): string | null {
  if (payload === '[DONE]' || !payload) return null;
  try {
    const parsed = JSON.parse(payload) as MiniMaxChunk;
    return parsed.choices?.[0]?.delta?.content || null;
  } catch {
    // línea SSE incompleta (se completa con el siguiente chunk, ver buffer
    // en minimaxChatStream) o de keep-alive: no es un error real.
    return null;
  }
}

/**
 * Llamada con streaming: regresa un ReadableStream<Uint8Array> de texto plano
 * (ya extraído de los chunks SSE), listo para pasar directo como body de un
 * Route Handler.
 *
 * Usa pipeThrough en vez de manejar la lectura a mano (reader.read() dentro
 * de un pull() propio): la primera versión se quedaba colgada a mitad de una
 * respuesta larga con un system prompt grande — el patrón manual nunca
 * volvía a pedir el siguiente pedazo después de cierto punto. pipeThrough dejó
 * de colgarse en la misma prueba (prompt real de ~58 KB, confirmado con el
 * expediente real). De paso corrige que una línea SSE partida entre dos
 * lecturas de red se perdía en vez de completarse (ver `buffer` abajo).
 */
export async function minimaxChatStream(messages: MensajeChat[]): Promise<ReadableStream<Uint8Array>> {
  const { url, env } = await endpoint();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({ model: env.MINIMAX_MODEL, messages, stream: true }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`MiniMax respondió ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const transformador = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lineas = buffer.split('\n');
      buffer = lineas.pop() ?? ''; // último fragmento: puede seguir incompleto, se completa en el próximo chunk
      for (const linea of lineas) {
        const trimmed = linea.trim();
        if (!trimmed.startsWith('data:')) continue;
        const texto = extraerTexto(trimmed.slice(5).trim());
        if (texto) controller.enqueue(encoder.encode(texto));
      }
    },
  });

  return res.body.pipeThrough(transformador);
}

import { responderPregunta } from '@/features/preguntar';
import type { Turno } from '@/features/preguntar';

// Adaptador delgado: valida la forma del body y delega en la feature. Es un
// route.ts (no un Server Action) porque necesita responder en streaming.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { turnos?: unknown } | null;
  const turnos = Array.isArray(body?.turnos) ? (body.turnos as Turno[]) : null;
  if (!turnos || !turnos.length) {
    return Response.json({ error: 'Falta el arreglo "turnos".' }, { status: 400 });
  }

  try {
    const stream = await responderPregunta(turnos);
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'No se pudo completar la respuesta.' }, { status: 502 });
  }
}

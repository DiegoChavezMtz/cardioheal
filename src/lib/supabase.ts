import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from './env';

// Cliente con la service role key: solo se usa desde server components,
// server actions y route handlers. Nunca debe llegar al bundle de cliente
// (el import 'server-only' hace que el build falle si eso pasara).
// Sin `Database` generado (no corremos codegen contra un proyecto real
// todavía — las migraciones se aplican manualmente). Se tipa como `any` a
// propósito para que .from()/.insert() acepten los nombres de tabla y no
// infieran `never`; cada método de expediente.service.ts fija el tipo real
// de fila con `.overrideTypes<...>()` en lectura y con el tipo del parámetro
// de entrada en escritura. Cuando exista un proyecto de Supabase real, correr
// `supabase gen types typescript` y reemplazar este `any` por el tipo generado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ver comentario arriba: sin Database generado todavía
let client: ReturnType<typeof createClient<any>> | null = null;

export function supabase() {
  if (!client) {
    const env = serverEnv();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ver comentario arriba: sin Database generado todavía
    client = createClient<any>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

import { z } from 'zod';

// Variables de entorno del servidor. Nunca importar este archivo desde un
// componente de cliente: usa NEXT_PUBLIC_* aparte si algún día hace falta.
const serverSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MINIMAX_API_KEY: z.string().min(1),
  MINIMAX_API_URL: z.string().url(),
  MINIMAX_MODEL: z.string().min(1),
  APP_PASSWORD: z.string().min(1),
  APP_SESSION_SECRET: z.string().min(1),
});

function loadServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const faltantes = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variables de entorno inválidas o faltantes: ${faltantes}`);
  }
  return parsed.data;
}

// Lazy: se valida la primera vez que algo del servidor la usa, no al importar
// el módulo (evita reventar `next build` o el entorno de pruebas sin todas
// las variables listas).
let cached: ReturnType<typeof loadServerEnv> | null = null;

export function serverEnv() {
  if (!cached) cached = loadServerEnv();
  return cached;
}

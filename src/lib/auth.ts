import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverEnv } from './env';

// Gate de contraseña única compartida (decisión: sin cuentas individuales,
// sin auditoría de quién entra). Una cookie firmada con HMAC guarda solo una
// fecha de expiración; no hay tabla de sesiones ni usuarios en Supabase.

export const SESSION_COOKIE = 'cardioheal_session';
const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

function firmar(payload: string): string {
  const env = serverEnv();
  return createHmac('sha256', env.APP_SESSION_SECRET).update(payload).digest('hex');
}

export function crearTokenSesion(): string {
  const expira = Date.now() + TREINTA_DIAS_MS;
  const payload = String(expira);
  return `${payload}.${firmar(payload)}`;
}

export function tokenSesionValido(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return false;
  const firmaEsperada = firmar(payload);
  const a = Buffer.from(firma);
  const b = Buffer.from(firmaEsperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(payload) > Date.now();
}

export function contraseñaCorrecta(intento: string): boolean {
  const env = serverEnv();
  const a = Buffer.from(intento);
  const b = Buffer.from(env.APP_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

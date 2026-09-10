'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, contraseñaCorrecta, crearTokenSesion } from '@/lib/auth';
import type { EstadoLogin } from '../types';

// Server Action: mutación disparada desde el navegador (el formulario de
// login), sin necesidad de un route.ts — es exactamente el caso que la
// arquitectura reserva para Server Actions.
export async function iniciarSesion(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const intento = String(formData.get('password') ?? '');
  if (!contraseñaCorrecta(intento)) {
    return { error: 'Contraseña incorrecta.' };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, crearTokenSesion(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  const destino = String(formData.get('from') || '/');
  redirect(destino.startsWith('/') ? destino : '/');
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, tokenSesionValido } from '@/lib/auth';

// Gate de contraseña única para todo el expediente. Corre en el runtime de
// Node (default en Next 16), por eso puede usar node:crypto vía @/lib/auth.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (tokenSesionValido(token)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // todo excepto /login, assets de Next y archivos estáticos
    '/((?!login|_next/static|_next/image|favicon.ico).*)',
  ],
};

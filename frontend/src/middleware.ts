import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('medisync_session')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Permitir archivos estáticos y assets públicos si llegaran al middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Si no hay token de sesión y no es página de login/registro, redirigir inmediatamente a /login
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya está autenticado e intenta ir a /login, redirigir a la página principal /
  if (token && pathname === '/login') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files with extensions (svg, png, jpg, jpeg, gif, webp, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

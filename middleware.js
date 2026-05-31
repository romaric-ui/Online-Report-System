import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicRoutes = [
  '/',
  '/bienvenue',
  '/inscription',
  '/verify-otp',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/admin-login',
];

export async function middleware(request) {
  const response = NextResponse.next();

  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown';
  response.headers.set('x-forwarded-for', ip);

  const { pathname } = request.nextUrl;

  // Routes publiques → pas de vérification
  const isPublic = publicRoutes.some(route => pathname === route)
    || pathname.startsWith('/invitation/')
    || pathname.startsWith('/api/')
    || pathname.startsWith('/_next/')
    || pathname.startsWith('/uploads/')
    || pathname.includes('.');

  if (isPublic) return response;

  // Vérifier la session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Pas connecté → retour à l'accueil
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Connecté via Google sans entreprise → bienvenue
  if (!token.entrepriseId && pathname !== '/bienvenue' && !pathname.startsWith('/dashboard') && !pathname.startsWith('/reports')) {
    return NextResponse.redirect(new URL('/bienvenue', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
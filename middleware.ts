import { NextResponse, type NextRequest } from 'next/server';
import { buildContentSecurityPolicy } from '@/lib/csp';
import { SITE_URL } from '@/lib/site';

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';

  // www.lavozriojana.com is a Cloudflare CNAME to the same app: without this
  // 301 the whole site is served twice. Cloudflare's own redirect rule (see
  // README_DEPLOY_HOSTINGER.md) answers first when set; this is the fallback.
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim();
  if (host.toLowerCase().startsWith('www.')) {
    const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, SITE_URL);
    return NextResponse.redirect(target, 301);
  }

  const response = NextResponse.next();
  // HTTPS only from now on; no includeSubDomains so other subdomains are not bound.
  if (!isDev) response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL || process.env.R2_PUBLIC_BASE_URL || 'https://media.lavozriojana.com';

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Policy and its reasons in lib/csp.ts.
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy({ isDev, mediaUrl }));

  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_API_ORIGINS || 'https://lavozriojana.com')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
